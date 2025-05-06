const jwt = require('jsonwebtoken');
const config = require('../config/config.yaml'); 
const User = require('../models/user');

const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.session.redirectTo = req.originalUrl;  // Save current page's path
    return res.redirect('/auth');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user || user.isDisabled) {
      req.session.redirectTo = req.originalUrl;
      return res.status(403).redirect('/auth');
    }

    req.user = user; 
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    req.session.redirectTo = req.originalUrl;
    return res.status(401).redirect('/auth');
  }
};

module.exports = verifyToken;