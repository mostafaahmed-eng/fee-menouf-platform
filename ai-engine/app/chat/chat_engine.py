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

logger = logging.getLogger("ai_engine.chat_engine")


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, dict] = {}

    def get_or_create(self, session_id: str) -> dict:
        if session_id not in self._sessions:
            self._sessions[session_id] = {
                "history": [],
                "created_at": datetime.utcnow().isoformat(),
                "token_usage": {"prompt": 0, "completion": 0, "total": 0},
            }
        return self._sessions[session_id]

    def get_history(self, session_id: str) -> list:
        session = self.get_or_create(session_id)
        return session["history"]

    def add_message(self, session_id: str, role: str, content: str, tokens: int = 0):
        session = self.get_or_create(session_id)
        session["history"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "tokens": tokens,
        })

    def clear_history(self, session_id: str):
        if session_id in self._sessions:
            self._sessions[session_id]["history"] = []

    def update_token_usage(self, session_id: str, prompt_tokens: int, completion_tokens: int):
        session = self.get_or_create(session_id)
        session["token_usage"]["prompt"] += prompt_tokens
        session["token_usage"]["completion"] += completion_tokens
        session["token_usage"]["total"] += prompt_tokens + completion_tokens


session_store = SessionStore()
rate_limiter = get_rate_limiter()


class ChatEngine:
    def __init__(self):
        self._openai_client = None

    def _get_openai_client(self):
        if self._openai_client is None and settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to create OpenAI client: {e}")
        return self._openai_client

    def _get_system_prompt(self, language: str) -> str:
        return SYSTEM_PROMPT_AR if language == "ar" else SYSTEM_PROMPT_EN

    def _build_messages(
        self,
        query: str,
        context: str,
        history: list,
        language: str,
        system_override: Optional[str] = None,
    ) -> list[dict]:
        system_content = system_override or self._get_system_prompt(language)

        if context:
            system_content += f"\n\n## Knowledge Base Context\n{context}"

        messages = [{"role": "system", "content": system_content}]

        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": query})

        return messages

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
        messages = self._build_messages(
            query=query,
            context=built_context["context"],
            history=history,
            language=language,
            system_override=system_prompt_override,
        )

        prompt_tokens = sum(count_tokens(m["content"]) for m in messages)

        if client:
            try:
                response = client.chat.completions.create(
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

                return {
                    "answer": answer,
                    "session_id": session_id,
                    "language": language,
                    "token_usage": {
                        "prompt": prompt_tokens,
                        "completion": completion_tokens,
                        "total": total_tokens,
                    },
                    "sources": built_context["retrieved_docs"],
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
            "sources": built_context["retrieved_docs"],
            "fallback": True,
        }

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
        messages = self._build_messages(
            query=query,
            context=built_context["context"],
            history=history,
            language=language,
        )

        session_store.add_message(session_id, "user", query, 0)

        if client:
            try:
                stream = client.chat.completions.create(
                    model=settings.MODEL_NAME,
                    messages=messages,
                    max_tokens=settings.MAX_TOKENS,
                    temperature=settings.TEMPERATURE,
                    stream=True,
                )

                full_answer = ""
                for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        full_answer += delta
                        yield f"data: {json.dumps({'content': delta})}\n\n"

                session_store.add_message(session_id, "assistant", full_answer, count_tokens(full_answer))
                yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"
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
