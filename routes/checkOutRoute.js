const express = require('express');
const router = express.Router();
const checkOutController = require('../controllers/checkOutController');

// Render checkout page
router.get('/', checkOutController.renderCheckOutPage);

// Add item to cart
router.post('/add', checkOutController.addItemToCart);
// Remove item from cart
router.post('/remove/:id', checkOutController.removeItemFromCart);


router.post('/transaction', checkOutController.createTransaction);

module.exports = router;