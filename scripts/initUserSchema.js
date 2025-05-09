const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/user'); // 根据你的项目结构确认路径

// Load YAML config
const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

mongoose.connect(config.app.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  return seedUsers();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

async function seedUsers() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'processed_users.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const users = JSON.parse(rawData);

    const cleanedUsers = users.map(user => {
      return {
        _id: user._id?.$oid || undefined,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email.toLowerCase(),
        password: user.password,
        isVerified: true,
        isDisabled: false,
        lastLoginDate: null,
        verificationToken: null,
        resetPasswordToken: null,
        cart: [],
        wishlist: []
      };
    });

    await User.deleteMany({});
    const result = await User.insertMany(cleanedUsers);
    console.log(`✅ Successfully inserted ${result.length} users`);
  } catch (err) {
    console.error('❌ Failed to seed users:', err);
  } finally {
    mongoose.disconnect();
  }
}