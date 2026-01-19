// Server Component - Static features list
import FeatureCard from "@/components/main/FeatureCard";

export default function HomeFeatures() {
  return (
    <section className="pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:max-w-4xl mx-auto">
        <FeatureCard icon="/globe.svg" title="인터랙티브 지도 분석">
          <ul className="list-disc list-inside">
            <li>시도, 시군구 기준으로 원하는 지역 이동</li>
            <li>월별 보행자 사고 분포 시각화</li>
            <li>사고 다발지역(Hotspot) 위치 마커 표시</li>
            <li>횡단보도 및 신호등 위치 마커 표시</li>
          </ul>
        </FeatureCard>

        <FeatureCard icon="/window.svg" title="KPI 중심 대시보드">
          <ul className="list-disc list-inside">
            <li>신호등 설치율 분석</li>
            <li>시설 취약도 기반 안전 지수 계산</li>
            <li>횡단보도 반경 500m 내 사고다발지역 기반 위험 지수</li>
          </ul>
        </FeatureCard>

        <FeatureCard icon="/file.svg" title="시민 참여형 건의 시스템">
          <ul className="list-disc list-inside">
            <li>지도 기반 신호등 설치 건의 작성</li>
            <li>선택된 지역 위험 지수 확인</li>
            <li>댓글 및 좋아요 기능</li>
          </ul>
        </FeatureCard>

        <FeatureCard icon="/file.svg" title="사용자 계정 관리">
          <ul className="list-disc list-inside">
            <li>OAuth2 기반 소셜 로그인 (구글, 네이버, 깃허브)</li>
            <li>이메일 기반 회원가입/로그인</li>
            <li>프로필 관리 및 비밀번호 변경</li>
            <li>내 활동 내역 조회</li>
          </ul>
        </FeatureCard>
      </div>
    </section>
  );
}
