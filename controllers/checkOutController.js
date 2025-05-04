const Transaction = require('../models/transaction');

exports.renderCheckOutPage = async (req, res) => {
    const userId = req.user?.id || '6453f2c5e1b2a3d4f56789ab'; // fallback mock user
    try {
        const cartItems = await Transaction.getCartItems(userId);
        const totalPrice = await Transaction.calculateTotalAmount(userId);
        res.render('checkoutPage/cart', {
            cartItems,
            totalPrice,
            user: { name: 'Test User' } // mock name
        });
    } catch (err) {
        console.error('Render error:', err);
        res.status(500).send('Failed to render checkout page');
    }
}

exports.addItemToCart = async (req, res) => {
    const userId = req.body.buyer || '6453f2c5e1b2a3d4f56789ab';
    const item = req.body.item;

    if (!item || !item.title || !item.price || !item.quantity) {
        return res.status(400).json({ error: 'Incomplete item data' });
    }

    try {
        const updatedCart = await Transaction.addItemToCart(userId, item);
        res.status(200).json(updatedCart);
    } catch (err) {
        console.error('Add item error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.removeItemFromCart = async (req, res) => {
    const userId = req.body.buyer || '6453f2c5e1b2a3d4f56789ab';
    const itemId = req.params.itemId;

    try {
        await Transaction.removeItemFromCart(userId, itemId);
        res.redirect('/checkout');
    } catch (err) {
        console.error('Remove item error:', err);
        res.status(500).json({ error: err.message });
    }
};


exports.createTransaction = async (req, res) => {
    try {
        const userId = req.body.buyer || '6453f2c5e1b2a3d4f56789ab'; // temp

        const transaction = await Transaction.finalizeCart(userId);

        res.status(201).json(transaction);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
};

