const express = require('express');
const router = express.Router();
const Joi = require('joi');
const axios = require('axios');
const { redisClient } = require('../config/redis');
const { logger } = require('../utils/logger');

const CART_TTL = 7 * 24 * 60 * 60; // 7 days
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001';

// Validation schemas
const addItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().default(1)
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required()
});

// Helper functions
const getCartKey = (userId) => `cart:${userId}`;

const fetchProductDetails = async (productId) => {
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch product ${productId}:`, error.message);
    return null;
  }
};

const getCartWithDetails = async (userId) => {
  const redis = redisClient();
  const cartKey = getCartKey(userId);
  const cartData = await redis.hGetAll(cartKey);

  const items = [];
  for (const [productId, quantity] of Object.entries(cartData)) {
    const product = await fetchProductDetails(productId);
    if (product) {
      items.push({
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url
        },
        subtotal: product.price * parseInt(quantity)
      });
    }
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return { items, total, itemCount: items.length };
};

// Middleware to extract user ID (simplified - should use auth token)
const extractUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.query.userId || '1';
  req.userId = userId;
  next();
};

router.use(extractUserId);

// Get cart
router.get('/', async (req, res) => {
  try {
    const cart = await getCartWithDetails(req.userId);
    res.json(cart);
  } catch (error) {
    logger.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

// Add item to cart
router.post('/items', async (req, res) => {
  try {
    const { error, value } = addItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { productId, quantity } = value;

    // Verify product exists
    const product = await fetchProductDetails(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.is_active) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const redis = redisClient();
    const cartKey = getCartKey(req.userId);

    // Get current quantity
    const currentQty = await redis.hGet(cartKey, productId.toString());
    const newQty = (parseInt(currentQty) || 0) + quantity;

    // Update cart
    await redis.hSet(cartKey, productId.toString(), newQty.toString());
    await redis.expire(cartKey, CART_TTL);

    logger.info(`Added ${quantity} of product ${productId} to cart for user ${req.userId}`);

    const cart = await getCartWithDetails(req.userId);
    res.status(201).json(cart);
  } catch (error) {
    logger.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item
router.put('/items/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const { error, value } = updateItemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { quantity } = value;
    const redis = redisClient();
    const cartKey = getCartKey(req.userId);

    if (quantity === 0) {
      // Remove item
      await redis.hDel(cartKey, productId);
      logger.info(`Removed product ${productId} from cart for user ${req.userId}`);
    } else {
      // Verify product and stock
      const product = await fetchProductDetails(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (product.stock_quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      // Update quantity
      await redis.hSet(cartKey, productId, quantity.toString());
      await redis.expire(cartKey, CART_TTL);
      logger.info(`Updated product ${productId} quantity to ${quantity} for user ${req.userId}`);
    }

    const cart = await getCartWithDetails(req.userId);
    res.json(cart);
  } catch (error) {
    logger.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete('/items/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const redis = redisClient();
    const cartKey = getCartKey(req.userId);

    await redis.hDel(cartKey, productId);
    logger.info(`Removed product ${productId} from cart for user ${req.userId}`);

    const cart = await getCartWithDetails(req.userId);
    res.json(cart);
  } catch (error) {
    logger.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/', async (req, res) => {
  try {
    const redis = redisClient();
    const cartKey = getCartKey(req.userId);

    await redis.del(cartKey);
    logger.info(`Cleared cart for user ${req.userId}`);

    res.json({ items: [], total: 0, itemCount: 0 });
  } catch (error) {
    logger.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
