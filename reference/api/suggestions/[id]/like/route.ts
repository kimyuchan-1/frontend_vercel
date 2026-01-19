import { NextRequest, NextResponse } from 'next/server';
import { dummySuggestions } from '@/lib/dummyData';

// 좋아요 토글 (POST) - 더미 데이터 사용
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const suggestionId = parseInt(id);

    // 더미 데이터에서 건의사항 찾기
    const suggestion = dummySuggestions.find(s => s.id === suggestionId);

    if (!suggestion) {
      return NextResponse.json({ error: '건의사항을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 더미 좋아요 상태 (실제로는 사용자별로 관리)
    const isLiked = Math.random() > 0.5; // 랜덤하게 좋아요 상태 결정

    if (isLiked) {
      // 좋아요 취소
      suggestion.like_count = Math.max(0, suggestion.like_count - 1);
      return NextResponse.json({ liked: false, message: '좋아요를 취소했습니다.' });
    } else {
      // 좋아요 추가
      suggestion.like_count += 1;
      return NextResponse.json({ liked: true, message: '좋아요를 추가했습니다.' });
    }

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}