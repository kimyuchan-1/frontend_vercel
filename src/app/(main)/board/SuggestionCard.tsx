'use client'

import Link from "next/link";
import { useState } from "react";
import { FaComment, FaEye, FaHeart, FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import type { Suggestion } from "@/features/board/types";
import { StatusColors, SuggestionStatusLabels, SuggestionTypeLabels } from "@/features/board/constants";
import { getPriorityLevel } from "@/features/acc_calculate/priorityScore";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function SuggestionCard(props: {
    suggestion: Suggestion;
}) {
    const { suggestion } = props;
    const [likeCount, setLikeCount] = useState(suggestion.like_count);
    const [isLiking, setIsLiking] = useState(false);
    
    // 우선순위 레벨 계산
    const priorityLevel = getPriorityLevel(suggestion.priority_score || 0);
    const showPriorityBadge = (suggestion.priority_score || 0) >= 60; // 높음 이상만 표시

    const handleLike = async () => {
      if (isLiking) return;
      
      setIsLiking(true);
      const previousCount = likeCount;
      
      // Optimistic update: immediately update UI
      setLikeCount(prev => prev + 1);
      
      try {
        const response = await fetch(`/api/suggestions/${suggestion.id}/like`, {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) {
          // Rollback on error
          setLikeCount(previousCount);
          
          if (response.status === 401) {
            alert('로그인이 필요합니다.');
          } else {
            alert('좋아요 처리에 실패했습니다.');
          }
        }
      } catch (error) {
        console.error('좋아요 처리 실패:', error);
        // Rollback on error
        setLikeCount(previousCount);
        alert('좋아요 처리 중 오류가 발생했습니다.');
      } finally {
        setIsLiking(false);
      }
    };

    return (
        <Card variant="outlined" padding="md" className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${StatusColors[suggestion.status]}`}>
                                {SuggestionStatusLabels[suggestion.status]}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                {SuggestionTypeLabels[suggestion.suggestion_type]}
                            </span>
                            {showPriorityBadge && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                    priorityLevel.level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                    priorityLevel.level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    <FaExclamationTriangle className="w-3 h-3" />
                                    우선순위 {priorityLevel.label}
                                </span>
                            )}
                        </div>

                        <Link href={`/board/${suggestion.id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                                {suggestion.title}
                            </h3>
                        </Link>

                        <p className="text-gray-600 mt-2 line-clamp-2">{suggestion.content}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            <span>
                                {suggestion.sido} {suggestion.sigungu}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaEye className="w-3 h-3" />
                            <span>{suggestion.view_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaComment className="w-3 h-3" />
                            <span>{suggestion.comment_count || 0}</span>
                        </div>
                        <span>{suggestion.user?.name ?? "익명"}</span>
                        <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                    </div>

                    <Button
                        onClick={handleLike}
                        disabled={isLiking}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <FaHeart className="w-3 h-3" />
                        <span>{likeCount}</span>
                    </Button>
                </div>

                {suggestion.admin_response && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <div className="text-sm font-medium text-blue-800 mb-1">관리자 답변</div>
                        <p className="text-sm text-blue-700">{suggestion.admin_response}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
