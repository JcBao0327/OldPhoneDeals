const jwt = require('jsonwebtoken');
const User = require('../models/user');
const path = require('path')
const YAML = require('yamljs')

// Load YAML config
const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

//Check login for homepage, if user does not login set req.user to null and do not redirect to /auth
const verifyLogin = async (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
      req.user = null;
      return next();
    }
  
    try {
      const decoded = jwt.verify(token, config.app.jwtSecret);
      const user = await User.findById(decoded.userId);
  
      if (!user || user.isDisabled) {
        req.user = null;
      } else {
        req.user = user;
      }
    } catch (err) {
      console.error('JWT verification failed:', err);
      req.user = null;
    }
  
    next();
};
  
module.exports = verifyLogin;