'use client';

import { AlertCircle, X } from 'lucide-react';

interface AlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function Alert({
  title = 'Error',
  message,
  onDismiss,
  onRetry,
}: AlertProps) {
  return (
    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-200">{title}</h3>
          <p className="text-red-300 text-sm mt-1">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-100 transition-colors hover:bg-red-800/50"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded p-1 text-red-400 transition-colors hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
