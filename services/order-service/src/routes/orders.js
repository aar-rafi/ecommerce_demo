const express = require('express');
const router = express.Router();
const Joi = require('joi');
const axios = require('axios');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:5002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';

const createOrderSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  shippingAddress: Joi.string().min(10).required()
});

// Create order from cart
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId, shippingAddress } = value;

    // Get cart from cart service
    const cartResponse = await axios.get(
      `${CART_SERVICE_URL}/api/cart?userId=${userId}`,
      { timeout: 5000 }
    );

    const cart = cartResponse.data;

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, cart.total, 'pending', shippingAddress]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of cart.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.productId,
          item.product.name,
          item.quantity,
          item.product.price,
          item.subtotal
        ]
      );
    }

    await client.query('COMMIT');

    // Clear cart (fire and forget)
    axios.delete(`${CART_SERVICE_URL}/api/cart?userId=${userId}`)
      .catch(err => logger.error('Failed to clear cart:', err.message));

    // Send notification (fire and forget)
    axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/order-created`, {
      userId,
      orderId: order.id,
      total: order.total_amount
    }).catch(err => logger.error('Failed to send notification:', err.message));

    logger.info(`Order created: ${order.id} for user ${userId}`);

    res.status(201).json({
      order: {
        id: order.id,
        userId: order.user_id,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        shippingAddress: order.shipping_address,
        createdAt: order.created_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Get user orders
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ orders: result.rows });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// Get order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );

    res.json({
      order: {
        id: order.id,
        userId: order.user_id,
        totalAmount: parseFloat(order.total_amount),
        status: order.status,
        shippingAddress: order.shipping_address,
        createdAt: order.created_at,
        items: itemsResult.rows.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal)
        }))
      }
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    logger.info(`Order ${orderId} status updated to ${status}`);
    res.json({ order: result.rows[0] });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
