'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD_PX = 120;

export function useSmartScroll(scrollSignal: string, scopeKey: string | null) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const checkIsNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceToBottom <= BOTTOM_THRESHOLD_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    shouldFollowRef.current = true;
    setShowJumpToLatest(false);
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const isNearBottom = checkIsNearBottom();
    shouldFollowRef.current = isNearBottom;
    setShowJumpToLatest(!isNearBottom);
  }, [checkIsNearBottom]);

  useEffect(() => {
    if (shouldFollowRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrollSignal]);

  useEffect(() => {
    shouldFollowRef.current = true;

    requestAnimationFrame(() => {
      setShowJumpToLatest(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
  }, [scopeKey]);

  return {
    scrollContainerRef,
    messagesEndRef,
    showJumpToLatest,
    handleScroll,
    scrollToBottom,
  };
}
