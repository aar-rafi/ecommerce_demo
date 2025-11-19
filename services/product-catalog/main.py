from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
import uvicorn
import logging
from datetime import datetime

from database import engine, Base, get_db
from models import Product, ProductCreate, ProductUpdate, ProductResponse
from metrics import setup_metrics, metrics_middleware
import crud

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Product Catalog Service")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    # Shutdown
    logger.info("Shutting down Product Catalog Service")
    await engine.dispose()

app = FastAPI(
    title="Product Catalog Service",
    description="Microservice for managing product catalog",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics
setup_metrics(app)
app.middleware("http")(metrics_middleware)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "product-catalog",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/ready")
async def readiness_check(db = Depends(get_db)):
    try:
        # Check database connection
        await db.execute("SELECT 1")
        return {
            "status": "ready",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service not ready")

# Product endpoints
@app.get("/api/products", response_model=List[ProductResponse])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    db = Depends(get_db)
):
    """List all products with optional filtering"""
    try:
        products = await crud.get_products(
            db,
            skip=skip,
            limit=limit,
            category=category,
            search=search
        )
        return products
    except Exception as e:
        logger.error(f"Error listing products: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db = Depends(get_db)):
    """Get a specific product by ID"""
    product = await crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, db = Depends(get_db)):
    """Create a new product (admin only)"""
    try:
        new_product = await crud.create_product(db, product)
        logger.info(f"Product created: {new_product.id} - {new_product.name}")
        return new_product
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create product")

@app.put("/api/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db = Depends(get_db)
):
    """Update a product (admin only)"""
    updated_product = await crud.update_product(db, product_id, product)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found")
    logger.info(f"Product updated: {product_id}")
    return updated_product

@app.delete("/api/products/{product_id}", status_code=204)
async def delete_product(product_id: int, db = Depends(get_db)):
    """Delete a product (admin only)"""
    success = await crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    logger.info(f"Product deleted: {product_id}")
    return None

@app.get("/api/products/category/{category}", response_model=List[ProductResponse])
async def get_products_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db = Depends(get_db)
):
    """Get products by category"""
    products = await crud.get_products(db, skip=skip, limit=limit, category=category)
    return products

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
        log_level="info"
    )
