'use client'

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card variant="outlined" padding="lg" className="max-w-md w-full text-center">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            대시보드 로딩 실패
          </h2>
          <p className="text-gray-600 mb-6">
            대시보드 데이터를 불러오는 중 문제가 발생했습니다.
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
