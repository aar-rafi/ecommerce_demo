import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Our Store</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Discover amazing products at great prices
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/products">Shop Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
        <ProductGrid />
      </section>
    </div>
  );
}
