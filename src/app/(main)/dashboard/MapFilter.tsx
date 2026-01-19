'use client';

export type MapFilterValue = {
  signalHas: boolean;
  signalNone: boolean;
  accHotspot: boolean;
};

export default function MapFilter(props: {
  value: MapFilterValue;
  onChange: (next: MapFilterValue) => void;
  className?: string; 
}) {
  const { value, onChange, className } = props;
  return (
    <div className="absolute right-3 top-3 z-100 rounded-xl border bg-white/90 px-3 py-2 text-xs shadow">
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={value.signalHas}
                                onChange={(e) => onChange({ ...value, signalHas: e.target.checked })}
                            />
                            <span className="inline-flex items-center gap-2">
                                <span className="inline-block w-3 h-3 rounded-full bg-green-500 border border-white shadow" />
                                신호등 있음
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={value.signalNone}
                                onChange={(e) => onChange({ ...value, signalNone: e.target.checked })}
                            />
                            <span className="inline-flex items-center gap-2">
                                <span className="inline-block w-3 h-3 rounded-full bg-red-500 border border-white shadow" />
                                신호등 없음
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={value.accHotspot}
                                onChange={(e) => onChange({ ...value, accHotspot: e.target.checked })}
                            />
                            <span className="inline-flex items-center gap-2">
                                <span className="inline-block w-0 h-0 
          border-l-[6px] border-l-transparent 
          border-r-[6px] border-r-transparent 
          border-b-12 border-b-red-500
          drop-shadow" />
                                사고다발지역
                            </span>
                        </label>
                    </div>
                </div>
  )
}
