'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaMapMarkerAlt, FaHeart, FaComment, FaEye, FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { Suggestion, Comment } from '@/features/board/types';
import { SuggestionStatusLabels, SuggestionTypeLabels, StatusColors } from '@/features/board/constants';
import dynamic from 'next/dynamic';

// 지도 컴포넌트
const LocationViewer = dynamic(() => import('../../../../components/board/map/LocationViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">지도를 불러오는 중...</div>
    </div>
  ),
});

// 위치 정보 패널
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

interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface SuggestionDetailClientProps {
  suggestion: Suggestion;
}

export default function SuggestionDetailClient({ suggestion: initialSuggestion }: SuggestionDetailClientProps) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState(initialSuggestion);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // 현재 사용자 정보 조회
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCurrentUser(data.data);
          }
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // 댓글 조회
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('댓글 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [suggestion.id]);

  // Optimistic UI update for like button:
  // 1. Immediately update UI state before API call (optimistic update)
  // 2. Store previous state for rollback on error
  // 3. Make API call to persist change
  // 4. Update with server response or rollback on error
  // This provides instant feedback while maintaining data consistency
  const toggleLike = async () => {
    const previousLikeCount = suggestion.like_count;
    const previousIsLiked = suggestion.is_liked;
    
    // Optimistic update: immediately update UI
    setSuggestion(prev => ({
      ...prev,
      like_count: prev.is_liked ? Math.max(0, prev.like_count - 1) : prev.like_count + 1,
      is_liked: !prev.is_liked
    }));
    
    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Update with actual server response
        setSuggestion(prev => ({
          ...prev,
          like_count: data.liked ? previousLikeCount + 1 : Math.max(0, previousLikeCount - 1),
          is_liked: data.liked
        }));
      } else {
        // Rollback on error
        setSuggestion(prev => ({
          ...prev,
          like_count: previousLikeCount,
          is_liked: previousIsLiked
        }));
        
        if (response.status === 401) {
          alert('로그인이 필요합니다.');
        } else {
          alert('좋아요 처리에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      
      // Rollback on error
      setSuggestion(prev => ({
        ...prev,
        like_count: previousLikeCount,
        is_liked: previousIsLiked
      }));
      
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // Optimistic UI update for comment submission:
  // 1. Create temporary comment with client-side data
  // 2. Immediately add to UI for instant feedback
  // 3. Clear input for better UX
  // 4. Make API call to persist
  // 5. Fetch fresh data on success or rollback on error
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setCommentLoading(true);
    
    // Create optimistic comment
    const optimisticComment: Comment = {
      id: Date.now(), // Temporary ID
      content: newComment,
      created_at: new Date().toISOString(),
      user: currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
      } : {
        id: 0,
        name: '익명'
      },
      parent_id: replyTo ?? undefined,
      replies: []
    };
    
    // Store previous state for rollback
    const previousComments = [...comments];
    const previousCommentCount = suggestion.comment_count;
    
    // Optimistic update: immediately add comment to UI
    if (replyTo) {
      // Add as reply
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === replyTo 
            ? { ...comment, replies: [...(comment.replies || []), optimisticComment] }
            : comment
        )
      );
    } else {
      // Add as top-level comment
      setComments(prevComments => [...prevComments, optimisticComment]);
    }
    
    setSuggestion(prev => ({
      ...prev,
      comment_count: (prev.comment_count ?? 0) + 1
    }));
    
    // Clear input immediately for better UX
    const submittedComment = newComment;
    setNewComment('');
    const submittedReplyTo = replyTo;
    setReplyTo(null);
    
    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: submittedComment,
          parent_id: submittedReplyTo
        })
      });

      if (response.ok) {
        // Fetch fresh comments to replace optimistic update with real data
        await fetchComments();
      } else {
        // Rollback on error
        setComments(previousComments);
        setSuggestion(prev => ({
          ...prev,
          comment_count: previousCommentCount
        }));
        
        // Restore input
        setNewComment(submittedComment);
        setReplyTo(submittedReplyTo);
        
        if (response.status === 401) {
          alert('로그인이 필요합니다.');
        } else {
          const errorData = await response.json();
          alert(errorData.error || '댓글 작성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      
      // Rollback on error
      setComments(previousComments);
      setSuggestion(prev => ({
        ...prev,
        comment_count: previousCommentCount
      }));
      
      // Restore input
      setNewComment(submittedComment);
      setReplyTo(submittedReplyTo);
      
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  // Cache-busting navigation strategy:
  // After successful deletion, redirect to board list
  // With dynamic rendering enabled on /board page, it will always fetch fresh data
  // No need for cache-busting query parameter anymore
  const handleDeleteSuggestion = async () => {
    if (!confirm('정말 이 건의사항을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('건의사항이 삭제되었습니다.');
        // Navigate to board list - will fetch fresh data due to dynamic rendering
        router.push('/board');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 댓글 수정 시작
  const startEditComment = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
  };

  // 댓글 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  // 댓글 수정 저장
  const handleUpdateComment = async (commentId: number) => {
    if (!editingContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}/comments?commentId=${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: editingContent })
      });

      if (response.ok) {
        cancelEditComment();
        await fetchComments();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchComments();
        setSuggestion(prev => ({
          ...prev,
          comment_count: Math.max(0, (prev.comment_count ?? 0) - 1)
        }));
      } else {
        const errorData = await response.json();
        alert(errorData.error || '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 권한 확인 함수
  const canEditSuggestion = () => {
    if (!currentUser || !suggestion) return false;
    return currentUser.id === suggestion.user_id || currentUser.role === 'ADMIN';
  };

  const canEditComment = (comment: Comment) => {
    if (!currentUser) return false;
    return currentUser.id === comment.user?.id || currentUser.role === 'ADMIN';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/board")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors hover:cursor-pointer"
          >
            <FaArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </button>
        </div>

        {/* 건의사항 상세 - Server-rendered content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* 헤더 */}
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
            
            {/* 수정/삭제 버튼 */}
            {canEditSuggestion() && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => router.push(`/board/${suggestion.id}/edit`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hover:cursor-pointer"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  수정
                </button>
                <button
                  onClick={handleDeleteSuggestion}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* 메타 정보 */}
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

          {/* 내용 */}
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {suggestion.content}
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">위치 정보</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FaMapMarkerAlt className="text-blue-600 w-4 h-4" />
                <span className="text-blue-800 font-medium">{suggestion.address}</span>
              </div>
              
              {/* 지도 */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <LocationViewer
                  lat={suggestion.location_lat}
                  lon={suggestion.location_lon}
                />
              </div>

              {/* 위치 정보 패널 */}
              <LocationInfoPanel
                lat={suggestion.location_lat}
                lon={suggestion.location_lon}
                address={suggestion.address}
              />
            </div>
          </div>

          {/* 좋아요 버튼 - Real-time CSR */}
          <div className="flex items-center justify-between pt-6 border-t ">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ${suggestion.is_liked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <FaHeart className={`w-4 h-4 ${suggestion.is_liked ? 'text-red-600' : ''}`} />
              <span>{suggestion.like_count}</span>
            </button>
          </div>
        </div>

        {/* 관리자 답변 */}
        {suggestion.admin_response && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
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

        {/* 댓글 섹션 - Real-time CSR */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            댓글 ({suggestion.comment_count})
          </h3>

          {/* 댓글 작성 폼 */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            {replyTo && (
              <div className="mb-2 text-sm text-gray-600">
                답글 작성 중...
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-blue-600 hover:text-blue-700 hover:cursor-pointer"
                >
                  취소
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                {commentLoading ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </form>

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                첫 번째 댓글을 작성해보세요!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                      {(comment.user?.name ?? "익명").charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{comment.user?.name ?? "익명"}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* 댓글 내용 또는 수정 폼 */}
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateComment(comment.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEditComment}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 hover:cursor-pointer"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-800 whitespace-pre-wrap mb-2">{comment.content}</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setReplyTo(comment.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 hover:cursor-pointer"
                            >
                              답글
                            </button>
                            {canEditComment(comment) && (
                              <>
                                <button
                                  onClick={() => startEditComment(comment.id, comment.content)}
                                  className="text-sm text-gray-600 hover:text-gray-700 hover:cursor-pointer"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-sm text-red-600 hover:text-red-700 hover:cursor-pointer"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 답글 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 mt-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                            {(reply.user?.name ?? "익명").charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">{reply.user?.name ?? "익명"}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* 대댓글 내용 또는 수정 폼 */}
                            {editingCommentId === reply.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateComment(reply.id)}
                                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={cancelEditComment}
                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 hover:cursor-pointer"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-gray-800 text-sm whitespace-pre-wrap mb-1">{reply.content}</p>
                                {canEditComment(reply) && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEditComment(reply.id, reply.content)}
                                      className="text-xs text-gray-600 hover:text-gray-700 hover:cursor-pointer"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="text-xs text-red-600 hover:text-red-700 hover:cursor-pointer"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
