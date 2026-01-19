import { Suggestion } from '@/features/board/types';
import { FaMapMarkerAlt } from 'react-icons/fa';
import dynamic from 'next/dynamic';

const LocationViewer = dynamic(() => import('./map/LocationViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">지도를 불러오는 중...</div>
    </div>
  ),
});

const LocationInfoPanel = dynamic(() => import('./map/LocationInfoPanel'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border bg-gray-50 p-6">
      <div className="text-center text-gray-500">
        <div className="text-sm font-medium">위치 정보 로딩 중...</div>
      </div>
    </div>
  ),
});

interface SuggestionContentProps {
  suggestion: Suggestion;
}

export default function SuggestionContent({ suggestion }: SuggestionContentProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      {/* Content */}
      <div className="prose max-w-none mb-6">
        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
          {suggestion.content}
        </div>
      </div>

      {/* Location information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">위치 정보</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FaMapMarkerAlt className="text-blue-600 w-4 h-4" />
            <span className="text-blue-800 font-medium">{suggestion.address}</span>
          </div>
          
          {/* Map */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <LocationViewer
              lat={suggestion.location_lat}
              lon={suggestion.location_lon}
            />
          </div>

          {/* Location info panel */}
          <LocationInfoPanel
            lat={suggestion.location_lat}
            lon={suggestion.location_lon}
            address={suggestion.address}
          />
        </div>
      </div>

      {/* Admin response */}
      {suggestion.admin_response && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              관
            </div>
            <div>
              <div className="font-semibold text-gray-900">관리자 답변</div>
              <div className="text-sm text-gray-500">
                {suggestion.processed_at && new Date(suggestion.processed_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <p className="text-blue-800 whitespace-pre-wrap">{suggestion.admin_response}</p>
          </div>
        </div>
      )}
    </div>
  );
}
