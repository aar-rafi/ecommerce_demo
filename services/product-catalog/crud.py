from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from models import ProductDB, ProductCreate, ProductUpdate

async def get_products(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    category: Optional[str] = None,
    search: Optional[str] = None
) -> List[ProductDB]:
    """Get all products with optional filtering"""
    query = select(ProductDB)

    if category:
        query = query.where(ProductDB.category == category)

    if search:
        search_filter = or_(
            ProductDB.name.ilike(f"%{search}%"),
            ProductDB.description.ilike(f"%{search}%"),
            ProductDB.sku.ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    query = query.offset(skip).limit(limit).order_by(ProductDB.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()

async def get_product(db: AsyncSession, product_id: int) -> Optional[ProductDB]:
    """Get a single product by ID"""
    result = await db.execute(
        select(ProductDB).where(ProductDB.id == product_id)
    )
    return result.scalar_one_or_none()

async def create_product(db: AsyncSession, product: ProductCreate) -> ProductDB:
    """Create a new product"""
    db_product = ProductDB(**product.model_dump())
    db.add(db_product)
    await db.flush()
    await db.refresh(db_product)
    return db_product

async def update_product(
    db: AsyncSession,
    product_id: int,
    product: ProductUpdate
) -> Optional[ProductDB]:
    """Update an existing product"""
    db_product = await get_product(db, product_id)
    if not db_product:
        return None

    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)

    await db.flush()
    await db.refresh(db_product)
    return db_product

async def delete_product(db: AsyncSession, product_id: int) -> bool:
    """Delete a product"""
    db_product = await get_product(db, product_id)
    if not db_product:
        return False

    await db.delete(db_product)
    await db.flush()
    return True
