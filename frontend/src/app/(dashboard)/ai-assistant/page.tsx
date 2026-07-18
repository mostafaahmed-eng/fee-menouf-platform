'use client';



import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/use-translation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import AiBadge from '@/components/ai/ai-badge';
import type { ChatMessage, ChatSession } from '@/lib/types';
import dynamic from 'next/dynamic';
import ChatInput from './components/chat-input';
import ChatHistory from './components/chat-history';
import SuggestedQuestions from './components/suggested-questions';
import TypingIndicator from './components/typing-indicator';

const ChatMessageComponent = dynamic(() => import('./components/chat-message'), {
  loading: () => <div className="h-16 animate-pulse rounded-lg bg-muted/50" />,
  ssr: false,
});

const defaultQuestions = [
  'ما هو موعد التسجيل لهذا الفصل؟',
  'كيف يمكنني حساب المعدل التراكمي؟',
  'ما هي متطلبات التخرج؟',
  'ما هي المواد المتاحة هذا الفصل؟',
  'كيف أتواصل مع المرشد الأكاديمي؟',
  'ما هي سياسة الحضور والغياب؟',
];

export default function AiAssistantPage() {
  const { direction } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً بك في المساعد الذكي لكلية الهندسة - جامعة المنوفية! 👋\n\nأنا هنا لمساعدتك في:\n- الإجابة عن استفساراتك الأكاديمية\n- تقديم نصائح حول التسجيل في المواد\n- اقتراح الجداول الدراسية\n- تحليل المخاطر الأكاديمية\n\nكيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [showHistory, setShowHistory] = useState(false);
  const [currentSession, setCurrentSession] = useState('default');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const { data: sessions, isLoading: sessionsLoading, isError: sessionsError, refetch: refetchSessions } = useQuery<ChatSession[]>({
    queryKey: ['ai', 'sessions'],
    queryFn: () => api.get('/ai/sessions').then((r) => r.data.data),
  });

  const chatMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post('/ai/chat', { message: content, language });
      return res.data.data;
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  const addAssistantMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleSend = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const token = (() => {
      try {
        const raw = localStorage.getItem('auth-storage');
        return raw ? JSON.parse(raw).state?.token : null;
      } catch { return null; }
    })();
    try {
      const response = await fetch(`/ai/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: content, language }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';
        let streamMessageId = (Date.now() + 1).toString();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.content) {
                accumulated += parsed.content;
              }
            } catch {}
          }

          setMessages((prev) => {
            const exists = prev.find((m) => m.id === streamMessageId);
            if (exists) {
              return prev.map((m) => (m.id === streamMessageId ? { ...m, content: accumulated } : m));
            }
            return [
              ...prev,
              {
                id: streamMessageId,
                role: 'assistant' as const,
                content: accumulated,
                timestamp: new Date().toISOString(),
              },
            ];
          });
        }
      } else {
        const result = await chatMutation.mutateAsync(content);
        addAssistantMessage(result.reply || result.message || 'عذراً، حدث خطأ في معالجة طلبك.');
      }
    } catch {
      try {
        const result = await chatMutation.mutateAsync(content);
        addAssistantMessage(result.reply || result.message || 'عذراً، حدث خطأ في معالجة طلبك.');
      } catch {
        addAssistantMessage('عذراً، حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.');
        toast.error('فشل الاتصال بالمساعد الذكي');
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewSession = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'مرحباً بك في المساعد الذكي! كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date().toISOString(),
      },
    ]);
    setCurrentSession(Date.now().toString());
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedback: m.feedback === type ? null : type } : m,
      ),
    );
  };

  const handleDeleteSession = (_id: string) => {
    toast.success('تم حذف المحادثة');
  };

  if (sessionsLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden animate-pulse" dir={direction}>
        <div className="w-72 border-l flex flex-col bg-muted/20">
          <div className="flex items-center justify-between border-b p-3">
            <div className="h-5 w-16 rounded bg-muted-foreground/20" />
            <div className="h-8 w-8 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex-1 p-2 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded-lg bg-muted-foreground/20" />
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted-foreground/20" />
              <div>
                <div className="h-4 w-24 rounded bg-muted-foreground/20" />
                <div className="h-3 w-12 rounded bg-muted-foreground/20 mt-1" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex-1 mx-auto max-w-3xl w-full py-4 space-y-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="space-y-2">
                  <div className={`h-4 rounded bg-muted-foreground/20 ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
                  <div className={`h-4 rounded bg-muted-foreground/20 ${i % 2 === 0 ? 'w-48' : 'w-32'}`} />
                  <div className="h-3 w-16 rounded bg-muted-foreground/20" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-4">
            <div className="mx-auto max-w-4xl">
              <div className="h-12 w-full rounded-2xl bg-muted-foreground/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center" dir={direction}>
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">فشل تحميل المحادثات</h2>
          <p className="text-sm text-muted-foreground">حدث خطأ في الاتصال بالخادم</p>
          <Button variant="outline" onClick={() => refetchSessions()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" dir={direction}>
      <ChatHistory
        sessions={sessions || []}
        currentSessionId={currentSession}
        onSelectSession={setCurrentSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={showHistory && !sessionsLoading}
        onToggle={() => setShowHistory(!showHistory)}
      />

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-medium">المساعد الذكي</h1>
              <p className="text-[10px] text-muted-foreground">AI متصل</p>
            </div>
          </div>
          <AiBadge size="sm" />
        </div>

        <ScrollArea ref={scrollRef} className="flex-1">
          <div className="mx-auto max-w-3xl py-4">
            <AnimatePresence>
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 px-4"
                >
                  <div className="text-center space-y-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg"
                    >
                      <Sparkles className="h-8 w-8 text-white" />
                    </motion.div>
                    <h2 className="text-lg font-bold">مرحباً بك في المساعد الذكي</h2>
                    <p className="text-sm text-muted-foreground">
                      كلية الهندسة - جامعة المنوفية
                    </p>
                  </div>

                  <SuggestedQuestions
                    questions={defaultQuestions}
                    onSelect={handleSend}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {messages.map((msg) => (
                <ChatMessageComponent
                  key={msg.id}
                  message={msg}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>

            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <ChatInput
          onSend={handleSend}
          isLoading={isTyping}
          language={language}
          onLanguageToggle={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        />
      </div>
    </div>
  );
}
