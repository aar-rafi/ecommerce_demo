export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  sku: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface CartItem {
  productId: number;
  product?: Product;
  quantity: number;
}

export interface Cart {
  userId: number;
  items: CartItem[];
  total: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price_at_time: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: string;
}
