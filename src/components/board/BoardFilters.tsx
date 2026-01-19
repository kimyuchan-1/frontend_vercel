'use client'

// Client Component - Interactive filter controls
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaFilter, FaSearch } from 'react-icons/fa';
import type { FilterState } from '@/features/board/types';

interface BoardFiltersProps {
  initialValue: string;
  initialFilters: FilterState;
}

export default function BoardFilters({ initialValue, initialFilters }: BoardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [regions, setRegions] = useState<string[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

  // Sync filters with URL parameters when they change (e.g., browser back/forward)
  useEffect(() => {
    const urlFilters: FilterState = {
      status: searchParams.get('status') || 'ALL',
      type: searchParams.get('type') || 'ALL',
      region: searchParams.get('region') || 'ALL',
      sortBy: searchParams.get('sortBy') || 'latest', // Default to 'latest' if not present
    };
    setFilters(urlFilters);
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Load regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch('/api/suggestions/regions');
        if (response.ok) {
          const data = await response.json();
          setRegions(data);
        }
      } catch (error) {
        console.error('지역 목록 조회 실패:', error);
      } finally {
        setLoadingRegions(false);
      }
    };

    fetchRegions();
  }, []);

  // URL parameter synchronization:
  // When filters change, update URL search parameters and navigate
  // This triggers server component re-render with new parameters
  // Next.js ISR creates separate cache entries per parameter combination
  // Pagination is reset to page 1 when filters change
  const updateURL = (updates: Partial<FilterState & { search?: string; page?: string }>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update or remove parameters
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'ALL') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!updates.page) {
      params.delete('page');
    }

    router.push(`/board?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ search: searchTerm });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL({ [key]: value });
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="제목, 내용, 지역으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 hover:cursor-pointer"
        >
          <FaFilter className="w-4 h-4" />
          필터
        </button>
      </form>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">전체</option>
              <option value="PENDING">접수</option>
              <option value="REVIEWING">검토중</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
              <option value="COMPLETED">완료</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">전체</option>
              <option value="SIGNAL">신호등 설치</option>
              <option value="CROSSWALK">횡단보도 설치</option>
              <option value="FACILITY">기타 시설</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loadingRegions}
            >
              <option value="ALL">전체</option>
              {loadingRegions ? (
                <option disabled>로딩 중...</option>
              ) : (
                regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="priority">우선순위순</option>
              <option value="status">상태순</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
}
