const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');

router.post('/cart/mock-add', async (req, res) => {
  const { userId, itemId, quantity } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    const result = await user.addToCart(itemId, quantity, session);

    const updatedUser = await User.findById(userId).session(session).populate('cart.item');
    const cartItems = updatedUser.cart.filter(c => c.isAvailable);

    await session.commitTransaction();
    session.endSession();

    return res.json({ success: true, result, cartItems });

});

module.exports = router;
