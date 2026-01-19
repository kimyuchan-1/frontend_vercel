import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// 위험지표 계산 함수 (LocationInfoPanel과 동일한 로직)
function calculateRiskScore(accidents: any[]): number {
  if (accidents.length === 0) return 0;

  const totalDeaths = accidents.reduce((sum, acc) => sum + (Number(acc.deaths) || 0), 0);
  const totalSerious = accidents.reduce((sum, acc) => sum + (Number(acc.serious_injuries) || 0), 0);
  const totalMinor = accidents.reduce((sum, acc) => sum + (Number(acc.minor_injuries) || 0), 0);
  const totalReported = accidents.reduce((sum, acc) => sum + (Number(acc.reported_injuries) || 0), 0);

  // 가중치 적용
  const weightedScore = 
    totalDeaths * 10 +
    totalSerious * 5 +
    totalMinor * 2 +
    totalReported * 1;

  // 0-10 범위로 정규화 (로그 스케일 사용)
  const normalizedScore = Math.min(10, Math.log10(weightedScore + 1) * 2);

  return Math.round(normalizedScore * 100) / 100; // 소수점 2자리
}

export async function POST(request: NextRequest) {
  try {
    // 보안: 관리자 권한 확인 (선택사항)
    // const user = await getCurrentUser();
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    // }

    const supabase = getSupabaseServiceClient();

    // 1) 모든 suggestions 조회
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("suggestions")
      .select("id, location_lat, location_lon");

    if (suggestionsError) {
      console.error("Suggestions query error:", suggestionsError);
      return NextResponse.json({ error: suggestionsError.message }, { status: 500 });
    }

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json({ 
        message: "업데이트할 건의사항이 없습니다.",
        updated: 0 
      });
    }

    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // 2) 각 suggestion에 대해 priority_score 계산 및 업데이트
    for (const suggestion of suggestions) {
      try {
        const { id, location_lat, location_lon } = suggestion;

        if (!location_lat || !location_lon) {
          errors.push(`ID ${id}: 위치 정보 없음`);
          errorCount++;
          continue;
        }

        // 주변 사고 데이터 조회 (반경 약 500m)
        const delta = 0.005;
        const minLat = location_lat - delta;
        const maxLat = location_lat + delta;
        const minLon = location_lon - delta;
        const maxLon = location_lon + delta;

        const { data: accidents, error: accError } = await supabase
          .from("ACC")
          .select("deaths, serious_injuries, minor_injuries, reported_injuries")
          .gte("lati", minLat)
          .lte("lati", maxLat)
          .gte("long", minLon)
          .lte("long", maxLon);

        if (accError) {
          errors.push(`ID ${id}: 사고 데이터 조회 실패 - ${accError.message}`);
          errorCount++;
          continue;
        }

        // 위험지표 계산
        const priorityScore = calculateRiskScore(accidents || []);

        // priority_score 업데이트
        const { error: updateError } = await supabase
          .from("suggestions")
          .update({ priority_score: priorityScore })
          .eq("id", id);

        if (updateError) {
          errors.push(`ID ${id}: 업데이트 실패 - ${updateError.message}`);
          errorCount++;
        } else {
          updatedCount++;
        }
      } catch (err: any) {
        errors.push(`ID ${suggestion.id}: ${err.message}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      message: "Priority score 업데이트 완료",
      total: suggestions.length,
      updated: updatedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined // 최대 10개만 반환
    });
  } catch (error: any) {
    console.error("Update priority scores error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
