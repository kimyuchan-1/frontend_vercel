import BoardHeader from '@/components/board/BoardHeader';
import BoardList from '@/components/board/BoardList';
import BoardFilters from '@/components/board/BoardFilters';
import BoardPagination from '@/components/board/BoardPagination';
import { Suggestion } from '@/features/board/types';

// Dynamic rendering: Always fetch fresh data from the server
// This ensures create/delete operations are immediately reflected
// Trade-off: Slightly slower page loads, but always up-to-date data
export const revalidate = 0; // Disable ISR cache for this page
export const dynamic = 'force-dynamic'; // Force dynamic rendering

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    type?: string;
    region?: string;
    sortBy?: string;
  }>;
}

async function getSuggestions(params: {
  page?: string;
  search?: string;
  status?: string;
  type?: string;
  region?: string;
  sortBy?: string;
}) {
  try {
    const searchParams = new URLSearchParams({
      page: params.page || '1',
      size: '10',
      search: params.search || '',
      status: params.status && params.status !== 'ALL' ? params.status : '',
      type: params.type && params.type !== 'ALL' ? params.type : '',
      region: params.region && params.region !== 'ALL' ? params.region : '',
      sortBy: params.sortBy || 'latest'
    });

    // Remove empty params
    Array.from(searchParams.keys()).forEach(key => {
      if (!searchParams.get(key)) {
        searchParams.delete(key);
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Dynamic fetching strategy:
    // - cache: 'no-store' - Always fetch fresh data from backend, no caching
    // - This ensures create/delete/update operations are immediately visible
    // - Combined with revalidatePath() calls in mutation APIs for consistency
    const response = await fetch(`${baseUrl}/api/suggestions?${searchParams}`, {
      cache: 'no-store', // Disable caching completely
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch suggestions:', response.status);
      return { content: [], totalPages: 1, currentPage: 1 };
    }

    const data = await response.json();
    return {
      content: data.content || [],
      totalPages: data.totalPages || 1,
      currentPage: parseInt(params.page || '1', 10),
    };
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return { content: [], totalPages: 1, currentPage: 1 };
  }
}

export default async function BoardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { content: suggestions, totalPages, currentPage } = await getSuggestions(params);

  // Generate JSON-LD structured data for ItemList
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pedestrian Safety Suggestions',
    description: 'Community suggestions for improving pedestrian traffic safety',
    numberOfItems: suggestions.length,
    itemListElement: suggestions.map((suggestion: Suggestion, index: number) => ({
      '@type': 'ListItem',
      position: (currentPage - 1) * 10 + index + 1,
      item: {
        '@type': 'Article',
        '@id': `${baseUrl}/board/${suggestion.id}`,
        name: suggestion.title,
        description: suggestion.content?.substring(0, 200) || '',
        url: `${baseUrl}/board/${suggestion.id}`,
        author: {
          '@type': 'Person',
          name: suggestion.user?.name || 'Anonymous'
        },
        datePublished: suggestion.created_at,
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: suggestion.like_count || 0
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/CommentAction',
            userInteractionCount: suggestion.comment_count || 0
          }
        ]
      }
    }))
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <BoardHeader />

          {/* 검색 및 필터 */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <BoardFilters
              initialValue={params.search || ''}
              initialFilters={{
                status: params.status || 'ALL',
                type: params.type || 'ALL',
                region: params.region || 'ALL',
                sortBy: params.sortBy || 'latest'
              }}
            />
          </div>

          {/* 건의사항 목록 */}
          <BoardList suggestions={suggestions} />

          {/* 페이지네이션 */}
          <BoardPagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      </div>
    </>
  );
}
