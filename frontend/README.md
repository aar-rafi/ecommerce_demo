# E-Commerce Frontend

Modern Next.js 14 frontend for the e-commerce platform, built with shadcn/ui components for full twekcn theme support.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **shadcn/ui** components (twekcn compatible)
- **Tailwind CSS** for styling
- **React Query** for server state management
- **Zustand** for client state management
- **Responsive design** for all devices

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Query + Zustand
- **API Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend services running on `http://localhost:4000`

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build Docker image
docker build -t ecommerce-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:4000 \
  ecommerce-frontend
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Project Structure

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── orders/            # Order history
│   ├── profile/           # User profile
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── products/          # Product components
├── hooks/                 # Custom React hooks
│   ├── use-auth.ts        # Authentication hook
│   ├── use-cart.ts        # Cart hook
│   └── use-toast.ts       # Toast notifications
├── lib/                   # Utility functions
│   └── utils.ts           # Helper functions
├── services/              # API services
│   └── api.ts             # API client
├── types/                 # TypeScript types
│   └── index.ts           # Type definitions
└── public/                # Static assets
```

## Features Overview

### Authentication
- User registration and login
- JWT-based authentication
- Persistent session with Zustand
- Protected routes

### Products
- Product listing with grid layout
- Product detail pages
- Image support (Unsplash)
- Category filtering
- Stock management display

### Shopping Cart
- Add/remove items
- Update quantities
- Real-time total calculation
- Redis-backed persistence

### Orders
- Order placement
- Order history
- Status tracking
- Order details view

## shadcn/ui Components

This project uses shadcn/ui components which are fully compatible with twekcn themes:

- Button
- Card
- Input
- Label
- Badge
- Avatar
- Dropdown Menu
- Toast
- Separator

### Adding More Components

```bash
# Use shadcn CLI to add components
npx shadcn-ui@latest add [component-name]
```

## Customizing Themes

The project is configured to support twekcn themes. To apply a theme:

1. Visit [twekcn.com](https://twekcn.com)
2. Choose your theme
3. Copy the CSS variables
4. Paste into `app/globals.css` under `:root` and `.dark`

## API Integration

All API calls go through the API Gateway at `http://localhost:4000`:

- **Auth**: `/api/auth/*`
- **Products**: `/api/products/*`
- **Cart**: `/api/cart/*`
- **Orders**: `/api/orders/*`

## Development Tips

### Hot Reload
Changes to files automatically trigger hot reload in development mode.

### Type Safety
All API responses and components are fully typed with TypeScript.

### State Management
- **Server state**: Use React Query hooks
- **Client state**: Use Zustand stores
- **Auth state**: Persisted in localStorage via Zustand

### Styling
- Use Tailwind utility classes
- Import shadcn/ui components from `@/components/ui`
- Customize via `tailwind.config.ts`

## Deployment

### Docker Compose
The frontend is included in the main docker-compose.yml:

```bash
# From project root
docker compose up frontend
```

### Standalone Deployment
For production deployment:

```bash
npm run build
npm start
```

Or use the Docker image:

```bash
docker build -t ecommerce-frontend .
docker run -p 3000:3000 ecommerce-frontend
```

## License

MIT
