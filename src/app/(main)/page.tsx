import Link from "next/link";
import HomeHero from "@/components/home/HomeHero";
import HomeFeatures from "@/components/home/HomeFeatures";
import HomeTechStack from "@/components/home/HomeTechStack";
import { AnimatedFeatures, AnimatedTechStack, AnimatedCTA } from "@/components/home/HomeAnimations";
import type { Metadata } from "next";

// Optional: ISR for live stats (if needed in the future)
// export const revalidate = 120; // Revalidate every 2 minutes

export const metadata: Metadata = {
  title: "보행자 교통안전 분석 대시보드 | Pedestrian Traffic Safety Dashboard",
  description: "전국 보행자 사고 데이터와 교통 시설 정보를 통합한 데이터 기반 교통 안전 분석 플랫폼. 인터랙티브 지도, KPI 대시보드, 시민 참여형 건의 시스템을 제공합니다.",
  openGraph: {
    title: "보행자 교통안전 분석 대시보드",
    description: "전국 보행자 사고 데이터와 교통 시설 정보를 통합한 데이터 기반 교통 안전 분석 플랫폼",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <main className="container mx-auto px-4">
        {/* Hero: 첫 로딩 화면 중앙 고정 */}
        <HomeHero />

        {/* 주요 기능: 스크롤 시 등장 */}
        <AnimatedFeatures>
          <HomeFeatures />
        </AnimatedFeatures>

        {/* 기술 스택: 스크롤 시 등장 */}
        <AnimatedTechStack>
          <HomeTechStack />
        </AnimatedTechStack>

        {/* CTA: 스크롤 시 등장 */}
        <AnimatedCTA>
          <section className="text-center py-20">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-xl inline-block"
            >
              대시보드 바로가기
            </Link>
          </section>
        </AnimatedCTA>
      </main>
    </div>
  );
}
