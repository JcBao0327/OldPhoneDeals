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
  return await this.aggregate([
    {
      $match: {
        $or: [
          { disabled: false },
          { disabled: { $exists: false } }
        ],
        "reviews.1": { $exists: true },  // at least 2 reviews
        stock: { $gt: 0 }                // stock greater than 0
      }
    },
    { $unwind: "$reviews" },
    {
      $group: {
        _id: "$_id",
        avgRating: { $avg: "$reviews.rating" },
        phoneDocument: { $first: "$$ROOT" }
      }
    },
    { $sort: { avgRating: -1 } },
    { $limit: 5 },
    { $replaceRoot: { newRoot: "$phoneDocument" } }
  ]);
};



/**
 * Get top 5 sold out soon (returns full PhoneListing instances)
 */
phoneSchema.statics.getSoldOutSoon = async function () {
  return await this.find({
    $or: [
      { disabled: false },
      { disabled: { $exists: false } }
    ],
    stock: { $gt: 0 }
  })
  .sort({ stock: 1 })
  .limit(5);
};

/**
 * Search phones by keyword (returns full PhoneListing instances)
 */
phoneSchema.statics.searchPhones = async function (keyword) {
  const regex = new RegExp(keyword, 'i');
  return await this.find({
    $and: [
      {
        $or: [
          { disabled: false },
          { disabled: { $exists: false } }
        ]
      },
      { stock: { $gt: 0 } },
      { title: { $regex: regex } }
    ]
  });
};



module.exports = mongoose.model('PhoneListing', phoneSchema);
