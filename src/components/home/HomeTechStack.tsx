// Server Component - Static tech stack grid
import FeatureCard from "@/components/main/FeatureCard";

export default function HomeTechStack() {
  return (
    <section className="pb-16">
      <h2 className="text-3xl font-bold text-center mb-12 text-white">기술 스택</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:max-w-4xl mx-auto">
        <FeatureCard icon="/frontend.svg" title="프론트엔드">
          <ul className="list-disc list-inside">
            <li>Next.js 16 (App Router)</li>
            <li>React 19 + TypeScript</li>
            <li>Tailwind CSS 4</li>
            <li>Leaflet, React-Leaflet</li>
            <li>Chart.js, React-ChartJS-2</li>
            <li>Vitest</li>
          </ul>
        </FeatureCard>

        <FeatureCard icon="/backend.svg" title="백엔드">
          <ul className="list-disc list-inside">
            <li>Spring Boot 3.5.8</li>
            <li>Java 21</li>
            <li>Spring Data JPA</li>
            <li>MySQL 8</li>
            <li>Spring Security, JWT</li>
            <li>OAuth2 Client</li>
          </ul>
        </FeatureCard>
      </div>
    </section>
  );
}
