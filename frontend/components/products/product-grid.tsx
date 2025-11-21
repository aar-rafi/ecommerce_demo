'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import { ProductCard } from './product-card';
import { Loader2 } from 'lucide-react';

export function ProductGrid() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive min-h-[400px] flex items-center justify-center">
        <p>Failed to load products. Please try again later.</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center text-muted-foreground min-h-[400px] flex items-center justify-center">
        <p>No products available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
