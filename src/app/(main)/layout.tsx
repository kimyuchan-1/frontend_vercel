import Header from "@/components/main/layout/Header";

export const dynamic = "force-dynamic";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* 전역 배경 이미지 */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center scale-105"
        style={{
          backgroundImage: "url('/hero-crosswalk.svg')",
          filter: "brightness(0.65) blur(1.5px)",
        }}
      />
      {/* 전역 오버레이(가독성) */}
      <div className="fixed inset-0 -z-10 bg-black/40" />

      {/* 헤더/콘텐츠 */}
      <div className="relative z-10">
        <Header />
        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}
