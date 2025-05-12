const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');  // 你的 JWT 中间件

router.get('/view', authMiddleware, profileController.viewProfile);

router.get('/edit', authMiddleware, profileController.showEditForm);

router.post('/edit', authMiddleware, profileController.handleEdit);

router.post('/change-password', authMiddleware, profileController.changePassword);

router.get('/listings', authMiddleware, profileController.getMyListings);

router.post('/listings/add', authMiddleware, profileController.addPhoneListing);

router.post('/listings/:id/toggle', authMiddleware, profileController.toggleListingStatus);

router.post('/listings/:id/delete', authMiddleware, profileController.deleteListing);

router.get('/comments-on-my-listings', authMiddleware, profileController.getCommentsOnMyListings);

router.post('/comments/:phoneId/:index/toggle', authMiddleware, profileController.toggleCommentHiddenStatus);

module.exports = router;