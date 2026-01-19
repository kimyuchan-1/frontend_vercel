'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface WarningBannerProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

/**
 * WarningBanner Component
 * 
 * Displays a warning message when KPI data is unavailable and fallback data is shown.
 * Provides a retry button to attempt fetching data again.
 * Can be dismissed by the user, but will reappear on page refresh if data is still unavailable.
 * 
 * @param onRetry - Callback function to trigger data retry
 * @param isRetrying - Optional flag indicating if a retry is in progress
 */
export default function WarningBanner({ onRetry, isRetrying = false }: WarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md shadow-sm">
      <div className="flex items-start">
        {/* Warning Icon */}
        <div className="shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Data Unavailable
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Unable to load KPI data from the server. Displaying default values. 
              This may be due to a temporary network issue or server unavailability.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              loading={isRetrying}
              disabled={isRetrying}
              className="bg-white border-yellow-600 text-yellow-800 hover:bg-yellow-50"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
            aria-label="Dismiss warning"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
