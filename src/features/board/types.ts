export interface Suggestion {
  user_id: number;
  id: number;
  title: string;
  content: string;
  location_lat: number;
  location_lon: number;
  address: string;
  sido: string;
  sigungu: string;
  suggestion_type: 'SIGNAL' | 'CROSSWALK' | 'FACILITY';
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  priority_score: number;
  like_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
  };
  comment_count?: number;
  admin_response?: string;
  admin_id?: number;
  processed_at?: string;
  is_liked?: boolean;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
  parent_id?: number;
  replies?: Comment[];
}

// 필터 타입
export interface FilterState {
  status: string;
  type: string;
  region: string;
  sortBy: string;
}

export interface SuggestionsResponse {
  content: Suggestion[];
  totalPages: number;
}