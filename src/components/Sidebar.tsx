'use client';

import React, { useState } from 'react';
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  AlertOctagon,
  Mail,
  Calendar,
  Users,
  CheckSquare,
  Keyboard,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ConnectionStatus } from '@/types/mail';

interface SidebarProps {
  mailboxUpn?: string;
  unreadCount?: number;
  totalCount?: number;
  connectionStatus: ConnectionStatus | null;
  onOpenDiagnostics: () => void;
  onOpenShortcuts: () => void;
  activeFolder?: string;
}

export function Sidebar({
  mailboxUpn,
  unreadCount = 0,
  totalCount,
  connectionStatus,
  onOpenDiagnostics,
  onOpenShortcuts,
  activeFolder = 'inbox',
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const folders = [
    {
      id: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      count: unreadCount,
      active: activeFolder === 'inbox',
      disabled: false,
    },
    {
      id: 'sent',
      name: 'Sent Items',
      icon: Send,
      count: 0,
      active: false,
      disabled: true,
      hint: 'Read-only Inbox in MVP',
    },
    {
      id: 'drafts',
      name: 'Drafts',
      icon: FileText,
      count: 0,
      active: false,
      disabled: true,
    },
    {
      id: 'archive',
      name: 'Archive',
      icon: Archive,
      count: 0,
      active: false,
      disabled: true,
    },
    {
      id: 'deleted',
      name: 'Deleted Items',
      icon: Trash2,
      count: 0,
      active: false,
      disabled: true,
    },
    {
      id: 'junk',
      name: 'Junk Email',
      icon: AlertOctagon,
      count: 0,
      active: false,
      disabled: true,
    },
  ];

  return (
    <aside className="flex h-full select-none bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shrink-0 overflow-hidden">
      {/* Mini App Rail (Classic Outlook SaaS styling) */}
      <div className="w-12 flex flex-col items-center py-3 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-full">
        <div className="w-8 h-8 rounded-lg bg-outlook-600 flex items-center justify-center text-white shadow-xs mb-5">
          <Mail className="w-4 h-4" />
        </div>

        <div className="flex flex-col items-center gap-3.5 text-slate-400 dark:text-slate-500">
          <button
            title="Mail (Active)"
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-outlook-600 dark:text-outlook-400 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            title="Calendar (Read-only scope in this release)"
            disabled
            className="p-2 rounded-lg hover:text-slate-600 dark:hover:text-slate-300 opacity-40 cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            title="Contacts (Read-only scope in this release)"
            disabled
            className="p-2 rounded-lg hover:text-slate-600 dark:hover:text-slate-300 opacity-40 cursor-not-allowed"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            title="Tasks (Read-only scope in this release)"
            disabled
            className="p-2 rounded-lg hover:text-slate-600 dark:hover:text-slate-300 opacity-40 cursor-not-allowed"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-2">
          {/* Toggle sidebar collapse */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Folders' : 'Collapse Folders'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hidden md:block"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Folder Navigation Pane */}
      {!isCollapsed && (
        <div className="w-56 shrink-0 flex flex-col h-full p-3 justify-between overflow-hidden">
          <div className="overflow-y-auto no-scrollbar">
            {/* Header & Mailbox Info */}
            <div className="mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm tracking-tight truncate">
                  Inbox Explorer
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-outlook-100 dark:bg-outlook-950 text-outlook-700 dark:text-outlook-300 rounded border border-outlook-200 dark:border-outlook-800 shrink-0">
                  OIDC
                </span>
              </div>

              <div className="mt-2.5 p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Configured Mailbox
                </div>
                <div
                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5"
                  title={mailboxUpn}
                >
                  {mailboxUpn || 'Exchange Mailbox'}
                </div>
              </div>
            </div>

            {/* Folder List */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Folders
              </div>

              {folders.map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.id}
                    disabled={folder.disabled}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-left overflow-hidden ${
                      folder.active
                        ? 'bg-outlook-50 dark:bg-outlook-950/60 text-outlook-700 dark:text-outlook-300 font-semibold border-l-2 border-outlook-600'
                        : folder.disabled
                        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                    title={folder.hint}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${folder.active ? 'text-outlook-600 dark:text-outlook-400' : 'text-slate-400'}`} />
                      <span className="truncate">{folder.name}</span>
                    </div>

                    {folder.active && folder.count > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-outlook-600 text-white shrink-0 ml-1">
                        {folder.count}
                      </span>
                    )}
                    {folder.disabled && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-600 shrink-0 ml-1">
                        —
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connectivity Diagnostics Card */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={onOpenDiagnostics}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left group overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-outlook-600 dark:group-hover:text-outlook-400 truncate">
                  Exchange Link
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    connectionStatus?.status === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : connectionStatus?.status === 'dev_mock'
                      ? 'bg-blue-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                <Activity className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  {connectionStatus?.status === 'connected'
                    ? 'Connected (RBAC Active)'
                    : connectionStatus?.status === 'dev_mock'
                    ? 'Dev Mock Mode'
                    : 'Check Connection'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
