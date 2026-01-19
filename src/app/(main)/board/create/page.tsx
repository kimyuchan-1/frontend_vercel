'use client'

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

// 지도 컴포넌트 (위치 선택용)
const LocationPicker = dynamic(() => import('../../../../components/board/map/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">지도를 불러오는 중...</div>
    </div>
  ),
});

// 위치 정보 패널 (위험/안전 지수 표시)
const LocationInfoPanel = dynamic(() => import('../../../../components/board/map/LocationInfoPanel'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border bg-gray-50 p-6">
      <div className="text-center text-gray-500">
        <div className="text-sm font-medium">위치 정보 로딩 중...</div>
      </div>
    </div>
  ),
});

interface SuggestionForm {
  title: string;
  content: string;
  suggestion_type: 'SIGNAL' | 'CROSSWALK' | 'FACILITY';
  location_lat: number | null;
  location_lon: number | null;
  address: string;
  priority_score: number;
}

export default function CreateSuggestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SuggestionForm>({
    title: '',
    content: '',
    suggestion_type: 'SIGNAL',
    location_lat: null,
    location_lon: null,
    address: '',
    priority_score: 0
  });

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 위치 선택 핸들러
  const handleLocationSelect = useCallback((lat: number, lon: number, address: string) => {
    setForm(prev => ({
      ...prev,
      location_lat: lat,
      location_lon: lon,
      address: address
    }));
  }, []);

  // 우선순위 점수 계산 핸들러
  const handlePriorityScoreCalculated = useCallback((score: number) => {
    // console.log('[CreateSuggestionPage] Priority score calculated:', score);
    setForm(prev => ({
      ...prev,
      priority_score: score
    }));
  }, []);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (!form.location_lat || !form.location_lon) {
      alert('지도에서 위치를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        const result = await response.json();
        alert('건의사항이 성공적으로 등록되었습니다.');
        // Navigate to detail page first, then user can go back to list with fresh data
        router.push(`/board/${result.id}`);
      } else {
        const error = await response.json();
        alert(error.message || '건의사항 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('건의사항 등록 실패:', error);
      alert('건의사항 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 뒤로가기 버튼 */}
        <div className='mb-6'>
          <Button
            onClick={() => router.push("/board")}
            variant="ghost"
            className="flex items-center gap-2 hover:cursor-pointer"
          >
            <FaArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Button>
        </div>
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">건의사항 작성</h1>
          <p className="text-gray-600 mt-1">교통 안전 시설 개선을 위한 건의사항을 작성해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card variant="outlined" padding="md">
            <CardContent className="p-0 space-y-6">
              {/* 건의 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  건의 유형 <span className="text-red-500">*</span>
                </label>
                <Select
                  name="suggestion_type"
                  value={form.suggestion_type}
                  onChange={handleInputChange}
                  options={[
                    { value: "SIGNAL", label: "신호등 설치" },
                    { value: "CROSSWALK", label: "횡단보도 설치" },
                    { value: "FACILITY", label: "기타 시설" },
                  ]}
                  required
                />
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="건의사항 제목을 입력해주세요"
                  required
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {form.title.length}/200자
                </div>
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="content"
                  value={form.content}
                  onChange={handleInputChange}
                  placeholder="건의사항 내용을 자세히 작성해주세요&#10;&#10;예시:&#10;- 현재 상황 (사고 위험성, 불편사항 등)&#10;- 개선 필요성&#10;- 기대 효과"
                  rows={8}
                  required
                  maxLength={2000}
                  className="resize-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {form.content.length}/2000자
                </div>
              </div>

            {/* 위치 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위치 선택 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                {/* 선택된 주소 표시 */}
                {form.address && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <FaMapMarkerAlt className="text-blue-600 w-4 h-4" />
                    <span className="text-blue-800 font-medium">{form.address}</span>
                  </div>
                )}

                {/* 지도 */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={
                      form.location_lat && form.location_lon
                        ? { lat: form.location_lat, lon: form.location_lon }
                        : undefined
                    }
                  />
                </div>

                {/* 위치 정보 패널 */}
                <LocationInfoPanel
                  lat={form.location_lat}
                  lon={form.location_lon}
                  address={form.address}
                  onPriorityScoreCalculated={handlePriorityScoreCalculated}
                />

                <p className="text-xs text-gray-500">
                  지도를 클릭하여 건의사항 위치를 선택해주세요. 선택한 위치의 위험 지수와 주변 사고 정보가 표시됩니다.
                </p>
              </div>
            </div>
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center gap-2 hover:cursor-pointer"
            >
              <FaTimes className="w-4 h-4" />
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              loading={loading}
              className="flex items-center gap-2 hover:cursor-pointer"
            >
              <FaSave className="w-4 h-4" />
              건의사항 등록
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}