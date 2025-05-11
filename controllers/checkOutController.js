const mongoose = require('mongoose');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const path = require('path');
const YAML = require('yamljs');
const nodemailer = require('nodemailer');

// Load YAML config
const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

// Get cart item and Render the checkout page
exports.getCartItem = async (req, res) => {

        const userId = req.user._id;
        const user = await User.findById(userId).populate('cart.item');
        if (!user) {
            return res.status(404).send('User not found');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        await user.refreshCartAvailability(session);
        await user.populate('cart.item');
        const cartItems = user.cart.map(cartItem => (
            {
                _id: cartItem.item._id,
                image: cartItem.item.image,
                title: cartItem.item.title,
                brand: cartItem.item.brand,
                price: cartItem.item.price,
                quantity: cartItem.quantity,
                stock: cartItem.item.stock,
                isAvailable: cartItem.isAvailable,
            }
        ));
    
    const unavailableItems = user.cart
    .filter(c => !c.isAvailable || (c.item.stock < c.quantity))
    .map(cartItem => ({
        _id: cartItem.item._id,
        title: cartItem.item.title,
        reason: !cartItem.isAvailable ? 'Unavailable' : `Only ${cartItem.item.stock} left`,
    }));


    // Accept selected item IDs from query if passed (e.g., ?selected=ID1,ID2)
    const selectedIds = req.query.selected ? req.query.selected.split(',') : [];

    const totalPrice = user.cart
    .filter(c =>
        c.isAvailable &&
        (selectedIds.length === 0 || selectedIds.includes(c.item._id.toString()))
    )
    .reduce((sum, c) => sum + c.item.price * c.quantity, 0);


    await session.commitTransaction();
        session.endSession();
        return res.render('checkout/cart', {
            cartItems,
            unavailableItems,
            user: {
                _id: user._id,
                name: `${user.firstname} ${user.lastname}`,
            },
            totalPrice,
        })
}


// Update item quantity in cart
exports.updateItemQuantity = async (req, res) => {
    const { itemId, quantity } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!itemId || quantity < 0 || Number.isInteger(quantity) === false || isNaN(quantity)) {
        return res.status(400).json({ error: 'Invalid item ID or quantity' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

        const user = await User.findById(userId).session(session);
            if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'User not found' });
        }

    if (quantity === 0) {
      // Remove item from cart
        await user.removeFromCart(itemId, session);
        await session.commitTransaction();
        return res.status(200).json({ message: 'Item removed from cart' });
    }

    // Step 1: Validate stock and availability
    const isValid = await user.validateSingleCartItem(itemId, quantity, session);
    if (!isValid) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'Item is unavailable or exceeds stock' });
    }

    // Step 2: Update cart using schema method
    const result = await user.addToCart(itemId, quantity, session);
    if (!result.success) {
        await session.abortTransaction();
        return res.status(400).json({ error: result.reason });
    }

    await session.commitTransaction();
    return res.status(200).json({ message: 'Cart item updated successfully' });

    session.endSession();
};


// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
    const { itemId } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!itemId) {
        return res.status(400).json({ error: 'Invalid item ID' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

        const user = await User.findById(userId).session(session);
            if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'User not found' });
        }

    // Remove item from cart using schema method
    await user.removeFromCart(itemId, session);

    await session.commitTransaction();
    return res.status(200).json({ message: 'Item removed from cart successfully' });

    session.endSession();
};


// Create Transaction
exports.createTransaction = async (req, res) => {
    const session = await Transaction.startSession();
    session.startTransaction();

    const { selectedItemIds } = req.body;

    let result;
    if (Array.isArray(selectedItemIds) && selectedItemIds.length > 0) {
      // Partial checkout
        result = await Transaction.createTransactionFromSelected(req.user._id, selectedItemIds, session);
    } else {
      // Full cart checkout
        result = await Transaction.createTransaction(req.user._id, session);
    }

    if (!result.success) {
        await session.abortTransaction();
        return res.status(400).json({ message: result.reason });
    }

    await session.commitTransaction();

    // Notify Admin with email for new transaction
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
                user: config.email.user, // e.g. 'youremail@gmail.com'
                pass: config.email.pass  // Gmail App Password
            }
        });

        await result.transaction.populate('items.item', 'title');
    
        await transporter.sendMail({
            from: config.email.user,
            to: config.email.user,
            subject: `New Transaction Placed - OldPhoneDeals`,
            html: `
                    A new transaction has been completed by ${req.user.firstname} ${req.user.lastname} (${req.user.email}).</p>
                    <p><strong>Total Amount:</strong> $${result.transaction.totalAmount.toFixed(2)}</p>
                    <p><strong>Items Purchased:</strong></p>
                    <ul>
                        ${result.transaction.items.map(item => `
                            <li>${item.quantity} × ${item.item.title} @ $${item.price}</li>
                        `).join('')}
                    </ul>
                    <p><strong>Transaction Date:</strong> ${new Date(result.transaction.createdAt).toLocaleString()}</p>
                `
        });

        return res.status(200).json({
            message: 'Transaction successful',
            transaction: result.transaction
        });
};
