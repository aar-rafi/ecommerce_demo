# Frontend Setup Guide - Next.js with shadcn/ui

This guide explains how to set up the Next.js frontend with shadcn/ui components and Tweakcn theme support.

## Quick Setup

Since you mentioned you want to use shadcn components with Tweakcn theme, here's how to set it up:

### 1. Create Next.js App

```bash
cd ecommerce_demo
npx create-next-app@latest frontend
```

**Configuration options:**
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ `src/` directory
- ✅ App Router
- ❌ import alias (use default @/*)

### 2. Install shadcn/ui

```bash
cd frontend
npx shadcn-ui@latest init
```

**Configuration:**
- Style: Default
- Base color: Slate (or your preference)
- CSS variables: Yes

This creates:
- `components/ui/` - shadcn components
- `lib/utils.ts` - utility functions
- `tailwind.config.ts` - Tailwind configuration

### 3. Install Required Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
```

### 4. Install Additional Dependencies

```bash
npm install @tanstack/react-query axios zustand
npm install -D @types/node
```

**Dependencies:**
- `@tanstack/react-query` - Data fetching and state management
- `axios` - HTTP client
- `zustand` - Lightweight state management (optional)

### 5. Configure Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 6. Set Up API Client

Create `src/lib/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 7. Set Up React Query

Create `src/providers/query-provider.tsx`:
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Update `src/app/layout.tsx`:
```typescript
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

## Tweakcn Theme Setup

Tweakcn allows easy theme customization for shadcn/ui.

### Option 1: Use Tweakcn CLI (Recommended)

```bash
npx tweakcn@latest
```

Follow the prompts to customize your theme.

### Option 2: Manual Theme Configuration

Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // ... other colors
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

## Example Components

### Product Card Component

Create `src/components/product-card.tsx`:
```typescript
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stockQuantity: number;
  onAddToCart: (id: number) => void;
}

export function ProductCard({
  id,
  name,
  price,
  imageUrl,
  category,
  stockQuantity,
  onAddToCart,
}: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{category}</Badge>
        </div>
        <p className="text-2xl font-bold text-primary">${price.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {stockQuantity > 0 ? `${stockQuantity} in stock` : 'Out of stock'}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={() => onAddToCart(id)}
          disabled={stockQuantity === 0}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Products Page with React Query

Create `src/app/products/page.tsx`:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_url: string;
}

export default function ProductsPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<Product[]>('/api/products');
      return response.data;
    },
  });

  const handleAddToCart = async (productId: number) => {
    try {
      await api.post('/api/cart/items', {
        productId,
        quantity: 1,
      });
      // Show toast notification
      alert('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            imageUrl={product.image_url}
            category={product.category}
            stockQuantity={product.stock_quantity}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
```

### Login Page

Create `src/app/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

      router.push('/products');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   └── page.tsx
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   └── orders/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── product-card.tsx
│   │   ├── cart-item.tsx
│   │   └── navbar.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-products.ts
│   │   ├── use-cart.ts
│   │   └── use-auth.ts
│   └── providers/
│       └── query-provider.tsx
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Access at http://localhost:3000

## Building for Production

```bash
npm run build
npm start
```

## Docker Support

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

## Additional Features to Implement

1. **Shopping Cart** - Full cart management UI
2. **Checkout Flow** - Multi-step checkout process
3. **Order History** - View past orders
4. **User Profile** - Manage account settings
5. **Product Search** - Search and filter products
6. **Dark Mode** - Theme toggle
7. **Toast Notifications** - User feedback
8. **Loading States** - Better UX
9. **Error Boundaries** - Graceful error handling
10. **Responsive Design** - Mobile-first approach

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tweakcn](https://tweakcn.com)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com)
