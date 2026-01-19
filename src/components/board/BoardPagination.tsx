'use client'

// Client Component - Pagination controls that update URL
import { useRouter, useSearchParams } from 'next/navigation';

interface BoardPaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function BoardPagination({ currentPage, totalPages }: BoardPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/board?${params.toString()}`);
  };

  const start = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <div className="flex justify-center mt-8">
      <div className="flex gap-2">
        <button
          onClick={() => changePage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => changePage(p)}
            className={`px-3 py-2 text-sm border rounded-lg ${
              currentPage === p
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    </div>
  );
}
