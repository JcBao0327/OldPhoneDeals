// Convert SellerId type: string -> ObjectId
const mongoose = require('mongoose');
const path = require('path');
const YAML = require('yamljs');

const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

(async () => {
    try {
        await mongoose.connect(config.app.mongoUri);
        console.log('✅ Connected to MongoDB');

        const collection = mongoose.connection.db.collection('phonelistings');

        // 原生查找 seller 是字符串类型的记录
        const listings = await collection.find({ seller: { $type: 'string' } }).toArray();

        if (listings.length === 0) {
            console.log('✅ No listings need to be fixed.');
            return process.exit(0);
        }

        console.log(`🔄 Found ${listings.length} listings to fix.`);

        for (const listing of listings) {
            const oldSeller = listing.seller;
            const newSeller = new mongoose.Types.ObjectId(oldSeller);  // ✅ 使用 new

            await collection.updateOne(
                { _id: listing._id },
                { $set: { seller: newSeller } }
            );

            console.log(`✅ Fixed listing ${listing._id} seller from "${oldSeller}" to ObjectId`);
        }
        console.log('✅ All listings fixed.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error fixing listings:', err);
        process.exit(1);
    }
})();