# Pedestrian Traffic Safety Analysis Dashboard

A Next.js 16 application for analyzing and improving pedestrian safety with data-driven insights. This dashboard provides comprehensive tools for tracking pedestrian accidents, analyzing safety metrics, and managing community suggestions for infrastructure improvements.

## 🚀 Features

- **Interactive Dashboard**: Real-time KPI tracking and data visualization
- **Safety Analysis**: Comprehensive pedestrian accident data analysis by region
- **Interactive Maps**: Leaflet-based maps showing accident hotspots, crosswalks, and traffic signals
- **Suggestion Board**: Community-driven platform for safety improvement suggestions
- **User Authentication**: Secure sign-in/sign-up with OAuth2 support
- **Optimized Performance**: Leveraging Next.js 16 App Router with React Server Components

## 📊 Performance Optimizations

This application has been extensively optimized using modern Next.js rendering strategies tailored to each page's specific needs:

### Rendering Strategies (현실적인 혼합 구조)

| Page | Strategy | Revalidation | Why |
|------|----------|--------------|-----|
| **Home** (`/`) | SSG/ISR | 60-120s | 랜딩 페이지 - 최대 성능, 선택적 실시간 통계 |
| **Board List** (`/board`) | ISR | 30-120s | 자주 변하는 콘텐츠 - 속도와 신선도 균형 |
| **Board Detail** (`/board/[id]`) | ISR + CSR | 60s | SEO 중요 - 본문 ISR + 댓글/좋아요 CSR |
| **Dashboard** (`/dashboard`) | ISR/SSR + CSR | 60s | 페이지 shell 서버 렌더 + 지도/차트 CSR |
| **PedAcc** (`/pedacc`) | ISR/SSR + CSR | 120s | Dashboard와 유사 - 인터랙티브 분석 |
| **Account** (`/account/*`) | SSR | Never | 보안/권한 - 항상 신선한 사용자 데이터 |
| **Auth** (`/signin`, `/signup`) | Hybrid | N/A | 정적 레이아웃 + 인터랙티브 폼 |

### Key Optimizations

**🎯 Incremental Static Regeneration (ISR)**
- Board pages: 30-120초 재검증으로 빠른 로딩 + 신선한 데이터
- Dashboard: 60초 재검증으로 KPI 데이터 캐싱
- 서버 부하 감소 + 좋은 사용자 경험

**🗺️ Hybrid Rendering**
- 페이지 shell: 서버 렌더링 (ISR/SSR)
- 지도/차트: 클라이언트 렌더링 (Leaflet, Chart.js)
- 최적의 성능과 인터랙티비티 균형

**🔒 Security-First for Auth**
- Account pages: 항상 SSR (캐시 없음)
- 서버 측 권한 검증
- 안전한 사용자 데이터 처리

**💬 Real-time Features**
- 댓글/좋아요: 클라이언트 사이드 실시간 업데이트
- 본문 콘텐츠: ISR로 캐싱하여 SEO 최적화
- "본문 ISR + 댓글 CSR" 혼합 패턴

### Performance Improvements

| Page | Strategy | FCP Improvement | Bundle Size Reduction |
|------|----------|-----------------|----------------------|
| Home | SSG/ISR | 30%+ | ~40% |
| Board List | ISR | 25%+ | ~30% |
| Board Detail | ISR + CSR | 25%+ | ~25% |
| Dashboard | Hybrid | 20%+ | ~20% (non-map code) |
| Auth Pages | Hybrid | 15%+ | ~15% |

### Core Web Vitals

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **React**: 19.x with Server Components
- **Styling**: Tailwind CSS
- **Maps**: Leaflet with React Leaflet
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: React Icons

### Backend & Data
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth2
- **API**: Next.js API Routes with Supabase Client
- **Data Fetching**: Native fetch with caching strategies

### Development & Testing
- **TypeScript**: Full type safety
- **Testing**: Vitest + Playwright
- **Property-Based Testing**: fast-check
- **Performance**: Lighthouse CI
- **Bundle Analysis**: @next/bundle-analyzer

## 🏃 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Naver OAuth Configuration (Required for Naver OAuth login)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key with full database access. Never expose to client-side code.
- `NAVER_CLIENT_SECRET`: OAuth secret credential. Never expose to client-side code.
- Naver OAuth variables are optional but both must be set together if using Naver login.
- See `.env.example` for detailed documentation of all environment variables.

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run visual regression tests
npm run test:visual

# Run property-based tests
npm run test:property

# Run with coverage
npm test -- --coverage
```

### Performance Analysis

```bash
# Analyze bundle size
npm run analyze

# Run Lighthouse CI
npm run lighthouse

# Run all performance checks
npm run perf:check        # Linux/Mac
npm run perf:check:win    # Windows
```

### CI/CD

The project includes comprehensive CI/CD pipelines for automated testing and performance monitoring:

- **Automated Testing**: Unit tests, property-based tests, and visual regression tests
- **Performance Monitoring**: Lighthouse CI with Core Web Vitals tracking
- **Bundle Size Analysis**: Automated bundle size checks and tracking
- **Performance Budgets**: Enforced performance thresholds

See [CI/CD Setup Guide](./docs/CI-CD-SETUP.md) for details.

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (main)/            # Main application routes
│   │   │   ├── page.tsx       # Home page (SSG)
│   │   │   ├── board/         # Suggestion board (SSR)
│   │   │   ├── dashboard/     # Analytics dashboard (Hybrid)
│   │   │   └── pedacc/        # Accident analysis (CSR)
│   │   ├── (auth)/            # Authentication routes
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   ├── home/              # Home page components
│   │   ├── board/             # Board components
│   │   └── dashboard/         # Dashboard components
│   ├── features/              # Feature-specific code
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── test/                  # Test utilities
├── docs/                      # Documentation
│   ├── RENDERING_STRATEGIES.md
│   └── DEVELOPER_GUIDELINES.md
├── __tests__/                 # Test files
├── public/                    # Static assets
└── .kiro/                     # Kiro specs and documentation
```

## 📖 Documentation

- **[Rendering Strategies](./docs/RENDERING_STRATEGIES.md)**: Detailed explanation of rendering strategies used for each page
- **[Developer Guidelines](./docs/DEVELOPER_GUIDELINES.md)**: Best practices and patterns for development
- **[CI/CD Setup Guide](./docs/CI-CD-SETUP.md)**: Comprehensive CI/CD pipeline documentation
- **[Performance Quick Reference](./docs/PERFORMANCE-QUICK-REFERENCE.md)**: Quick reference for performance testing
- **[Structured Data Implementation](./.kiro/specs/nextjs-rendering-optimization/structured-data-implementation.md)**: SEO and structured data details

## 🎯 Key Pages

### Home Page (`/`)
Landing page with project overview, features, and tech stack. Optimized with SSG for instant loading.

### Suggestion Board (`/board`)
Community platform for safety improvement suggestions. Features filtering, search, and pagination with SSR for SEO.

### Dashboard (`/dashboard`)
Analytics dashboard with KPI cards and interactive maps. Uses hybrid rendering for optimal performance.

### Pedestrian Accident Analysis (`/pedacc`)
Detailed accident data analysis by region with interactive tables and visualizations.

### Authentication (`/signin`, `/signup`)
Secure authentication with email/password and OAuth2 support.

## 🔧 Development Guidelines

### Adding New Pages

1. Choose appropriate rendering strategy (see [Developer Guidelines](./docs/DEVELOPER_GUIDELINES.md))
2. Create page component in `src/app/`
3. Implement Server Components for static content
4. Add Client Components only for interactivity
5. Add loading.tsx and error.tsx for better UX
6. Include metadata for SEO
7. Write tests (unit + property-based)
8. Measure performance impact

### Component Guidelines

- **Default to Server Components**: Only use 'use client' when necessary
- **Keep Client Components Small**: Extract only interactive parts
- **Pass Data Down**: Server Components can pass data to Client Components
- **Handle Errors Gracefully**: Implement error boundaries and loading states

### Performance Budgets

- Home Page: < 50 KB JavaScript
- List Pages: < 80 KB JavaScript
- Detail Pages: < 70 KB JavaScript
- Dashboards: < 150 KB JavaScript

## 🧪 Testing Strategy

### Unit Tests
Test individual components and functions in isolation.

### Property-Based Tests
Verify universal properties across all inputs using fast-check.

### Visual Regression Tests
Ensure no visual changes from optimizations using Playwright.

### Performance Tests
Monitor Core Web Vitals and bundle sizes with Lighthouse CI.

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Node.js:

- AWS Amplify
- Netlify
- Railway
- Render
- Self-hosted with Docker

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.

## 📝 Environment Variables

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL (public, safe for browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key (public, safe for browser)
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (⚠️ SERVER-ONLY, admin access)
```

### Optional Variables

```env
# Naver OAuth Configuration (both required if using Naver OAuth)
NAVER_CLIENT_ID=                  # Naver OAuth client ID (⚠️ SERVER-ONLY)
NAVER_CLIENT_SECRET=              # Naver OAuth client secret (⚠️ SERVER-ONLY, sensitive)

# Application Configuration
NEXT_PUBLIC_APP_URL=              # Application base URL (e.g., http://localhost:3000)
NODE_ENV=                         # Environment (development, production, test)
```

### Security Notes

**Critical - Server-Only Variables:**
- `SUPABASE_SERVICE_ROLE_KEY`: Has full admin access to your database. Bypasses Row Level Security (RLS).
- `NAVER_CLIENT_SECRET`: OAuth secret credential for Naver authentication.

**Never:**
- Prefix these with `NEXT_PUBLIC_` (will expose to browser)
- Commit these to version control
- Share these in logs, error messages, or public forums

**Naver OAuth Setup:**
1. Both `NAVER_CLIENT_ID` and `NAVER_CLIENT_SECRET` must be set together
2. Get credentials from [Naver Developers Console](https://developers.naver.com/apps/)
3. Configure callback URL: `https://yourdomain.com/api/oauth2/naver/callback`

See `.env.example` for detailed configuration instructions and examples.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the [Developer Guidelines](./docs/DEVELOPER_GUIDELINES.md)
4. Write tests for new features
5. Ensure all tests pass (`npm test`)
6. Check performance impact (`ANALYZE=true npm run build`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- React team for Server Components
- Leaflet for mapping capabilities
- All contributors and maintainers

## 📚 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - interactive Next.js tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - feedback and contributions welcome

### Performance Resources
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [React Server Components](https://react.dev/reference/rsc/server-components)

## 💬 Support

For questions and support:
- Check the [documentation](./docs/)
- Review [existing issues](https://github.com/your-repo/issues)
- Open a new issue for bugs or feature requests

---

Built with ❤️ using Next.js 16 and React Server Components
