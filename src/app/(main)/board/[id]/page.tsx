import { notFound } from 'next/navigation';
import SuggestionDetailClient from './SuggestionDetailClient';
import type { Suggestion } from '@/features/board/types';
import type { Metadata } from 'next';

// Force dynamic rendering to always show latest view_count
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getSuggestion(id: string): Promise<Suggestion | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/suggestions/${id}`, {
      cache: 'no-store', // Always fetch fresh data
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch suggestion');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching suggestion:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const suggestion = await getSuggestion(id);

  if (!suggestion) {
    return {
      title: '건의사항을 찾을 수 없습니다',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return {
    title: `${suggestion.title} | 건의사항`,
    description: suggestion.content?.substring(0, 160) || '',
    openGraph: {
      title: suggestion.title,
      description: suggestion.content?.substring(0, 200) || '',
      type: 'article',
      url: `${baseUrl}/board/${id}`,
    },
  };
}

export default async function SuggestionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const suggestion = await getSuggestion(id);

  if (!suggestion) {
    notFound();
  }

  // Generate JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: suggestion.title,
    description: suggestion.content?.substring(0, 200) || '',
    author: {
      '@type': 'Person',
      name: suggestion.user?.name || 'Anonymous'
    },
    datePublished: suggestion.created_at,
    dateModified: suggestion.updated_at || suggestion.created_at,
    url: `${baseUrl}/board/${suggestion.id}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/board/${suggestion.id}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Pedestrian Safety Dashboard',
      url: baseUrl
    },
    articleSection: suggestion.suggestion_type,
    keywords: [
      suggestion.suggestion_type,
      suggestion.sido,
      suggestion.sigungu,
      'pedestrian safety',
      'traffic safety'
    ].join(', '),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/LikeAction',
        'userInteractionCount': suggestion.like_count || 0
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/CommentAction',
        'userInteractionCount': suggestion.comment_count || 0
      },
      {
        '@type': 'InteractionCounter',
        'interactionType': 'https://schema.org/ViewAction',
        'userInteractionCount': suggestion.view_count || 0
      }
    ],
    spatialCoverage: {
      '@type': 'Place',
      name: suggestion.address,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: suggestion.location_lat,
        longitude: suggestion.location_lon
      },
      address: {
        '@type': 'PostalAddress',
        addressRegion: suggestion.sido,
        addressLocality: suggestion.sigungu,
        streetAddress: suggestion.address
      }
    }
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <SuggestionDetailClient suggestion={suggestion} />
    </>
  );
}
