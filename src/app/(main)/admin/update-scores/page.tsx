'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function UpdateScoresPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpdate = async () => {
    if (!confirm('모든 건의사항의 priority_score를 업데이트하시겠습니까?\n\n이 작업은 시간이 걸릴 수 있습니다.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/suggestions/update-priority-scores', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        alert('업데이트가 완료되었습니다!');
      } else {
        alert(`오류 발생: ${data.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Priority Score 업데이트</h1>
          <p className="text-gray-600 mt-1">
            모든 건의사항의 위험지표(priority_score)를 주변 사고 데이터를 기반으로 재계산합니다.
          </p>
        </div>

        <Card variant="outlined" padding="md">
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h3>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>이 작업은 모든 건의사항을 순회하며 시간이 걸릴 수 있습니다.</li>
                  <li>각 건의사항의 위치를 기반으로 주변 사고 데이터를 조회합니다.</li>
                  <li>기존 priority_score 값은 덮어씌워집니다.</li>
                </ul>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={loading}
                loading={loading}
                variant="primary"
                className="w-full hover:cursor-pointer"
              >
                {loading ? '업데이트 중...' : 'Priority Score 업데이트 시작'}
              </Button>

              {result && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">업데이트 결과</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">전체 건의사항:</span>
                      <span className="font-medium">{result.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">업데이트 성공:</span>
                      <span className="font-medium text-green-600">{result.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">오류 발생:</span>
                      <span className="font-medium text-red-600">{result.errors}</span>
                    </div>
                  </div>

                  {result.errorDetails && result.errorDetails.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">오류 상세 (최대 10개)</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.errorDetails.map((error: string, index: number) => (
                          <li key={index} className="font-mono">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
