// Server Component - Renders suggestion list with server-fetched data
import type { Suggestion } from "@/features/board/types";
import SuggestionCard from "@/app/(main)/board/SuggestionCard";

interface BoardListProps {
  suggestions: Suggestion[];
}

export default function BoardList({ suggestions }: BoardListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
        <p className="text-gray-500">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suggestions.map((s) => (
        <SuggestionCard key={s.id} suggestion={s} />
      ))}
    </div>
  );
}
