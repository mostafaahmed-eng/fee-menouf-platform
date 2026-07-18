import logging
import json
import asyncio
from typing import AsyncGenerator, Optional
from datetime import datetime

from app.config import settings
from app.chat.prompts import SYSTEM_PROMPT_EN, SYSTEM_PROMPT_AR
from app.chat.context_builder import context_builder
from app.chat.rule_based import rule_based_ai
from app.utils.text_processor import detect_language, count_tokens
from app.utils.rate_limiter import get_rate_limiter
from app.chat.session_store import SessionStore

logger = logging.getLogger("ai_engine.chat_engine")

session_store = SessionStore()
rate_limiter = get_rate_limiter()

CONVERSATION_SUMMARY_THRESHOLD = 20


class ChatEngine:
    def __init__(self):
        self._openai_client = None

    def _get_openai_client(self):
        if self._openai_client is None and settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to create OpenAI client: {e}")
        return self._openai_client

    def _get_system_prompt(self, language: str) -> str:
        return SYSTEM_PROMPT_AR if language == "ar" else SYSTEM_PROMPT_EN

    def _build_source_citations(self, retrieved_docs: list[dict]) -> str:
        if not retrieved_docs:
            return ""

        citations = []
        seen_sources = set()
        for doc in retrieved_docs:
            metadata = doc.get("metadata", {})
            source = metadata.get("source", "unknown")
            if source not in seen_sources:
                seen_sources.add(source)
                filename = source.split("/")[-1] if "/" in source else source
                filename = filename.replace(".md", "").replace(".txt", "").replace(".pdf", "")
                label = filename.replace("-", " ").replace("_", " ").title()
                citations.append(f"[Source: {label}]")

        return "\n".join(citations) if citations else ""

    async def _summarize_conversation(self, messages: list[dict], language: str) -> str:
        client = self._get_openai_client()
        if not client:
            return self._fallback_summarize(messages, language)

        older_messages = messages[:-10]
        formatted = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in older_messages
        )

        lang_instruction = (
            "لخص المحادثة التالية بالعربية في فقرة واحدة موجزة."
            if language == "ar"
            else "Summarize the following conversation in one concise paragraph."
        )

        try:
            response = await client.chat.completions.create(
                model=settings.MODEL_NAME,
                messages=[
                    {"role": "system", "content": lang_instruction},
                    {"role": "user", "content": formatted},
                ],
                max_tokens=300,
                temperature=0.3,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Conversation summarization failed: {e}")
            return self._fallback_summarize(messages, language)

    def _fallback_summarize(self, messages: list[dict], language: str) -> str:
        topics = set()
        for msg in messages:
            content = msg.get("content", "").lower()
            keywords = [
                "gpa", "معدل", "attendance", "حضور", "register", "تسجيل",
                "exam", "امتحان", "course", "مقرر", "graduate", "تخرج",
                "prerequisite", "متطلب", "transfer", "نقل",
            ]
            for kw in keywords:
                if kw in content:
                    topics.add(kw)

        if language == "ar":
            topics_str = "، ".join(topics) if topics else "_topics"
            return f"المحادثة تناولت المواضيع التالية: {topics_str}"
        else:
            topics_str = ", ".join(topics) if topics else "various topics"
        return f"The conversation covered the following topics: {topics_str}"

    def _build_messages(
        self,
        query: str,
        context: str,
        history: list,
        language: str,
        system_override: Optional[str] = None,
        retrieved_docs: Optional[list[dict]] = None,
    ) -> list[dict]:
        system_content = system_override or self._get_system_prompt(language)

        if context:
            citations = self._build_source_citations(retrieved_docs or [])
            context_section = f"\n\n## Knowledge Base Context\n{context}"
            if citations:
                context_section += f"\n\n{citations}"
            system_content += context_section

        messages = [{"role": "system", "content": system_content}]

        if len(history) > CONVERSATION_SUMMARY_THRESHOLD:
            summary = self._get_cached_summary(history, language)
            if summary:
                if language == "ar":
                    summary_msg = f"[ملخص المحادثة السابقة]: {summary}"
                else:
                    summary_msg = f"[Previous conversation summary]: {summary}"
                messages.append({"role": "system", "content": summary_msg})

        recent_start = max(0, len(history) - 10)
        for msg in history[recent_start:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": query})

        return messages

    def _get_cached_summary(self, history: list[dict], language: str) -> Optional[str]:
        if not hasattr(self, "_summary_cache"):
            self._summary_cache = {}

        history_hash = hash(tuple((m["role"], m["content"][:50]) for m in history[:-10]))
        cache_key = f"{history_hash}_{language}"

        if cache_key in self._summary_cache:
            return self._summary_cache[cache_key]

        return None

    def _cache_summary(self, history: list[dict], language: str, summary: str):
        if not hasattr(self, "_summary_cache"):
            self._summary_cache = {}

        history_hash = hash(tuple((m["role"], m["content"][:50]) for m in history[:-10]))
        cache_key = f"{history_hash}_{language}"
        self._summary_cache[cache_key] = summary

        if len(self._summary_cache) > 100:
            oldest_keys = list(self._summary_cache.keys())[:50]
            for key in oldest_keys:
                del self._summary_cache[key]

    async def send_message(
        self,
        query: str,
        session_id: str,
        student_data: Optional[dict] = None,
        system_prompt_override: Optional[str] = None,
    ) -> dict:
        client = self._get_openai_client()
        language = detect_language(query)

        built_context = context_builder.build_chat_context(
            query=query,
            student_data=student_data,
        )

        history = session_store.get_history(session_id)

        if len(history) > CONVERSATION_SUMMARY_THRESHOLD and not self._get_cached_summary(history, language):
            summary = await self._summarize_conversation(history, language)
            self._cache_summary(history, language, summary)

        messages = self._build_messages(
            query=query,
            context=built_context["context"],
            history=history,
            language=language,
            system_override=system_prompt_override,
            retrieved_docs=built_context.get("retrieved_docs", []),
        )

        prompt_tokens = sum(count_tokens(m["content"]) for m in messages)

        if client:
            try:
                response = await client.chat.completions.create(
                    model=settings.MODEL_NAME,
                    messages=messages,
                    max_tokens=settings.MAX_TOKENS,
                    temperature=settings.TEMPERATURE,
                )

                answer = response.choices[0].message.content or ""
                completion_tokens = response.usage.completion_tokens if response.usage else count_tokens(answer)
                total_tokens = response.usage.total_tokens if response.usage else (prompt_tokens + completion_tokens)

                session_store.add_message(session_id, "user", query, prompt_tokens)
                session_store.add_message(session_id, "assistant", answer, completion_tokens)
                session_store.update_token_usage(session_id, prompt_tokens, completion_tokens)

                sources = self._format_sources_for_response(built_context.get("retrieved_docs", []))

                return {
                    "answer": answer,
                    "session_id": session_id,
                    "language": language,
                    "token_usage": {
                        "prompt": prompt_tokens,
                        "completion": completion_tokens,
                        "total": total_tokens,
                    },
                    "sources": sources,
                }

            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}")

        answer = self._generate_fallback(query, built_context, language)

        session_store.add_message(session_id, "user", query, prompt_tokens)
        session_store.add_message(session_id, "assistant", answer, 0)

        return {
            "answer": answer,
            "session_id": session_id,
            "language": language,
            "token_usage": {"prompt": prompt_tokens, "completion": 0, "total": prompt_tokens},
            "sources": [],
            "fallback": True,
        }

    def _format_sources_for_response(self, retrieved_docs: list[dict]) -> list[dict]:
        sources = []
        seen = set()
        for doc in retrieved_docs:
            metadata = doc.get("metadata", {})
            source = metadata.get("source", "unknown")
            if source not in seen:
                seen.add(source)
                filename = source.split("/")[-1] if "/" in source else source
                filename = filename.replace(".md", "").replace(".txt", "").replace(".pdf", "")
                label = filename.replace("-", " ").replace("_", " ").title()
                sources.append({
                    "source": source,
                    "label": label,
                    "chunk_text_preview": doc.get("text", "")[:150],
                })
        return sources

    async def send_message_stream(
        self,
        query: str,
        session_id: str,
        student_data: Optional[dict] = None,
    ) -> AsyncGenerator[str, None]:
        client = self._get_openai_client()
        language = detect_language(query)

        built_context = context_builder.build_chat_context(
            query=query,
            student_data=student_data,
        )

        history = session_store.get_history(session_id)

        if len(history) > CONVERSATION_SUMMARY_THRESHOLD and not self._get_cached_summary(history, language):
            summary = await self._summarize_conversation(history, language)
            self._cache_summary(history, language, summary)

        messages = self._build_messages(
            query=query,
            context=built_context["context"],
            history=history,
            language=language,
            retrieved_docs=built_context.get("retrieved_docs", []),
        )

        session_store.add_message(session_id, "user", query, 0)

        if client:
            try:
                stream = await client.chat.completions.create(
                    model=settings.MODEL_NAME,
                    messages=messages,
                    max_tokens=settings.MAX_TOKENS,
                    temperature=settings.TEMPERATURE,
                    stream=True,
                )

                full_answer = ""
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        full_answer += delta
                        yield f"data: {json.dumps({'content': delta})}\n\n"

                session_store.add_message(session_id, "assistant", full_answer, count_tokens(full_answer))
                sources = self._format_sources_for_response(built_context.get("retrieved_docs", []))
                yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'sources': sources})}\n\n"
                return

            except Exception as e:
                logger.error(f"OpenAI stream failed: {e}")

        answer = self._generate_fallback(query, built_context, language)
        for word in answer.split():
            yield f"data: {json.dumps({'content': word + ' '})}\n\n"
            await asyncio.sleep(0.02)

        session_store.add_message(session_id, "assistant", answer, 0)
        yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'fallback': True})}\n\n"

    def get_suggestions(self, context: Optional[str] = None, count: int = 4) -> list[str]:
        suggestions = [
            "What courses should I register for next semester?",
            "Tell me about the faculty's attendance policy",
            "Am I on track to graduate on time?",
            "How can I improve my GPA?",
        ]
        if context and "ar" in context.lower():
            suggestions = [
                "ما هي المقررات التي يجب أن أسجلها في الفصل القادم؟",
                "أخبرني عن سياسة الحضور في الكلية",
                "هل أنا على المسار الصحيح للتخرج في الوقت المحدد؟",
                "كيف يمكنني تحسين معدلي التراكمي؟",
            ]
        return suggestions[:count]

    def _generate_fallback(self, query: str, context_data: dict, language: str) -> str:
        rule_response = rule_based_ai.respond(query, language)
        if rule_response:
            logger.info(f"Rule-based response for query: {query[:50]}")
            return rule_response

        logger.warning(f"No rule-based match for query: {query[:80]}. Returning default message.")

        if language == "ar":
            return (
                "عذراً، لا أستطيع الإجابة على هذا السؤال حالياً. "
                "يمكنني مساعدتك في:\n"
                "• سياسة الحضور والغياب\n"
                "• كيفية حساب المعدل التراكمي\n"
                "• التسجيل في المقررات\n"
                "• متطلبات التخرج\n"
                "• معلومات التواصل\n"
                "• نظام الامتحانات\n"
                "• المرشد الأكاديمي\n\n"
                "يرجى إعادة صياغة سؤالك أو اختيار أحد المواضيع أعلاه."
            )
        else:
            return (
                "Sorry, I cannot answer this question right now. "
                "I can help you with:\n"
                "• Attendance and absence policy\n"
                "• How to calculate GPA/CGPA\n"
                "• Course registration\n"
                "• Graduation requirements\n"
                "• Contact information\n"
                "• Exam regulations\n"
                "• Academic advisor\n\n"
                "Please rephrase your question or choose one of the topics above."
            )


chat_engine = ChatEngine()
