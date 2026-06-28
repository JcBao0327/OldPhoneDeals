const mongoose = require('mongoose');
const PhoneListing = require('./phoneListing');
const bcrypt = require('bcrypt');

// --- Sub-schema for Cart Items ---
const cartItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhoneListing',
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// --- Sub-schema for Wishlist Items (NO quantity) ---
const wishlistItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhoneListing',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// --- Main User Schema ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  lastLoginDate: { type: Date, default: null },
  isDisabled: { type: Boolean, default: false },
  verificationToken: { type: String, index: true, default: null},
  resetPasswordToken: { type: String, index: true, default: null},
  cart: [cartItemSchema],
  wishlist: [wishlistItemSchema]
}, { timestamps: true });

// --- Cart Methods ---
// 01 Add/Update Cart Item
/**
 * Add or update a cart item with quantity validation.
 * Reject if listing is invalid or quantity exceeds stock.
 */
userSchema.methods.addToCart = async function(itemId, quantity, session) {

  const listing = await PhoneListing.findById(itemId).session(session);

  if (!listing || listing.disabled || listing.stock === 0) {
    return { success: false, reason: 'Item is not available' };
  }

  if (quantity > listing.stock) {
    return { success: false, reason: `Requested quantity exceeds stock (${listing.stock})` };
  }

  const existing = this.cart.find(c => c.item.toString() === itemId.toString());

  if (existing) {
    await mongoose.model('User').updateOne(
      { _id: this._id, 'cart.item': itemId },
      { $set: { 'cart.$.quantity': quantity, 'cart.$.isAvailable': true } },
      { session }
    );
  } else {
    await mongoose.model('User').updateOne(
      { _id: this._id },
      { $push: { cart: { item: itemId, quantity, isAvailable: true } } },
      { session }
    );
  }

  return { success: true };
};

// 02 Remove Cart Item by ID
  /**
   * Remove an item from the cart by item ID.
   */
  userSchema.methods.removeFromCart = async function(itemId, session) {
    await mongoose.model('User').updateOne(
      { _id: this._id },
      { $pull: { cart: { item: itemId } } },
      { session }
    );
  };


// 03 Validate Cart Items
/**
 * Validate all items in the user's cart before checkout.
 * Returns 01 - valid items, 02 - insufficient stock items, and 03 - invalid items to disable.
 */
userSchema.methods.validateCartItems = async function(session) {

  const validItems = [];
  const insufficientStockItems = [];
  const invalidItemsToDisable = [];
  let totalAmount = 0;

  for (const cartEntry of this.cart) {
    const listing = await PhoneListing.findById(cartEntry.item).session(session);

    if (!listing || listing.disabled || listing.stock === 0) {
      invalidItemsToDisable.push(cartEntry.item);
    } else if (listing.stock < cartEntry.quantity) {
      insufficientStockItems.push(cartEntry.item);
    } else {
      validItems.push({
        title: listing.title,
        price: listing.price,
        quantity: cartEntry.quantity,
        _id: listing._id
      });
      totalAmount += listing.price * cartEntry.quantity;
    }
  }

  return {
    validItems,
    insufficientStockItems,
    invalidItemsToDisable,
    totalAmount
  };
};


// 04 Mark Unavailable Cart Items
/**
 * Mark the given item IDs as unavailable in the user's cart.
 */
userSchema.methods.markUnavailableInCart = async function(itemIds, session) {
  for (const itemId of itemIds) {
    await mongoose.model('User').updateOne(
      { _id: this._id, 'cart.item': itemId },
      { $set: { 'cart.$.isAvailable': false } },
      { session }
    );
  }
};


// 05 Validate Single Cart Item
/**
 * Validate a single item in the cart when modifying quantity.
 * Returns true if valid, false otherwise.
 * Marks as unavailable only if deleted/disabled/out of stock.
 */
userSchema.methods.validateSingleCartItem = async function(itemId, quantity, session) {

  const listing = await PhoneListing.findById(itemId).session(session);

  if (!listing || listing.disabled || listing.stock === 0) {
    await mongoose.model('User').updateOne(
      { _id: this._id, 'cart.item': itemId },
      { $set: { 'cart.$.isAvailable': false } },
      { session }
    );
    return false;
  }

  if (listing.stock < quantity) {
    return false;
  }

  return true;
};


// 06 Refresh Cart Availability
/**
 * Refresh the isAvailable field for all cart items.
 * If a previously unavailable item is restocked and enabled, mark it as available.
 */
userSchema.methods.refreshCartAvailability = async function(session) {

  for (const cartEntry of this.cart) {
    const listing = await PhoneListing.findById(cartEntry.item).session(session);

    const shouldBeAvailable = listing &&
      !listing.disabled &&
      listing.stock > 0;

    await mongoose.model('User').updateOne(
      { _id: this._id, 'cart.item': cartEntry.item },
      { $set: { 'cart.$.isAvailable': !!shouldBeAvailable } },
      { session }
    );
  }
};


// --- Wishlist Methods ---
// 01 Add/Update Wishlist Item
/**
   * Add an item to the wishlist if it is available.
   * Does not check or store quantity.
   */
userSchema.methods.addToWishlist = async function(itemId, session) {

  const listing = await PhoneListing.findById(itemId).session(session);

  if (!listing || listing.disabled || listing.stock === 0) {
    return { success: false, reason: 'Item is not available' };
  }

  const exists = this.wishlist.some(w => w.item.toString() === itemId.toString());
  if (exists) return { success: true };

  await mongoose.model('User').updateOne(
    { _id: this._id },
    { $push: { wishlist: { item: itemId, isAvailable: true } } },
    { session }
  );

  return { success: true };
};

// 02 Remove Wishlist Item
  /**
   * Remove an item from the wishlist by item ID.
   */
  userSchema.methods.removeFromWishlist = async function(itemId, session) {
    await mongoose.model('User').updateOne(
      { _id: this._id },
      { $pull: { wishlist: { item: itemId } } },
      { session }
    );
  };


// 03 Mark Unavailable Wishlist Items
/**
 * Mark the given item IDs as unavailable in the user's wishlist.
 */
userSchema.methods.markUnavailableInWishlist = async function(itemIds, session) {
  for (const itemId of itemIds) {
    await mongoose.model('User').updateOne(
      { _id: this._id, 'wishlist.item': itemId },
      { $set: { 'wishlist.$.isAvailable': false } },
      { session }
    );
  }
};

// 04 Validate a single Wishlist Item
  /**
   * Validate a single wishlist item from item detail page.
   * If deleted, disabled, or out of stock, mark it as unavailable.
   * Returns true if item is valid; false otherwise.
   */
userSchema.methods.validateSingleWishlistItem = async function(itemId, session) {

    const listing = await PhoneListing.findById(itemId).session(session);
  
    const isInvalid = !listing || listing.disabled || listing.stock === 0;
  
    if (isInvalid) {
      await mongoose.model('User').updateOne(
        { _id: this._id, 'wishlist.item': itemId },
        { $set: { 'wishlist.$.isAvailable': false } },
        { session }
      );
      return false;
    }
  
    return true;
  };


// 05 Refresh Wishlist Items Availability
/**
 * Refresh the isAvailable field for all wishlist items.
 * Called when loading the wishlist page.
 */
userSchema.methods.refreshWishlistAvailability = async function(session) {

  for (const wishlistEntry of this.wishlist) {
    const listing = await PhoneListing.findById(wishlistEntry.item).session(session);

    const shouldBeAvailable = listing &&
      !listing.disabled &&
      listing.stock > 0;

    await mongoose.model('User').updateOne(
      { _id: this._id, 'wishlist.item': wishlistEntry.item },
      { $set: { 'wishlist.$.isAvailable': !!shouldBeAvailable } },
      { session }
    );
  }
};

// --- User Methods ---
/**
 * NOTE: Before calling this method, make sure all input values are properly validated and preprocessed
 */
// 01 create new account
userSchema.statics.createUserDirect = async function ({ email, password, firstname, lastname, verificationToken}) {
  const user = new this({
    email,
    password,
    firstname,
    lastname,
    isVerified: false,
    lastLoginDate: null,
    verificationToken,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    cart: [],
    wishlist: []
  });

  return await user.save();
};

// 02 update an existing account
userSchema.statics.updateUserDirect = async function ({ userId, updateFields }) {
  return await this.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true }
  );
};

// 03 delete an existing account
userSchema.statics.deleteUserDirect = async function ({ userId}) {
  return await this.findByIdAndDelete(userId);
};

// 04 search an account by verificationToken
userSchema.statics.findByVerificationToken = function (token) {
  return this.findOne({ verificationToken: token });
};

// 05 search an account by resetPasswordToken
userSchema.statics.findByresetPasswordToken = function (token) {
  return this.findOne({ resetPasswordToken: token });
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
