const User = require('../models/user');
// const PhoneListing = require('../models/phoneListing');
const Transaction = require('../models/transaction');

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
        const cartItems = user.cart.filter(c => c.isAvailable).map(cartItem => (
            {
                _id: cartItem.item._id,
                image: cartItem.item.image,
                title: cartItem.item.title,
                brand: cartItem.item.brand,
                price: cartItem.item.price,
                quantity: cartItem.quantity,
            }
        ));

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
    if (!itemId || quantity === null || quantity < 0 || IsInteger(quantity) === false || isNaN(quantity)) {
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

    const result = await Transaction.createTransaction(req.user._id, session);
    if (!result.success) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).send(result.reason);
    }

    await session.commitTransaction();

    session.endSession();
    return res.status(200).send({
        message: 'Transaction successful',
        transaction: result.transaction,
    });
};

