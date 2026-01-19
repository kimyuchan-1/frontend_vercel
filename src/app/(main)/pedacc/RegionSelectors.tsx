"use client";
import type { ProvinceOpt, CityOpt } from "@/features/pedacc/types";

export default function RegionSelectors(props: {
  provinces: ProvinceOpt[];
  cities: CityOpt[];
  selectedProvince: string;
  selectedCity: string;
  loadingCities: boolean;
  onChangeProvince: (v: string) => void;
  onChangeCity: (v: string) => void;
}) {
  const {
    provinces,
    cities,
    selectedProvince,
    selectedCity,
    loadingCities,
    onChangeProvince,
    onChangeCity,
  } = props;

  const isAllProvince = selectedProvince === "ALL";

  const cityLabel = (c: CityOpt) => {
    // "서울특별시 강남구" -> "강남구"
    const parts = (c.name ?? "").split(" ");
    return parts.length >= 2 ? parts[parts.length - 1] : c.name;
  };

  // Deduplicate cities by code to avoid React key warnings
  const uniqueCities = cities.reduce((acc, city) => {
    if (!acc.find(c => c.code === city.code)) {
      acc.push(city);
    }
    return acc;
  }, [] as CityOpt[]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 whitespace-nowrap">시도 선택</label>
        <select
          className="border rounded-lg px-3 py-2 text-sm min-w-30"
          value={selectedProvince}
          onChange={(e) => onChangeProvince(e.target.value)}
        >
          <option value="ALL">전국</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 whitespace-nowrap">시군구 선택</label>
        <select
          className="border rounded-lg px-3 py-2 text-sm min-w-30"
          value={selectedCity}
          onChange={(e) => onChangeCity(e.target.value)}
          disabled={loadingCities || isAllProvince} // ✅ 전국이면 선택 자체도 막고 싶으면 유지, 아니면 isAllProvince 제거
        >
          {/* ✅ 전국이면 "전체"만 */}
          {isAllProvince ? (
            <option value="ALL">전체</option>
          ) : (
            <>
              <option value="ALL">
                {loadingCities ? "로딩 중..." : "전체 (시도 통계)"}
              </option>
              {uniqueCities.map((c) => (
                <option key={c.code} value={c.code}>
                  {cityLabel(c)}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
    </div>
  );
}
