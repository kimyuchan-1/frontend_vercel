// src/components/dashboard/DistrictSelectors.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ProvinceOpt = { province: string; lat: number; lon: number };
type CityOpt = { key: string; city: string; lat: number; lon: number };

export default function DistrictSelectors({
  onMove,
}: {
  onMove: (v: { lat: number; lon: number; zoom?: number }) => void;
}) {
  const [provinces, setProvinces] = useState<ProvinceOpt[]>([]);
  const [cities, setCities] = useState<CityOpt[]>([]);
  const [province, setProvince] = useState("ALL");
  const [cityKey, setCityKey] = useState("ALL");
  const [loadingCities, setLoadingCities] = useState(false);

  // 1) provinces
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/dashboard/provinces", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setProvinces(j);
      else console.error(j);
    })();
  }, []);

  // 2) cities for province
  useEffect(() => {
    (async () => {
      if (province === "ALL") {
        setCities([]);
        return;
      }
      setLoadingCities(true);
      try {
        const r = await fetch(`/api/dashboard/cities?province=${encodeURIComponent(province)}`, {
          cache: "no-store",
        });
        const j = await r.json();
        if (r.ok) setCities(j);
        else console.error(j);
      } finally {
        setLoadingCities(false);
      }
    })();
  }, [province]);

  // 3) province 선택 시: 시도 중심으로 먼저 이동(선택 UX 좋음)
  useEffect(() => {
    if (province === "ALL") return;
    const p = provinces.find(x => x.province === province);
    if (!p) return;
    onMove({ lat: p.lat, lon: p.lon, zoom: 10 });
  }, [province, provinces, onMove]);

  // 4) city 선택 시: 시군구 중심으로 이동
  useEffect(() => {
    if (province === "ALL" || cityKey === "ALL") return;
    const c = cities.find(x => x.key === cityKey);
    if (!c) return;
    onMove({ lat: c.lat, lon: c.lon, zoom: 12 });
  }, [province, cityKey, cities, onMove]);

  const cityOptions = useMemo(() => cities, [cities]);

  return (
    <div className="flex flex-col gap-2 justify-center items-end">
      <select
        className="h-10 rounded-md border bg-white px-3 text-sm"
        value={province}
        onChange={(e) => {
          setProvince(e.target.value);
          setCityKey("ALL");
        }}
      >
        <option value="ALL">시/도 선택</option>
        {provinces.map(p => (
          <option key={p.province} value={p.province}>
            {p.province}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-md border bg-white px-3 text-sm"
        value={cityKey}
        onChange={(e) => setCityKey(e.target.value)}
        disabled={province === "ALL" || loadingCities}
      >
        <option value="ALL">{loadingCities ? "불러오는 중..." : "시/군/구 선택"}</option>
        {cityOptions.map(c => (
          <option key={c.key} value={c.key}>
            {c.city}
          </option>
        ))}
      </select>
    </div>
  );
}
