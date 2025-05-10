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
    // Match phones where disabled is false or missing AND at least 2 reviews
    {
      $match: {
        $or: [
          { disabled: false },
          { disabled: { $exists: false } }
        ],
        "reviews.1": { $exists: true }  // at least 2 reviews (index 1 exists)
      }
    },
    // Flatten reviews array to process each review separately
    { $unwind: "$reviews" },
    // Group by phone ID to calculate average rating per phone
    {
      $group: {
        _id: "$_id",
        avgRating: { $avg: "$reviews.rating" },  // calculate average rating
        phoneDocument: { $first: "$$ROOT" }      // keep original phone doc
      }
    },
    // Sort phones by highest average rating
    { $sort: { avgRating: -1 } },
    // Limit to top 5 best-rated phones
    { $limit: 5 },
    // Return the original phone documents (not the aggregation result shape)
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
    $or: [
      { disabled: false },
      { disabled: { $exists: false } }
    ],
    $or: [
      { title: { $regex: regex } }
    ]
  });
};


module.exports = mongoose.model('PhoneListing', phoneSchema);
