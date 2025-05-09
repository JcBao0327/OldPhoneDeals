const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');  // 你的 JWT 中间件

// 展示 profile 页面（GET）
router.get('/view', authMiddleware, profileController.viewProfile);

router.get('/edit', authMiddleware, profileController.showEditForm);

router.post('/edit', authMiddleware, profileController.handleEdit);

router.post('/change-password', authMiddleware, profileController.changePassword);

// 需要提前引入 profileController 和 authMiddleware
router.get('/listings', authMiddleware, profileController.getMyListings);

router.post('/listings/add', authMiddleware, profileController.addPhoneListing);

router.post('/listings/:id/toggle', authMiddleware, profileController.toggleListingStatus);

router.post('/listings/:id/delete', authMiddleware, profileController.deleteListing);

// 获取评论列表
router.get('/comments-on-my-listings', authMiddleware, profileController.getCommentsOnMyListings);

// 切换隐藏/显示
router.post('/comments/:phoneId/:index/toggle', authMiddleware, profileController.toggleCommentHiddenStatus);

module.exports = router;