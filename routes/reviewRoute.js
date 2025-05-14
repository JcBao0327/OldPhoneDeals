const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const verifyToken = require('../middleware/authMiddleware')

// GET → load reviews for specific phone listing
router.get('/phone/:phoneId', reviewController.loadReviews);

// POST → submit new review
router.post('/post', verifyToken, reviewController.postReview);

module.exports = router;