'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  questions: string[];
  className?: string;
}

export default function SuggestedQuestions({
  onSelect,
  questions,
  className,
}: SuggestedQuestionsProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        أسئلة مقترحة
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(question)}
            className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {question}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
