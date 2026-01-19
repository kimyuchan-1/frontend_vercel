# Developer Guidelines for Next.js Rendering Optimization

## Table of Contents

1. [Introduction](#introduction)
2. [Rendering Strategy Decision Tree](#rendering-strategy-decision-tree)
3. [Common Patterns](#common-patterns)
4. [Performance Budgets](#performance-budgets)
5. [Best Practices](#best-practices)
6. [Code Examples](#code-examples)
7. [Testing Guidelines](#testing-guidelines)
8. [Troubleshooting](#troubleshooting)

## Introduction

This guide helps developers make informed decisions about rendering strategies when building or modifying pages in the Pedestrian Traffic Safety Analysis Dashboard. Following these guidelines ensures optimal performance, maintainability, and user experience.

## Rendering Strategy Decision Tree

Use this decision tree when creating a new page or optimizing an existing one:

```
┌─────────────────────────────────────┐
│     Creating/Optimizing a Page      │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Is it authenticated/ │
    │ user-specific?       │
    └──────┬───────────────┘
           │
     ┌─────┴─────┐
     │           │
    YES          NO
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────────┐
│ SSR     │  │ Does content     │
│ (Fixed) │  │ change?          │
│         │  └────┬─────────────┘
│ Account │       │
│ pages   │  ┌────┴────┬──────────────┐
└─────────┘  │         │              │
          Rarely   Periodically   Frequently
             │         │              │
             ▼         ▼              ▼
        ┌────────┐ ┌────────┐   ┌────────┐
        │  SSG   │ │  ISR   │   │ SSR or │
        │        │ │ 30-120s│   │ ISR    │
        └────┬───┘ └───┬────┘   └───┬────┘
             │         │            │
             ▼         ▼            ▼
    ┌──────────────────────────────────┐
    │ Does it need interactivity?      │
    └──────┬───────────────────────────┘
           │
     ┌─────┴─────┬──────────────┐
     │           │              │
   Forms/     Maps/Charts   Real-time
   State      Heavy UI      Updates
     │           │              │
     ▼           ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Hybrid:  │ │ Hybrid:  │ │ Hybrid:  │
│ Server + │ │ Server + │ │ ISR +    │
│ Client   │ │ CSR      │ │ CSR      │
│ Forms    │ │ (Dynamic │ │ (Comments│
│          │ │ Import)  │ │ /Likes)  │
└──────────┘ └──────────┘ └──────────┘
```

### Quick Reference Table

| Page Type | Content Changes | Interactivity | SEO Important | Auth Required | Strategy |
|-----------|----------------|---------------|---------------|---------------|----------|
| Landing/Marketing | Rarely | Low | Yes | No | **SSG** |
| Landing with Stats | Periodically | Low | Yes | No | **ISR (60-120s)** |
| Blog/Documentation | Rarely | Low | Yes | No | **SSG** |
| Product Listings | Periodically | Medium | Yes | No | **ISR (30-120s)** |
| Product Details | Periodically | Medium | Yes | No | **ISR + CSR** |
| Dashboard/Analytics | Periodically | High | No | Maybe | **ISR/SSR + CSR** |
| User Account | Always Fresh | Medium | No | Yes | **SSR (Fixed)** |
| Admin Panel | Always Fresh | High | No | Yes | **SSR + CSR** |
| Forms (with static content) | N/A | High | Maybe | No | **Hybrid** |
| Real-time Apps | Real-time | Very High | No | Maybe | **ISR + CSR** |

### 현 프로젝트 적용 (Recommended for This Project)

| Page | Strategy | Revalidation | Rationale |
|------|----------|--------------|-----------|
| `/` | SSG or ISR | 60-120s | 랜딩 페이지, 선택적 실시간 통계 |
| `/board` | ISR | 30-120s | 자주 변하는 목록, SEO 중요 |
| `/board/[id]` | ISR + CSR | 60s | 본문 ISR + 댓글/좋아요 CSR |
| `/dashboard` | ISR + CSR | 60s | Shell ISR + 지도/차트 CSR |
| `/pedacc` | ISR + CSR | 120s | Shell ISR + 인터랙티브 분석 CSR |
| `/account/*` | SSR | Never | 보안/권한, 항상 신선한 데이터 |
| `/signin`, `/signup` | Hybrid | N/A | 정적 레이아웃 + 폼 |

## Common Patterns

### Pattern 1: Static Page with Animations

**Use Case:** Landing pages, marketing pages, about pages

**Strategy:** SSG with Client Islands

**Implementation:**

```typescript
// app/page.tsx (Server Component)
import { HeroSection } from '@/components/HeroSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { AnimatedElements } from '@/components/AnimatedElements'

export const metadata = {
  title: 'Welcome to Our App',
  description: 'Discover amazing features',
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <AnimatedElements /> {/* Client Component */}
    </main>
  )
}
```

```typescript
// components/AnimatedElements.tsx (Client Component)
'use client'

import { useInView } from 'react-intersection-observer'

export function AnimatedElements() {
  const [ref, inView] = useInView({ triggerOnce: true })
  
  return (
    <div ref={ref} className={inView ? 'animate-fade-in' : 'opacity-0'}>
      {/* Animated content */}
    </div>
  )
}
```

**Key Points:**
- Main page is Server Component (no 'use client')
- Static content in Server Components
- Only animations in Client Component
- Metadata for SEO

---

### Pattern 2: Dynamic List with Filters

**Use Case:** Product listings, blog posts, suggestion boards

**Strategy:** SSR with Client Controls

**Implementation:**

```typescript
// app/products/page.tsx (Server Component)
import { ProductList } from '@/components/ProductList'
import { FilterControls } from '@/components/FilterControls'

interface PageProps {
  searchParams: {
    category?: string
    search?: string
    page?: string
  }
}

async function getProducts(params: PageProps['searchParams']) {
  const queryString = new URLSearchParams(params).toString()
  const res = await fetch(`${process.env.API_URL}/products?${queryString}`, {
    cache: 'no-store' // Always fetch fresh data
  })
  
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const data = await getProducts(searchParams)
  
  return (
    <div>
      <FilterControls initialFilters={searchParams} />
      <ProductList products={data.products} />
    </div>
  )
}
```

```typescript
// components/FilterControls.tsx (Client Component)
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function FilterControls({ initialFilters }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/products?${params.toString()}`)
  }
  
  return (
    <div>
      {/* Filter controls */}
    </div>
  )
}
```

**Key Points:**
- Server Component fetches data based on URL params
- Complete list rendered in initial HTML
- Client Component handles filter interactions
- URL updates trigger server re-render

---

### Pattern 3: Dashboard with Mixed Content

**Use Case:** Analytics dashboards, admin panels with stats

**Strategy:** Hybrid (SSR for data + CSR for interactivity)

**Implementation:**

```typescript
// app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react'
import { KPICards } from '@/components/KPICards'
import { InteractiveChart } from '@/components/InteractiveChart'
import { KPISkeleton } from '@/components/KPISkeleton'

async function getKPIData() {
  const res = await fetch(`${process.env.API_URL}/kpi`, {
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Failed to fetch KPI data')
  return res.json()
}

export default async function DashboardPage() {
  const kpiData = await getKPIData()
  
  return (
    <div>
      <Suspense fallback={<KPISkeleton />}>
        <KPICards data={kpiData} />
      </Suspense>
      
      <InteractiveChart initialData={kpiData} />
    </div>
  )
}
```

```typescript
// components/InteractiveChart.tsx (Client Component)
'use client'

import { useState, useEffect } from 'react'
import { Chart } from 'chart.js'

export function InteractiveChart({ initialData }) {
  const [data, setData] = useState(initialData)
  const [timeRange, setTimeRange] = useState('7d')
  
  useEffect(() => {
    // Fetch updated data when time range changes
    fetch(`/api/chart-data?range=${timeRange}`)
      .then(r => r.json())
      .then(setData)
  }, [timeRange])
  
  return (
    <div>
      {/* Chart controls and visualization */}
    </div>
  )
}
```

**Key Points:**
- Server Component fetches initial data
- Static data (KPIs) rendered on server
- Interactive elements (charts) are Client Components
- Suspense for progressive loading

---

### Pattern 4: Form with Static Content

**Use Case:** Authentication pages, contact forms, checkout

**Strategy:** Hybrid (Server for layout + Client for form)

**Implementation:**

```typescript
// app/signin/page.tsx (Server Component)
import { SignInForm } from '@/components/SignInForm'

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
}

export default function SignInPage() {
  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Welcome Back</h1>
        <p>Sign in to continue to your dashboard</p>
      </div>
      
      <SignInForm />
      
      <div className="auth-footer">
        <p>Don't have an account? <a href="/signup">Sign up</a></p>
      </div>
    </div>
  )
}
```

```typescript
// components/SignInForm.tsx (Client Component)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const data = await res.json()
        setError(data.message || 'Invalid credentials')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit">Sign In</button>
    </form>
  )
}
```

**Key Points:**
- Static content (headers, descriptions) in Server Component
- Form logic in Client Component
- Reduced JavaScript bundle (only form code)
- Metadata for SEO

---

### Pattern 5: Dynamic Detail Page

**Use Case:** Blog posts, product details, user profiles

**Strategy:** SSR with Dynamic Metadata

**Implementation:**

```typescript
// app/products/[id]/page.tsx (Server Component)
import { notFound } from 'next/navigation'
import { ProductDetails } from '@/components/ProductDetails'
import { AddToCartButton } from '@/components/AddToCartButton'

interface PageProps {
  params: { id: string }
}

async function getProduct(id: string) {
  const res = await fetch(`${process.env.API_URL}/products/${id}`, {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Failed to fetch product')
  }
  
  return res.json()
}

export async function generateMetadata({ params }: PageProps) {
  const product = await getProduct(params.id)
  
  if (!product) return { title: 'Not Found' }
  
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
      type: 'product',
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.id)
  
  if (!product) notFound()
  
  return (
    <div>
      <ProductDetails product={product} />
      <AddToCartButton productId={product.id} />
    </div>
  )
}
```

```typescript
// app/products/[id]/not-found.tsx
export default function ProductNotFound() {
  return (
    <div>
      <h2>Product Not Found</h2>
      <p>The product you're looking for doesn't exist.</p>
      <a href="/products">Back to Products</a>
    </div>
  )
}
```

**Key Points:**
- Dynamic metadata based on content
- Server-side data fetching
- Not found handling
- Client Components only for interactions

---

## Performance Budgets

### JavaScript Bundle Size Limits

Set strict limits for JavaScript bundle sizes:

| Page Type | Target | Maximum |
|-----------|--------|---------|
| Landing/Marketing | < 50 KB | 75 KB |
| List Pages | < 80 KB | 100 KB |
| Detail Pages | < 70 KB | 90 KB |
| Forms | < 60 KB | 80 KB |
| Dashboards | < 150 KB | 200 KB |

### Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| FCP (First Contentful Paint) | < 1.8s | 1.8s - 3.0s | > 3.0s |
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s |
| TTI (Time to Interactive) | < 3.5s | 3.5s - 7.3s | > 7.3s |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |

### Monitoring Bundle Sizes

Use the bundle analyzer to monitor sizes:

```bash
# Analyze bundle
ANALYZE=true npm run build

# Check specific page bundles
npm run build -- --profile
```

## Best Practices

### 1. Server Component Best Practices

✅ **DO:**
- Use Server Components by default
- Fetch data directly in Server Components
- Access backend resources (databases, file system)
- Render static content
- Use async/await for data fetching

❌ **DON'T:**
- Use React hooks (useState, useEffect, etc.)
- Use browser APIs (window, localStorage, etc.)
- Add event listeners (onClick, onChange, etc.)
- Use third-party libraries that require browser environment

### 2. Client Component Best Practices

✅ **DO:**
- Mark components with 'use client' only when necessary
- Keep Client Components small and focused
- Pass data from Server Components as props
- Use for interactivity and state management

❌ **DON'T:**
- Make entire pages Client Components unnecessarily
- Fetch data in Client Components if it can be server-fetched
- Pass non-serializable props (functions, class instances)
- Nest Server Components inside Client Components

### 3. Data Fetching Best Practices

✅ **DO:**
- Fetch data in Server Components when possible
- Use appropriate cache strategies:
  - `cache: 'force-cache'` for static data (SSG)
  - `cache: 'no-store'` for dynamic data (SSR)
  - `next: { revalidate: 3600 }` for ISR (revalidate every hour)
- Handle errors gracefully
- Implement loading states

❌ **DON'T:**
- Fetch data in Client Components if it can be server-fetched
- Forget to handle loading and error states
- Use client-side data fetching for SEO-critical content

### 4. Component Composition Best Practices

✅ **DO:**
- Compose Server and Client Components carefully
- Pass data down from Server to Client Components
- Use the 'children' prop to nest Server Components in Client Components
- Keep component boundaries clear

❌ **DON'T:**
- Try to import Server Components into Client Components directly
- Pass complex objects that can't be serialized
- Create circular dependencies

### 5. Performance Best Practices

✅ **DO:**
- Minimize JavaScript bundle size
- Use dynamic imports for large libraries
- Implement code splitting
- Optimize images with next/image
- Use Suspense for progressive loading

❌ **DON'T:**
- Import large libraries in Server Components unnecessarily
- Load all data before showing anything
- Forget to optimize images and assets

## Code Examples

### Example 1: Converting CSR to SSR

**Before (Client-Side Rendering):**

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
  }, [])
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

**After (Server-Side Rendering):**

```typescript
// Server Component (no 'use client')
async function getProducts() {
  const res = await fetch(`${process.env.API_URL}/products`, {
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts()
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

**Benefits:**
- No loading state needed (server-rendered)
- Better SEO (complete HTML)
- Smaller JavaScript bundle
- Faster initial render

---

### Example 2: Extracting Client Component

**Before (Entire page is Client Component):**

```typescript
'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    // Submit logic
  }
  
  return (
    <div>
      <h1>Contact Us</h1>
      <p>We'd love to hear from you!</p>
      
      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit">Submit</button>
      </form>
      
      <div>
        <h2>Our Office</h2>
        <p>123 Main St, City, State 12345</p>
      </div>
    </div>
  )
}
```

**After (Hybrid with extracted Client Component):**

```typescript
// app/contact/page.tsx (Server Component)
import { ContactForm } from '@/components/ContactForm'

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with our team',
}

export default function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      <p>We'd love to hear from you!</p>
      
      <ContactForm />
      
      <div>
        <h2>Our Office</h2>
        <p>123 Main St, City, State 12345</p>
      </div>
    </div>
  )
}
```

```typescript
// components/ContactForm.tsx (Client Component)
'use client'

import { useState } from 'react'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Submit logic
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

**Benefits:**
- Static content (headers, office info) server-rendered
- Only form logic in Client Component
- Better SEO with metadata
- Smaller JavaScript bundle

---

### Example 3: Using Dynamic Imports

**For large libraries (like Leaflet for maps):**

```typescript
// components/MapView.tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

// Dynamically import map component (no SSR)
const Map = dynamic(
  () => import('./Map'),
  { 
    ssr: false,
    loading: () => <div>Loading map...</div>
  }
)

export function MapView({ initialData }) {
  const [mapData, setMapData] = useState(initialData)
  
  return (
    <div>
      <Map data={mapData} />
    </div>
  )
}
```

**Benefits:**
- Map library not included in initial bundle
- Loads only when needed
- Avoids SSR issues with browser-only libraries

---

## Testing Guidelines

### Unit Testing

Test components in isolation:

```typescript
// __tests__/components/ProductList.test.tsx
import { render, screen } from '@testing-library/react'
import { ProductList } from '@/components/ProductList'

describe('ProductList', () => {
  test('renders products correctly', () => {
    const products = [
      { id: 1, name: 'Product 1', price: 10 },
      { id: 2, name: 'Product 2', price: 20 },
    ]
    
    render(<ProductList products={products} />)
    
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(screen.getByText('Product 2')).toBeInTheDocument()
  })
  
  test('handles empty list', () => {
    render(<ProductList products={[]} />)
    expect(screen.getByText(/no products/i)).toBeInTheDocument()
  })
})
```

### Property-Based Testing

Test universal properties:

```typescript
// __tests__/properties/rendering.property.test.ts
import fc from 'fast-check'

describe('Rendering Properties', () => {
  test('server-rendered pages contain complete HTML', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          page: fc.integer({ min: 1, max: 10 }),
          category: fc.constantFrom('a', 'b', 'c'),
        }),
        async (params) => {
          const html = await fetchPageHTML(`/products?page=${params.page}&category=${params.category}`)
          
          // HTML should contain product list
          expect(html).toContain('product-list')
          // Should not require JavaScript to display content
          expect(html).toMatch(/<div[^>]*>.*product.*<\/div>/i)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Performance Testing

Monitor performance metrics:

```typescript
// __tests__/performance/bundle-size.test.ts
import { getBundleSize } from '@/test/utils'

describe('Bundle Size', () => {
  test('home page bundle is under 50KB', async () => {
    const size = await getBundleSize('/')
    expect(size).toBeLessThan(50 * 1024) // 50 KB
  })
  
  test('products page bundle is under 80KB', async () => {
    const size = await getBundleSize('/products')
    expect(size).toBeLessThan(80 * 1024) // 80 KB
  })
})
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "You're importing a component that needs useState..."

**Error:**
```
Error: You're importing a component that needs useState. It only works in a Client Component but none of its parents are marked with "use client"
```

**Solution:**
Add 'use client' directive to the component that uses hooks:

```typescript
'use client'

import { useState } from 'react'

export function MyComponent() {
  const [state, setState] = useState()
  // ...
}
```

---

#### Issue 2: "Cannot pass functions as props to Client Components"

**Error:**
```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"
```

**Solution:**
Don't pass functions as props. Instead, handle the logic in the Client Component:

**Before:**
```typescript
// Server Component
export default function Page() {
  const handleClick = () => console.log('clicked')
  return <ClientButton onClick={handleClick} />
}
```

**After:**
```typescript
// Server Component
export default function Page() {
  return <ClientButton />
}

// Client Component
'use client'
export function ClientButton() {
  const handleClick = () => console.log('clicked')
  return <button onClick={handleClick}>Click</button>
}
```

---

#### Issue 3: "window is not defined"

**Error:**
```
ReferenceError: window is not defined
```

**Solution:**
Use dynamic import with `ssr: false` for browser-only code:

```typescript
'use client'

import dynamic from 'next/dynamic'

const BrowserOnlyComponent = dynamic(
  () => import('./BrowserOnlyComponent'),
  { ssr: false }
)

export function MyComponent() {
  return <BrowserOnlyComponent />
}
```

---

#### Issue 4: Slow page loads despite optimization

**Diagnosis:**
1. Check bundle size: `ANALYZE=true npm run build`
2. Check network waterfall in DevTools
3. Run Lighthouse audit

**Solutions:**
- Use dynamic imports for large libraries
- Implement code splitting
- Optimize images with next/image
- Use Suspense for progressive loading
- Check for unnecessary client-side data fetching

---

#### Issue 5: SEO not working for dynamic pages

**Diagnosis:**
- View page source (Ctrl+U) - is content in HTML?
- Check metadata in HTML head
- Use Google's Rich Results Test

**Solutions:**
- Ensure page is Server Component (not Client Component)
- Implement `generateMetadata` for dynamic pages
- Add structured data (JSON-LD)
- Verify data is fetched server-side

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Web.dev Performance](https://web.dev/performance/)
- [Rendering Strategies Documentation](./RENDERING_STRATEGIES.md)
- [Project README](../README.md)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Search [Next.js GitHub issues](https://github.com/vercel/next.js/issues)
3. Ask in the team's development channel
4. Review existing optimized pages in the codebase for examples

## Conclusion

Following these guidelines ensures:
- ✅ Optimal performance
- ✅ Better SEO
- ✅ Maintainable code
- ✅ Consistent patterns
- ✅ Great user experience

Remember: **Start with Server Components, add Client Components only when needed.**
