'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// 지도 컴포넌트 (위치 선택용)
const LocationPicker = dynamic(() => import('../../../../../components/board/map/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">지도를 불러오는 중...</div>
    </div>
  ),
});

// 위치 정보 패널 (위험/안전 지수 표시)
const LocationInfoPanel = dynamic(() => import('../../../../../components/board/map/LocationInfoPanel'), {
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
}

export default function EditSuggestionPage() {
  const params = useParams();
  const router = useRouter();
  const suggestionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SuggestionForm>({
    title: '',
    content: '',
    suggestion_type: 'SIGNAL',
    location_lat: null,
    location_lon: null,
    address: ''
  });

  // 기존 건의사항 데이터 로드
  useEffect(() => {
    const fetchSuggestion = async () => {
      try {
        const response = await fetch(`/api/suggestions/${suggestionId}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setForm({
            title: data.title,
            content: data.content,
            suggestion_type: data.suggestion_type,
            location_lat: data.location_lat,
            location_lon: data.location_lon,
            address: data.address
          });
        } else if (response.status === 404) {
          alert('존재하지 않는 건의사항입니다.');
          router.push('/board');
        } else if (response.status === 403) {
          alert('수정 권한이 없습니다.');
          router.push(`/board/${suggestionId}`);
        }
      } catch (error) {
        console.error('건의사항 조회 실패:', error);
        alert('건의사항을 불러오는 중 오류가 발생했습니다.');
        router.push('/board');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestion();
  }, [suggestionId, router]);

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

    setSaving(true);
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        alert('건의사항이 성공적으로 수정되었습니다.');
        
        // Refresh router cache before navigation
        try {
          router.refresh();
          
          // Small delay to ensure refresh completes
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (refreshError) {
          // Log error but proceed with navigation
          console.error('Router refresh error:', refreshError);
        }
        
        // Navigate to detail page
        router.push(`/board/${suggestionId}`);
      } else {
        const error = await response.json();
        alert(error.error || '건의사항 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('건의사항 수정 실패:', error);
      alert('건의사항 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 뒤로가기 버튼 */}
        <div className='mb-6'>
          <button
            onClick={() => router.push(`/board/${suggestionId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors hover:cursor-pointer"
          >
            <FaArrowLeft className="w-4 h-4" />
            상세 페이지로 돌아가기
          </button>
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">건의사항 수정</h1>
          <p className="text-gray-600 mt-1">건의사항 내용을 수정해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* 건의 유형 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                건의 유형 <span className="text-red-500">*</span>
              </label>
              <select
                name="suggestion_type"
                value={form.suggestion_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="SIGNAL">신호등 설치</option>
                <option value="CROSSWALK">횡단보도 설치</option>
                <option value="FACILITY">기타 시설</option>
              </select>
            </div>

            {/* 제목 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="건의사항 제목을 입력해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {form.title.length}/200자
              </div>
            </div>

            {/* 내용 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleInputChange}
                placeholder="건의사항 내용을 자세히 작성해주세요&#10;&#10;예시:&#10;- 현재 상황 (사고 위험성, 불편사항 등)&#10;- 개선 필요성&#10;- 기대 효과"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
                maxLength={2000}
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
                />

                <p className="text-xs text-gray-500">
                  지도를 클릭하여 건의사항 위치를 변경할 수 있습니다. 선택한 위치의 위험 지수와 주변 사고 정보가 표시됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push(`/board/${suggestionId}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 hover:cursor-pointer"
            >
              <FaTimes className="w-4 h-4" />
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 hover:cursor-pointer"
            >
              <FaSave className="w-4 h-4" />
              {saving ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
