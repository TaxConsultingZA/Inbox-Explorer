'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MessageList } from '@/components/MessageList';
import { ReadingPane } from '@/components/ReadingPane';
import { ConnectionStatusModal } from '@/components/ConnectionStatusModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { GraphMessage, ConnectionStatus, InboxResponse } from '@/types/mail';

export default function InboxExplorerPage() {
  const [messages, setMessages] = useState<GraphMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'all' | 'subject' | 'from' | 'body'>('all');

  // Filters
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const [filterHasAttachments, setFilterHasAttachments] = useState<boolean>(false);
  const [filterHighImportance, setFilterHighImportance] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<'all' | '24hours' | 'today' | '7days' | '30days'>('all');

  // Pagination with default safe pull size (15) to avoid IT gateway / SOC monitoring triggers
  const [pageSize, setPageSize] = useState<number>(15);
  const [nextLink, setNextLink] = useState<string | undefined>(undefined);
  const [historyPages, setHistoryPages] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Status & Modals
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Connection Status
  const fetchConnectionStatus = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const res = await fetch('/api/mail/connection-status');
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  // Fetch Inbox Messages
  const fetchMessages = useCallback(
    async (targetNextLink?: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();

        if (targetNextLink) {
          params.set('nextLink', targetNextLink);
        } else {
          if (debouncedSearch.trim()) {
            params.set('search', debouncedSearch.trim());
            if (searchScope !== 'all') {
              params.set('searchScope', searchScope);
            }
          }
          if (filterUnreadOnly) params.set('isRead', 'false');
          if (filterHasAttachments) params.set('hasAttachments', 'true');
          params.set('top', pageSize.toString());

          if (dateRange === '24hours') {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            params.set('startDate', twentyFourHoursAgo.toISOString());
          } else if (dateRange === 'today') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            params.set('startDate', startOfToday.toISOString());
          } else if (dateRange === '7days') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            params.set('startDate', sevenDaysAgo.toISOString());
          } else if (dateRange === '30days') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            params.set('startDate', thirtyDaysAgo.toISOString());
          }
        }

        const res = await fetch(`/api/mail/inbox?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data: InboxResponse = await res.json();
        setMessages(data.value || []);
        setNextLink(data.nextLink);

        // Auto-select first message only on large desktops (width >= 1024px)
        if (!selectedMessageId && data.value && data.value.length > 0) {
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            setSelectedMessageId(data.value[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading inbox:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, searchScope, filterUnreadOnly, filterHasAttachments, dateRange, pageSize, selectedMessageId]
  );

  useEffect(() => {
    setHistoryPages([]);
    setCurrentPageIndex(0);
    fetchMessages();
  }, [debouncedSearch, searchScope, filterUnreadOnly, filterHasAttachments, dateRange, pageSize]);

  // Next page navigation
  const handleNextPage = () => {
    if (!nextLink) return;
    setHistoryPages((prev) => [...prev, nextLink]);
    setCurrentPageIndex((prev) => prev + 1);
    fetchMessages(nextLink);
  };

  // Previous page navigation
  const handlePrevPage = () => {
    if (currentPageIndex <= 0) return;
    const newHistory = [...historyPages];
    newHistory.pop();
    const prevUrl = newHistory[newHistory.length - 1];
    setHistoryPages(newHistory);
    setCurrentPageIndex((prev) => prev - 1);
    fetchMessages(prevUrl);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/' || e.key === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'r') {
        e.preventDefault();
        fetchMessages();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (messages.length === 0) return;
        const currentIndex = messages.findIndex((m) => m.id === selectedMessageId);
        const nextIndex = currentIndex < messages.length - 1 ? currentIndex + 1 : 0;
        setSelectedMessageId(messages[nextIndex].id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (messages.length === 0) return;
        const currentIndex = messages.findIndex((m) => m.id === selectedMessageId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : messages.length - 1;
        setSelectedMessageId(messages[prevIndex].id);
      } else if (e.key === 'Escape') {
        setIsDiagnosticsOpen(false);
        setIsShortcutsOpen(false);
        if (window.innerWidth < 1024) {
          setSelectedMessageId(undefined);
        }
      } else if (e.key === '?') {
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages, selectedMessageId, fetchMessages]);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Pane A: Sidebar */}
      <div className="hidden md:flex shrink-0 h-full overflow-hidden">
        <Sidebar
          mailboxUpn={connectionStatus?.mailboxUpn}
          unreadCount={unreadCount}
          totalCount={connectionStatus?.messageCount}
          connectionStatus={connectionStatus}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      </div>

      {/* Pane B: Message List */}
      <div
        className={`w-full md:w-[320px] lg:w-[360px] xl:w-[400px] shrink-0 h-full overflow-hidden min-w-0 ${
          selectedMessageId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <MessageList
          messages={messages}
          selectedMessageId={selectedMessageId}
          onSelectMessage={(id) => setSelectedMessageId(id)}
          isLoading={isLoading}
          onRefresh={() => fetchMessages()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchScope={searchScope}
          onSearchScopeChange={setSearchScope}
          filterUnreadOnly={filterUnreadOnly}
          onToggleUnreadOnly={() => setFilterUnreadOnly(!filterUnreadOnly)}
          filterHasAttachments={filterHasAttachments}
          onToggleHasAttachments={() => setFilterHasAttachments(!filterHasAttachments)}
          filterHighImportance={filterHighImportance}
          onToggleHighImportance={() => setFilterHighImportance(!filterHighImportance)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          hasNextPage={Boolean(nextLink)}
          onNextPage={handleNextPage}
          hasPrevPage={currentPageIndex > 0}
          onPrevPage={handlePrevPage}
          searchInputRef={searchInputRef}
        />
      </div>

      {/* Pane C: Reading Pane */}
      <div
        className={`flex-1 h-full min-w-0 max-w-full overflow-hidden ${
          selectedMessageId ? 'flex' : 'hidden md:flex'
        }`}
      >
        <ReadingPane
          messageId={selectedMessageId}
          onClose={() => setSelectedMessageId(undefined)}
        />
      </div>

      {/* Diagnostic & Help Modals */}
      <ConnectionStatusModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        status={connectionStatus}
        isLoading={isCheckingConnection}
        onRefresh={fetchConnectionStatus}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
