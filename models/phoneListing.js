// models/PhoneListing.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  hidden: { type: Boolean, default: false }
}, { _id: false });

const phoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  brand: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  disabled: { type: Boolean, default: false },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviews: { type: [reviewSchema], default: [] }
}, { timestamps: true });

/**
 * Get top 5 best sellers (returns full PhoneListing instances)
 */
phoneSchema.statics.getBestSellers = async function () {
  // Step 1: find non-disabled phones
  const phones = await this.find({ disabled: false });

  // Step 2: filter phones with >=2 reviews
  const filtered = phones.filter(phone => phone.reviews.length >= 2);

  // Step 3: sort by average rating descending
  filtered.sort((a, b) => {
    const avgA = a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length;
    const avgB = b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length;
    return avgB - avgA;
  });

  // Step 4: return top 5
  return filtered.slice(0, 5);
};

/**
 * Get top 5 sold out soon (returns full PhoneListing instances)
 */
phoneSchema.statics.getSoldOutSoon = async function () {
  return await this.find({
    disabled: false,
    stock: { $gt: 0 }
  }).sort({ stock: 1 }).limit(5);
};

/**
 * Search phones by keyword (returns full PhoneListing instances)
 */
phoneSchema.statics.searchPhones = async function (keyword) {
  const regex = new RegExp(keyword, 'i');
  return await this.find({
    title: { $regex: regex }
  });
};


module.exports = mongoose.model('PhoneListing', phoneSchema);
