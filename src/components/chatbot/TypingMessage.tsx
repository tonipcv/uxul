'use client';

import { useState, useEffect, useCallback } from 'react';

interface TypingMessageProps {
  content: string;
  onComplete?: () => void;
  speed?: number;
}

export default function TypingMessage({ content, onComplete, speed = 30 }: TypingMessageProps) {
  // Call onComplete immediately to mark message as not typing
  useEffect(() => {
    if (onComplete) {
      onComplete();
    }
  }, [content, onComplete]);

  // Return the full content immediately without animation
  return (
    <div className="whitespace-pre-wrap">
      {content}
    </div>
  );
} 