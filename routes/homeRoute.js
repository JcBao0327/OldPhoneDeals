// routes/homeRoute.js
const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');
const verifyLogin  = require('../middleware/checkLoginMiddleware');

router.get('/',phoneController.renderHomePage);

router.get('/loginstatus', verifyLogin, (req, res) => {
    if (req.user) {
      return res.json({ loggedIn: true, userId: req.user._id });
    }
    res.json({ loggedIn: false });
});

module.exports = router;