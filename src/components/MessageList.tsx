'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Paperclip,
  AlertCircle,
  RefreshCw,
  MailCheck,
  Mail,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  Calendar,
} from 'lucide-react';
import { GraphMessage } from '@/types/mail';

interface MessageListProps {
  messages: GraphMessage[];
  selectedMessageId?: string;
  onSelectMessage: (id: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterUnreadOnly: boolean;
  onToggleUnreadOnly: () => void;
  filterHasAttachments: boolean;
  onToggleHasAttachments: () => void;
  filterHighImportance: boolean;
  onToggleHighImportance: () => void;
  dateRange: 'all' | 'today' | '7days' | '30days';
  onDateRangeChange: (range: 'all' | 'today' | '7days' | '30days') => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hasNextPage: boolean;
  onNextPage: () => void;
  hasPrevPage: boolean;
  onPrevPage: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function MessageList({
  messages,
  selectedMessageId,
  onSelectMessage,
  isLoading,
  onRefresh,
  searchQuery,
  onSearchChange,
  filterUnreadOnly,
  onToggleUnreadOnly,
  filterHasAttachments,
  onToggleHasAttachments,
  filterHighImportance,
  onToggleHighImportance,
  dateRange,
  onDateRangeChange,
  pageSize,
  onPageSizeChange,
  hasNextPage,
  onNextPage,
  hasPrevPage,
  onPrevPage,
  searchInputRef,
}: MessageListProps) {
  const [groupByConversation, setGroupByConversation] = useState(false);

  // Conversation thread grouping
  const conversationCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const msg of messages) {
      if (msg.conversationId) {
        map.set(msg.conversationId, (map.get(msg.conversationId) || 0) + 1);
      }
    }
    return map;
  }, [messages]);

  // If grouping is enabled, we only show the newest message per conversationId, with thread count badge
  const displayedMessages = useMemo(() => {
    if (!groupByConversation) return messages;

    const seenConversations = new Set<string>();
    const uniqueMessages: GraphMessage[] = [];

    for (const msg of messages) {
      if (msg.conversationId) {
        if (!seenConversations.has(msg.conversationId)) {
          seenConversations.add(msg.conversationId);
          uniqueMessages.push(msg);
        }
      } else {
        uniqueMessages.push(msg);
      }
    }

    return uniqueMessages;
  }, [messages, groupByConversation]);

  const activeFiltersCount =
    (filterUnreadOnly ? 1 : 0) +
    (filterHasAttachments ? 1 : 0) +
    (filterHighImportance ? 1 : 0) +
    (dateRange !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, subject, content (/)"
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-outlook-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {/* Unread Pill */}
            <button
              onClick={onToggleUnreadOnly}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                filterUnreadOnly
                  ? 'bg-outlook-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Unread
            </button>

            {/* Attachments Pill */}
            <button
              onClick={onToggleHasAttachments}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                filterHasAttachments
                  ? 'bg-outlook-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Paperclip className="w-3 h-3" />
              Files
            </button>

            {/* High Importance Pill */}
            <button
              onClick={onToggleHighImportance}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                filterHighImportance
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Important
            </button>

            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value as any)}
              className="px-2 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
              title="Filter by received date"
            >
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>

            {/* Conversation Grouping Toggle */}
            <button
              onClick={() => setGroupByConversation(!groupByConversation)}
              className={`p-1.5 rounded-md transition-colors shrink-0 ${
                groupByConversation
                  ? 'bg-outlook-100 dark:bg-outlook-950 text-outlook-600 dark:text-outlook-400 font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={groupByConversation ? 'Conversation Grouping: ON' : 'Conversation Grouping: OFF'}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 shrink-0"
            title="Refresh inbox (R)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-outlook-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Message Items Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {isLoading && messages.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="animate-pulse space-y-2 p-3 rounded-md bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                </div>
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 h-64">
            <Mail className="w-10 h-10 mb-2 stroke-[1.2] text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No emails found</p>
            <p className="text-[11px] mt-1 max-w-xs">
              {activeFiltersCount > 0 || searchQuery
                ? 'Try adjusting your search query or removing filters.'
                : 'The configured Exchange Online Inbox has no messages.'}
            </p>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const isSelected = msg.id === selectedMessageId;
            const threadCount = msg.conversationId ? conversationCounts.get(msg.conversationId) || 1 : 1;
            const senderName = msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unknown Sender';
            const formattedDate = formatTimestamp(msg.receivedDateTime);

            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage(msg.id)}
                className={`group relative p-3 cursor-pointer transition-colors text-left border-l-4 ${
                  isSelected
                    ? 'bg-outlook-50/80 dark:bg-outlook-950/40 border-l-outlook-600'
                    : !msg.isRead
                    ? 'bg-white dark:bg-slate-900 border-l-outlook-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    : 'bg-white dark:bg-slate-900 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Header row: Sender name, indicators, timestamp */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!msg.isRead && (
                      <span className="w-2 h-2 rounded-full bg-outlook-600 shrink-0" title="Unread" />
                    )}
                    <span
                      className={`text-xs truncate ${
                        !msg.isRead
                          ? 'font-bold text-slate-900 dark:text-slate-100'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {senderName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500">
                    {msg.importance === 'high' && (
                      <span title="High Importance">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      </span>
                    )}
                    {msg.hasAttachments && (
                      <span title="Has Attachments">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </span>
                    )}
                    {groupByConversation && threadCount > 1 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {threadCount}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 ml-1">
                      {formattedDate}
                    </span>
                  </div>
                </div>

                {/* Subject */}
                <div
                  className={`text-xs truncate mb-1 ${
                    !msg.isRead
                      ? 'font-semibold text-slate-900 dark:text-white'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {msg.subject || '(No Subject)'}
                </div>

                {/* Body Preview snippet */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {msg.bodyPreview || 'No preview available'}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
          <span>Page Size:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrevPage}
            disabled={!hasPrevPage || isLoading}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextPage}
            disabled={!hasNextPage || isLoading}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(isoDateString?: string): string {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

