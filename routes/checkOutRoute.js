const express = require('express');
const router = express.Router();
const checkOutController = require('../controllers/checkOutController');

// View current cart
router.get('/cart', checkOutController.getCartItem);
// Add item to cart
router.post('/add', checkOutController.addItemToCart);
// Update item quantity
router.put('/update', checkOutController.updateItemQuantity);
// Remove item from cart
router.delete('/remove', checkOutController.removeItemFromCart);
// Create transaction
router.post('/transaction', checkOutController.createTransaction);

module.exports = router;