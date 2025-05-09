const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const YAML = require('yamljs');

// === Load YAML Config ===
const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

// === Load Raw Data ===
const usersPath = path.join(__dirname, '../data/userlist.json');
const phonesPath = path.join(__dirname, '../data/phonelisting.json');

const rawUsers = JSON.parse(fs.readFileSync(usersPath));
const rawPhones = JSON.parse(fs.readFileSync(phonesPath));

// === Brand → Image Map ===
const BRANDS = ["Samsung", "Apple", "HTC", "Huawei", "Nokia", "LG", "Motorola", "Sony", "BlackBerry"];
const brandToImage = Object.fromEntries(BRANDS.map(b => [b, `/images/${b}.jpeg`]));

// === Hash Passwords from Config ===
const defaultPassword = config.app.defaultPassword;
const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

const updatedUsers = rawUsers.map(user => ({
  ...user,
  password: hashedPassword
}));

// === Update Phone Images ===
const updatedPhones = rawPhones.map(phone => ({
  ...phone,
  image: brandToImage[phone.brand] || 'images/default.jpeg'
}));

// === Save to /data directory ===
fs.writeFileSync(path.join(__dirname, '../data/processed_users.json'), JSON.stringify(updatedUsers, null, 2));
fs.writeFileSync(path.join(__dirname, '../data/processed_phones.json'), JSON.stringify(updatedPhones, null, 2));

console.log('Users and phone listings processed successfully.');

