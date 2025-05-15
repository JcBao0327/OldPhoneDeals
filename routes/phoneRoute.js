const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const verifyToken = require('../middleware/authMiddleware');

// inside phoneRoute.js
router.get('/bestsellers', phoneController.fetchBestSellerPhones);
router.get('/soldoutsoon', phoneController.fetchSoonSoldOutPhones);
router.get('/search', phoneController.searchPhones);
router.get('/:phoneId', verifyToken, phoneController.viewItemDetail);
router.get('/:phoneId/cart', verifyToken, phoneController.getCartQuantityFromDetail);
router.get('/:phoneId/wishlist', verifyToken, phoneController.getWishListStatusFromDetail);
router.post('/:phoneId/wishlist',verifyToken, phoneController.modifyWishlistFromDetail);

module.exports = router;