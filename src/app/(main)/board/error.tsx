'use client'

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

// Error boundary for board page
export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card variant="outlined" padding="lg" className="max-w-md w-full text-center">
        <CardContent className="p-0">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            건의사항을 불러오는 중 오류가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-6">
            일시적인 문제일 수 있습니다. 다시 시도해 주세요.
          </p>
          <Button
            onClick={reset}
            variant="primary"
            className="w-full"
          >
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
