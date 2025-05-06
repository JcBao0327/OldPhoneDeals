const mongoose = require('mongoose');
const User = require('./user');
const PhoneListing = require('./phoneListing');

const transactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhoneListing',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method: Create a new transaction from a user's cart
transactionSchema.statics.createTransaction = async function(buyerId, session) {

  const user = await User.findById(buyerId).session(session).populate('cart.item');

  if (!user) {
    return { success: false, reason: 'User not found' };
  }

  const updatedItems = [];
  let totalAmount = 0;

  for (const cartItem of user.cart) {
    const phone = await PhoneListing.findById(cartItem.item._id).session(session);

    if (!phone) {
      return { success: false, reason: `Phone listing ${cartItem.item._id} not found` };
    }

    if (phone.disabled || phone.stock === 0) {
      return { success: false, reason: `Phone ${phone.title} is unavailable or out of stock` };
    }

    if (phone.stock < cartItem.quantity) {
      return { success: false, reason: `Not enough stock for ${phone.title}` };
    }

    // Prepare transaction item
    updatedItems.push({
      item: phone._id,
      quantity: cartItem.quantity,
      price: phone.price
    });

    totalAmount += phone.price * cartItem.quantity;

    // Decrease stock
    phone.stock -= cartItem.quantity;
    await phone.save({ session });
  }

  // Clear user cart
  user.cart = [];
  await user.save({ session });

  // Create transaction
  const transaction = await this.create([{
    buyer: buyerId,
    items: updatedItems,
    totalAmount
  }], { session });

  return { success: true, transaction: transaction[0] };
};


// Admin: Get all transactions
transactionSchema.statics.getAllTransactions = async function () {
    return this.find()
    .populate('buyer', 'firstname lastname email')
    .populate('items.item', 'title price')
    .sort({ createdAt: -1 });
};

const Transaction = mongoose.model('Transaction', transactionSchema, 'transactionList');

module.exports = Transaction;
