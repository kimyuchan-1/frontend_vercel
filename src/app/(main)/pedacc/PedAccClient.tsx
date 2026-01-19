"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { YearlyTrendChart, MonthlyChart, AccidentTypeChart } from "@/components/pedacc/AccidentChart";
import { AccData, ProvinceOpt, CityOpt } from "@/features/pedacc/types";

import RegionSelectors from "./RegionSelectors";
import TablesSection from "./TablesSection";

interface PedAccClientProps {
  initialData: {
    region: string | null;
    regionType: string;
    yearly: AccData[];
    monthly: AccData[];
  };
  initialProvinces: ProvinceOpt[];
  initialRegion?: string;
}

export default function PedAccClient({ initialData, initialProvinces, initialRegion }: PedAccClientProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const region = sp.get("region") ?? initialRegion ?? ""; // 없으면 전국

  const [provinces, setProvinces] = useState<ProvinceOpt[]>(initialProvinces);
  const [cities, setCities] = useState<CityOpt[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [yearly, setYearly] = useState<AccData[]>(initialData.yearly);
  const [monthly, setMonthly] = useState<AccData[]>(initialData.monthly);
  const [error, setError] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [regionReady, setRegionReady] = useState(false);

  const reqIdRef = useRef(0);

  // Initialize selectedYear from initial data
  useEffect(() => {
    if (initialData.monthly.length > 0) {
      const years: number[] = Array.from(new Set(initialData.monthly.map((r: any) => Number(r.year))));
      const newest = years.length ? years.sort((a, b) => b - a)[0] : null;
      setSelectedYear(newest);
    }
  }, [initialData.monthly]);

  // URL 파라미터에서 시도/시군구 분리
  useEffect(() => {

    if (!region) {
      setSelectedProvince("ALL");
      setSelectedCity("ALL");
      setRegionReady(true);
      return;
    }

    // 시도(2자리)
    if (/^\d{2}$/.test(region)) {
      setSelectedProvince(region);
      setSelectedCity("ALL");
      setRegionReady(true);
      return;
    }

    // 시군구(5자리)
    if (/^\d{5}$/.test(region)) {
      setSelectedProvince(region.slice(0, 2));
      setSelectedCity(region);
      setRegionReady(true);
      return;
    }

    // 그 외는 안전하게 전국 처리
    setSelectedProvince("ALL");
    setSelectedCity("ALL");
    setRegionReady(true);
  }, [region]);

  // 시도 목록 로딩 - only if not already loaded from server
  useEffect(() => {
    if (provinces.length > 0) return; // Already have data from server
    
    const run = async () => {
      try {
        const resp = await fetch("/api/district/provinces");
        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error ?? "Failed to load provinces");
        const provinceData = Array.isArray(json) ? json : [];
        setProvinces(provinceData);
      } catch (e: any) {
        console.error("Failed to load provinces:", e);
      }
    };
    run();
  }, [provinces.length]);

  // 선택된 시도의 시군구 목록 로딩
  useEffect(() => {
    const run = async () => {
      // ✅ 전국이면 cities를 비우고 끝
      if (selectedProvince === "ALL") {
        setCities([]);
        setLoadingCities(false);
        return;
      }

      setLoadingCities(true);
      try {
        const resp = await fetch(`/api/district/cities?province=${encodeURIComponent(selectedProvince)}`);
        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error ?? "Failed to load cities");
        setCities(Array.isArray(json) ? json : []);
      } catch (e) {
        console.error("Failed to load cities:", e);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    run();
  }, [selectedProvince]);


  // 통계 로딩: region 없으면 전국, 있으면 해당 지역
  useEffect(() => {
    if (!regionReady) return;

    const controller = new AbortController();
    const myId = ++reqIdRef.current;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        let regionParam = "";
        if (selectedCity !== "ALL") regionParam = `?region=${encodeURIComponent(selectedCity)}`;
        else if (selectedProvince !== "ALL") regionParam = `?region=${encodeURIComponent(selectedProvince)}`;

        const resp = await fetch(`/api/pedacc/summary${regionParam}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error ?? "Failed");

        if (myId !== reqIdRef.current) return; // ✅ 최신만

        setYearly(json.yearly ?? []);
        const monthlyData = json.monthly ?? [];
        setMonthly(monthlyData);

        if (monthlyData.length > 0) {
          const years: number[] = Array.from(new Set(monthlyData.map((r: any) => Number(r.year))));

          const newest = years.length ? years.sort((a, b) => b - a)[0] : null;
          setSelectedYear(newest);
        } else {
          setSelectedYear(null);
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (myId !== reqIdRef.current) return;
        setError(e.message ?? "Error");
      } finally {
        if (myId !== reqIdRef.current) return;
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [regionReady, selectedProvince, selectedCity]);

  // 연도별 집계 데이터 생성 - API에서 이미 제공하므로 그대로 사용
  const yearlyAggregated = useMemo(() => {
    return [...yearly].sort((a, b) => a.year - b.year);
  }, [yearly]);

  // 선택된 연도의 월별 데이터
  const selectedYearMonthly = useMemo(() => {

    if (!selectedYear) return [];

    const monthlyForYear = monthly.filter(row => row.year === selectedYear);

    // 1월부터 12월까지 모든 월 데이터 생성 (데이터가 없는 월은 0으로 채움)
    const allMonths = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyForYear.find(row => row.month === month);
      const finalData = monthData || {
        year: selectedYear,
        month,
        accident_count: 0,
        casualty_count: 0,
        fatality_count: 0,
        serious_injury_count: 0,
        minor_injury_count: 0,
        reported_injury_count: 0,
      };
      allMonths.push(finalData);
    }
    return allMonths;
  }, [monthly, selectedYear]);

  // 사용 가능한 연도 목록
  const availableYears = useMemo(() => {
    const years = [...new Set(monthly.map(row => row.year))];
    return years.sort((a, b) => b - a); // 최신 연도부터
  }, [monthly]);

  const selectedName = useMemo(() => {
    if (selectedProvince === "ALL") return "전국";

    const provinceName =
      provinces.find((p) => p.code === selectedProvince)?.name ?? selectedProvince;

    if (selectedCity === "ALL") return provinceName;

    const cityInfo = cities.find((c) => c.code === selectedCity);
    const cityName = cityInfo?.name ?? selectedCity;

    // ✅ cityName이 이미 "서울특별시 ..."처럼 시도명을 포함하면 그대로 사용
    if (cityName.startsWith(provinceName)) return cityName;

    // cityInfo.name이 이미 "강남구"면 그대로 붙이면 됨
    return `${provinceName} ${cityName}`;
  }, [selectedProvince, selectedCity, provinces, cities]);

  const onChangeProvince = (provinceCode: string) => {
    setSelectedProvince(provinceCode);
    setSelectedCity("ALL");

    if (provinceCode === "ALL") router.push("/pedacc");
    else router.push(`/pedacc?region=${encodeURIComponent(provinceCode)}`);
  };

  const onChangeCity = (cityCode: string) => {
    setSelectedCity(cityCode);

    if (cityCode === "ALL") {
      if (selectedProvince === "ALL") router.push("/pedacc");
      else router.push(`/pedacc?region=${encodeURIComponent(selectedProvince)}`);
    } else {
      router.push(`/pedacc?region=${encodeURIComponent(cityCode)}`); // ✅ 5자리
    }
  };

  return (
    <div className="w-full bg-gray-50 h-full">
      <div className="max-w-7xl p-6 space-y-6 h-full  mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">보행자 사고 현황</h1>
            <div className="text-sm text-gray-600">선택 지역: {selectedName}</div>
          </div>

          <RegionSelectors
            provinces={provinces}
            cities={cities}
            selectedProvince={selectedProvince}
            selectedCity={selectedCity}
            loadingCities={loadingCities}
            onChangeProvince={onChangeProvince}
            onChangeCity={onChangeCity}
          />
        </div>

        {loading && <div>로딩 중…</div>}
        {error && <div className="text-red-600">에러: {error}</div>}

        {/* 그래프 섹션 */}
        {yearlyAggregated.length > 0 && (
          <div className="space-y-6">
            {/* 연도별 추세 그래프 */}
            <div className="rounded-xl border p-4 bg-white">
              <YearlyTrendChart yearlyData={yearlyAggregated} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 사고 유형별 그래프 */}
              <div className="rounded-xl border p-4 bg-white">
                <AccidentTypeChart yearlyData={yearlyAggregated} />
              </div>

              {/* 월별 상세 그래프 */}
              {selectedYear && (
                <div className="rounded-xl border p-4 bg-white">
                  <MonthlyChart monthlyData={monthly} selectedYear={selectedYear} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 테이블 섹션 */}
        <TablesSection
          yearlyAggregated={yearlyAggregated}
          selectedYear={selectedYear}
          availableYears={availableYears}
          selectedYearMonthly={selectedYearMonthly}
          setSelectedYear={setSelectedYear}
        />
      </div>
    </div>
  );

}


