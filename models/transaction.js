const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    buyer:  { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    items: [
        {
            title: String,
            price: Number,
            quantity: Number
        }
    ],
    totalAmount: Number,
    isFinalized: {
        type: Boolean,
        default: false // Indicates whether this is a finalized transaction or a cart
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add an item to the cart
transactionSchema.statics.addItemToCart = async function(userId, item) {
    let cart = await this.findOne({ buyer: userId, isFinalized: false });
    if (!cart) {
        cart = await this.create({ buyer: userId, items: [], totalAmount: 0, isFinalized: false });
    }
    const existingItem = cart.items.find(cartItem => cartItem.title === item.title);
    if (existingItem) {
        existingItem.quantity += item.quantity;
    } else {
        cart.items.push(item);
    }
    await cart.save();
    return cart;
};

// Remove an item from the cart
transactionSchema.statics.removeItemFromCart = async function(userId, itemId) {
    const cart = await this.findOne({ buyer: userId, isFinalized: false });
    if (!cart) throw new Error('Cart not found');

    cart.items = cart.items.filter(item => {
        const id = item._id ?? item.id;
        return id?.toString() !== itemId.toString();
    });

    await cart.save();
    return cart;
};


// Get cart items for a user
transactionSchema.statics.getCartItems = async function(userId) {
    const cart = await this.findOne({ buyer: userId, isFinalized: false });
    return cart ? cart.items : [];
};

// Calculate total amount for the cart
transactionSchema.statics.calculateTotalAmount = async function(userId) {
    const cart = await this.findOne({ buyer: userId, isFinalized: false });
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
};

// Finalize the cart as a transaction
transactionSchema.statics.finalizeCart = async function(userId) {
    const cart = await this.findOne({ buyer: userId, isFinalized: false });
    if (!cart) throw new Error('Cart not found');
    if (!cart.isFinalized || cart.totalAmount === 0) {
        cart.totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }
    cart.isFinalized = true;
    await cart.save();
    return cart;
};

// Create a new transaction
transactionSchema.statics.addTransaction = async function(data) {
    return await this.create({
        buyer: data.buyer,
        items: data.items,
        totalAmount: data.totalAmount
    });
};

const Transaction = mongoose.model('Transaction', transactionSchema, 'transactionList');

module.exports = Transaction;

