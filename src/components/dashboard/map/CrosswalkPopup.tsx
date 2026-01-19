import { Crosswalk } from '@/features/acc_calculate/types';

export function CrosswalkPopup({ crosswalk }: { crosswalk: Crosswalk }) {
  return (
    <div className="bg-white rounded-lg p-2 w-64 ">
      <div className="text-center">
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="text-black">주소: </span>
          {crosswalk.address}
        </p>
      </div>
    </div>
  );
}
