import { Suggestion } from '@/features/board/types';
import { SuggestionStatusLabels, SuggestionTypeLabels, StatusColors } from '@/features/board/constants';
import { FaMapMarkerAlt, FaEye, FaComment } from 'react-icons/fa';

interface SuggestionHeaderProps {
  suggestion: Suggestion;
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SuggestionHeader({ suggestion, canEdit }: SuggestionHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${StatusColors[suggestion.status]}`}>
              {SuggestionStatusLabels[suggestion.status]}
            </span>
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
              {SuggestionTypeLabels[suggestion.suggestion_type]}
            </span>
            {suggestion.priority_score > 7 && (
              <span className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full">
                긴급
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {suggestion.title}
          </h1>
        </div>
      </div>

      {/* Meta information */}
      <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b">
        <div className="flex items-center gap-1">
          <FaMapMarkerAlt className="w-4 h-4" />
          <span>{suggestion.sido} {suggestion.sigungu}</span>
        </div>
        <div className="flex items-center gap-1">
          <FaEye className="w-4 h-4" />
          <span>{suggestion.view_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <FaComment className="w-4 h-4" />
          <span>{suggestion.comment_count}</span>
        </div>
        <span>{suggestion.user?.name ?? "익명"}</span>
        <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
