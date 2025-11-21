# Frontend Quick Start Guide

This guide will help you get the e-commerce frontend up and running.

## Option 1: Run with Docker Compose (Recommended)

This is the easiest way to run the entire stack including the frontend:

```bash
# From project root
docker compose up -d

# Check if frontend is running
docker compose ps frontend
```

The frontend will be available at: http://localhost:3000
The API Gateway will be at: http://localhost:4000

## Option 2: Run Locally for Development

If you want to develop the frontend with hot reload:

### 1. Make sure backend services are running

```bash
# Start all backend services
docker compose up -d postgres redis auth-service product-catalog cart-service order-service api-gateway
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Run development server

```bash
npm run dev
```

The frontend will be available at: http://localhost:3000 with hot reload enabled.

## Using the Application

### 1. Create an Account

1. Navigate to http://localhost:3000
2. Click "Sign Up" in the header
3. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password
4. Click "Create account"

You'll be automatically logged in and redirected to the products page.

### 2. Browse Products

- View all products on the homepage or `/products` page
- Click on a product to see details
- Use the quantity selector to choose how many to add
- Click "Add to Cart"

### 3. Shopping Cart

- Click the cart icon in the header to view your cart
- Adjust quantities with +/- buttons
- Remove items with the trash icon
- Click "Checkout" to place your order

### 4. View Orders

- Click "Orders" in the header after logging in
- See all your past orders with status and details

### 5. Profile

- Click your avatar in the header
- Select "Profile" to view your account details

## Test Credentials

If you've run the seed script, you can use these credentials:

```
Email: test@example.com
Password: password123
```

## Customizing the Theme (twekcn)

The frontend is built with shadcn/ui components which fully support twekcn themes:

### 1. Visit twekcn.com

Go to https://twekcn.com and browse the theme gallery.

### 2. Choose a Theme

Select a theme you like and copy the CSS variables.

### 3. Update Your Styles

Edit `frontend/app/globals.css` and replace the CSS variables under `:root` and `.dark` with your chosen theme.

### 4. Restart the Dev Server

```bash
# If running locally
npm run dev

# If using Docker
docker compose restart frontend
```

Your new theme will be applied instantly!

## Available Pages

- `/` - Home page with featured products
- `/products` - All products listing
- `/products/[id]` - Product detail page
- `/cart` - Shopping cart
- `/orders` - Order history (requires login)
- `/profile` - User profile (requires login)
- `/login` - Login page
- `/register` - Registration page
- `/about` - About the platform

## Troubleshooting

### Frontend won't start

**Issue**: Container exits immediately
**Solution**: Check logs: `docker compose logs frontend`

**Issue**: "Cannot connect to API"
**Solution**: Ensure API Gateway is running: `docker compose ps api-gateway`

### Products not loading

**Issue**: Empty product list
**Solution**: Run the seed script:
```bash
chmod +x scripts/seed-data.sh
./scripts/seed-data.sh
```

### Can't login

**Issue**: "Invalid credentials"
**Solution**: Register a new account or use the test credentials if seeded

### Cart not persisting

**Issue**: Cart items disappear on refresh
**Solution**:
1. Check Redis is running: `docker compose ps redis`
2. Make sure you're logged in (cart requires authentication)

### Images not loading

**Issue**: Product images show "No image"
**Solution**: Images are from Unsplash and require internet connection

## Development Tips

### Hot Reload

When running with `npm run dev`, changes to code will automatically refresh the browser.

### Adding New Components

Use the shadcn CLI to add components:

```bash
cd frontend
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
```

### API Calls

All API calls go through the services in `frontend/services/api.ts`. They automatically include authentication tokens from localStorage.

### State Management

- **Server State**: Use React Query hooks (already set up in components)
- **Auth State**: Use the `useAuth()` hook
- **Cart State**: Use the `useCart()` hook

### TypeScript

All types are defined in `frontend/types/index.ts`. Update these when the API changes.

## Building for Production

### Local Build

```bash
cd frontend
npm run build
npm start
```

### Docker Build

```bash
docker build -t ecommerce-frontend frontend/
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:4000 \
  ecommerce-frontend
```

## Next Steps

1. **Customize the theme** using twekcn
2. **Add more features** to the frontend
3. **Deploy to production** using the cloud deployment guide
4. **Monitor with Grafana** at http://localhost:3001

For more information, see the main documentation in `/docs`.
