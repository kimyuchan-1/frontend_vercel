export const SuggestionTypeLabels = {
    SIGNAL: '신호등 설치',
    CROSSWALK: '횡단보도 설치',
    FACILITY: '기타 시설'
} as const;

export const SuggestionStatusLabels = {
    PENDING: '접수',
    REVIEWING: '검토중',
    APPROVED: '승인',
    REJECTED: '반려',
    COMPLETED: '완료'
} as const;

export const StatusColors = {
    PENDING: 'bg-gray-100 text-gray-800',
    REVIEWING: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-purple-100 text-purple-800'
} as const;

export const DEFAULT_FILTERS = {
    status: 'ALL',
    type: 'ALL',
    region: 'ALL',
    sortBy: 'latest',
} as const;