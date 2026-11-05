'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '@/types/mail';

interface ConnectionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ConnectionStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ConnectionStatusModal({
  isOpen,
  onClose,
  status,
  isLoading,
  onRefresh,
}: ConnectionStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-outlook-600 dark:text-outlook-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Exchange Online Connectivity Diagnostics
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-lg flex items-start gap-3 border ${
              status?.status === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                : status?.status === 'dev_mock'
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200'
            }`}
          >
            {status?.status === 'connected' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : status?.status === 'dev_mock' ? (
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {status?.status === 'connected'
                  ? 'Connected to Exchange Online Mailbox'
                  : status?.status === 'dev_mock'
                  ? 'Local Development Mode (Mock Exchange Data)'
                  : 'Connectivity or Configuration Issue Detected'}
              </h4>
              <p className="text-xs mt-1 opacity-90">
                {status?.errorMessage ||
                  (status?.status === 'connected'
                    ? 'Microsoft Entra app credentials verified. Graph API access to target mailbox confirmed.'
                    : 'Operating with local fixtures. Real Entra credentials have not been configured yet.')}
              </p>
            </div>
          </div>

          {/* Diagnostic Checks Checklist */}
          <div className="space-y-2.5">
            <h5 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              System Configuration & Authorization Checks
            </h5>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md">
              <CheckRow
                label="Target Mailbox UPN"
                status={status?.mailboxUpnConfigured ?? false}
                detail={status?.mailboxUpn || 'Not configured'}
              />
              <CheckRow
                label="Entra Tenant ID (Directory GUID)"
                status={status?.tenantIdConfigured ?? false}
                detail={status?.tenantIdConfigured ? 'Configured' : 'Missing'}
              />
              <CheckRow
                label="Entra Application (Client) ID"
                status={status?.clientIdConfigured ?? false}
                detail={status?.clientIdConfigured ? 'Configured' : 'Missing'}
              />
              <CheckRow
                label="Confidential Client Secret"
                status={status?.clientSecretConfigured ?? false}
                detail={status?.clientSecretConfigured ? 'Loaded securely server-side' : 'Missing'}
              />
              <CheckRow
                label="MSAL Token Acquisition (.default scope)"
                status={status?.tokenAcquisitionSuccessful ?? false}
                detail={status?.tokenAcquisitionSuccessful ? 'Access token acquired & cached' : 'Failed'}
              />
              <CheckRow
                label="Exchange Online Inbox Access"
                status={status?.mailboxReachable ?? false}
                detail={
                  status?.mailboxReachable
                    ? `Inbox reachable (${status?.messageCount ?? 0} items)`
                    : 'Unreachable / 403 Forbidden'
                }
              />
            </div>
          </div>

          {/* RBAC Note */}
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-800">
            <strong>Security Reminder:</strong> The application uses app-only credentials scoped via Exchange Online RBAC for Applications.
            Never grant broad Mail.Read to all mailboxes in the tenant without scoping.
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Re-test Connectivity
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-outlook-600 hover:bg-outlook-700 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ label, status, detail }: { label: string; status: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-2">
        {status ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        )}
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px]">
        {detail}
      </span>
    </div>
  );
}

