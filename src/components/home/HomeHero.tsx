// Server Component - Static hero section
export default function HomeHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden rounded-2xl">
      <div className="relative text-center w-full">
        <h1 className="text-5xl font-extrabold mb-4 text-white drop-shadow">
          보행자 교통안전 분석 대시보드
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto drop-shadow">
          전국 보행자 사고 데이터와 교통 시설 정보를 통합한 데이터 기반 교통 안전 분석 플랫폼
        </p>

        <div className="mt-10 bg-white lg:max-w-4xl mx-auto px-6 py-8 rounded-xl shadow-sm backdrop-blur">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">프로젝트 목적</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            이 프로젝트는 월별 사고 데이터와 횡단보도·신호등 시설 정보를 결합하여 보행자 안전 지수를 평가하고, 신호등 설치 및 기능 개선의 우선순위를 정량적으로 제시하는 것을 목표로 합니다.
          </p>
        </div>

        {/* 스크롤 유도 */}
        <div className="mt-12 text-white/70 text-sm">↓ 스크롤하여 자세히 보기</div>
      </div>
    </section>
  );
}
