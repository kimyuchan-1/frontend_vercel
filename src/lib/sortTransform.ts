/**
 * Transforms frontend sort parameter values to Spring Data sort format
 * 
 * @param sortBy - The frontend sort parameter (latest, popular, priority, status)
 * @returns The Spring Data sort string (e.g., "createdAt,desc")
 */
export function transformSortParameter(sortBy: string): string {
  const sortMap: Record<string, string> = {
    latest: 'createdAt,desc',
    popular: 'likeCount,desc',
    priority: 'priorityScore,desc',
    status: 'status,asc',
  };

  return sortMap[sortBy] || 'createdAt,desc';
}
