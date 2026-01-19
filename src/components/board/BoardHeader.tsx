// Server Component - Static board header
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';

export default function BoardHeader() {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시민 건의사항</h1>
          <p className="text-gray-600 mt-1">교통 안전 시설 개선을 위한 시민 참여 공간</p>
        </div>
        <Link
          href="/board/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          건의사항 작성
        </Link>
      </div>
    </div>
  );
}
