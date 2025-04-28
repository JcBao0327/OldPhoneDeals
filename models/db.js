// connectDB.js
const mongoose = require('mongoose');
const path = require('path');
const YAML = require('yamljs');

// Load YAML config
const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

const connectDB = async () => {
  try {
    await mongoose.connect(config.app.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected to oldphonedeals');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
