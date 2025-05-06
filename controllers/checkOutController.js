const User = require('../models/user');
// const PhoneListing = require('../models/phoneListing');
const Transaction = require('../models/transaction');

// Get cart item and Render the checkout page
exports.getCartItem = async (req, res) => {
    try {

        const userId = req.user._id;
        const user = await User.findById(userId).populate('cart.item');
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        const cartItems = user.cart.map(cartItem => (
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

        return res.render('checkout/cart', {
            cartItems,
            user: {
                _id: user._id,
                name: `${user.firstname} ${user.lastname}`,
            },
            totalPrice,
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send(error.message);
    }
}

//TODO: Add item to cart


//TODO: Update item quantity in cart
exports.updateItemQuantity = async (req, res) => {
    try {

    } catch (error) {
        console.error(error);
        return res.status(500).send(error.message);
    }}

//TODO: Remove item from cart




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

