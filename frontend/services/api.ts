import axios, { AxiosError } from 'axios';
import type { AuthResponse, Product, Cart, Order, ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/api/auth/logout', { refresh_token: refreshToken });
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/api/products');
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/api/products?category=${category}`);
    return response.data;
  },

  search: async (query: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/api/products/search?q=${query}`);
    return response.data;
  },
};

// Cart API
export const cartApi = {
  get: async (): Promise<Cart> => {
    const response = await api.get<Cart>('/api/cart');
    return response.data;
  },

  addItem: async (productId: number, quantity: number = 1): Promise<Cart> => {
    const response = await api.post<Cart>('/api/cart/items', {
      productId,
      quantity,
    });
    return response.data;
  },

  updateItem: async (productId: number, quantity: number): Promise<Cart> => {
    const response = await api.put<Cart>(`/api/cart/items/${productId}`, {
      quantity,
    });
    return response.data;
  },

  removeItem: async (productId: number): Promise<Cart> => {
    const response = await api.delete<Cart>(`/api/cart/items/${productId}`);
    return response.data;
  },

  clear: async (): Promise<void> => {
    await api.delete('/api/cart');
  },
};

// Orders API
export const ordersApi = {
  create: async (data: { shippingAddress: string }): Promise<Order> => {
    const response = await api.post<Order>('/api/orders', data);
    return response.data;
  },

  getAll: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/api/orders');
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`/api/orders/${id}`);
    return response.data;
  },
};

export default api;
