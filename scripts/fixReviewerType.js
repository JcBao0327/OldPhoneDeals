const mongoose = require('mongoose');
const path = require('path');
const YAML = require('yamljs');

const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

(async () => {
  try {
    await mongoose.connect(config.app.mongoUri);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.db.collection('phonelistings');

    // Find listings with string-typed reviewers
    const listingsWithStringReviewers = await collection.find({
      'reviews.reviewer': { $type: 'string' }
    }).toArray();

    if (listingsWithStringReviewers.length === 0) {
      console.log('No reviewer fields need to be fixed.');
      return process.exit(0);
    }

    console.log(` Found ${listingsWithStringReviewers.length} listings to fix reviewers.`);

    for (const listing of listingsWithStringReviewers) {
      let modified = false;

      const updatedReviews = (listing.reviews || []).map(review => {
        if (review && typeof review.reviewer === 'string') {
          modified = true;
          return {
            ...review,
            reviewer: new mongoose.Types.ObjectId(review.reviewer)
          };
        }
        return review;
      });

      if (modified) {
        await collection.updateOne(
          { _id: listing._id },
          { $set: { reviews: updatedReviews } }
        );
        console.log(` Fixed reviewers in listing ${listing._id}`);
      }
    }

    console.log(' Reviewer type fixing complete.');
    process.exit(0);

  } catch (err) {
    console.error(' Error fixing reviewers:', err);
    process.exit(1);
  }
})();