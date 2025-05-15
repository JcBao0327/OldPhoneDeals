const PhoneListing = require('../models/phoneListing');
const mongoose = require('mongoose');
const User = require('../models/User');


exports.loadReviews = async (req, res) => {
  try {
    const phoneIdParam = req.params.phoneId;

    //  Validate phone ID format
    if (!mongoose.Types.ObjectId.isValid(phoneIdParam)) {
      return res.status(400).json({ error: 'Invalid phone ID.' });
    }

    //  Fetch phone listing (no populate — reviews are embedded)
    const phoneListing = await PhoneListing.findById(phoneIdParam).lean();
    if (!phoneListing) {
      return res.status(404).json({ error: 'Phone listing not found.' });
    }

    const reviews = phoneListing.reviews || [];

    //  Extract unique reviewer ObjectIds as strings
    const reviewerIds = [
      ...new Set(reviews.map(r => r.reviewer?.toString()).filter(Boolean))
    ];

    //  Fetch reviewer user data
    const users = await User.find(
      { _id: { $in: reviewerIds } },
      '_id firstname lastname'
    ).lean();

    //  Build a lookup map for reviewerId → name
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = `${user.firstname} ${user.lastname}`;
    });

    //  Format review response with reviewerId and name
    const reviewsResponse = reviews.map((review, index) => ({
      index, // optional: can help track for debugging or frontend keys
      reviewerId: review.reviewer?.toString() || null,
      reviewerName: userMap[review.reviewer?.toString()] || 'Unknown Reviewer',
      rating: review.rating,
      comment: review.comment || '',
      hidden: review.hidden || false
    }));

    return res.json({ reviews: reviewsResponse });

  } catch (error) {
    console.error('Error in loadReviews:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.postReview = async (req, res) => {
  try {
    const { phoneId, rating, comment, hidden } = req.body;
    const userId = req.user?._id;

    //  Basic validation
    if (!userId || !mongoose.Types.ObjectId.isValid(phoneId)) {
      return res.status(400).json({ error: 'Invalid request.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment is required.' });
    }

    //  Fetch the phone listing
    const phoneListing = await PhoneListing.findById(phoneId);
    if (!phoneListing) {
      return res.status(404).json({ error: 'Phone listing not found.' });
    }

    //  Add the review (no duplicate check)
    phoneListing.reviews.push({
      reviewer: userId,
      rating,
      comment: comment.trim(),
      hidden: hidden
    });

    await phoneListing.save();

    return res.json({ success: true, message: 'Review submitted successfully.' });

  } catch (error) {
    console.error('Error posting review:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};