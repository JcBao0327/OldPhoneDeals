const express = require('express');
const router = express.Router();
const checkOutController = require('../controllers/checkOutController');
const verifyToken = require('../middleware/authMiddleware');

// View current cart
router.get('/cart', verifyToken, checkOutController.getCartItem);
// Update item quantity
router.put('/update', verifyToken, checkOutController.updateItemQuantity);
// Remove item from cart
router.delete('/remove', verifyToken, checkOutController.removeItemFromCart);
// Create transaction
router.post('/transaction', verifyToken, checkOutController.createTransaction);

module.exports = router;