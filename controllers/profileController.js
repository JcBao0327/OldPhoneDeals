const nodemailer = require('nodemailer');
const YAML = require('yamljs');
const path = require('path');

// load config.yaml
const config = YAML.load(path.join(__dirname, '../config/config.yaml'));

exports.viewProfile = (req, res) => {
    const user = req.user;
    res.render('profile/view', { user });
};

// GET /profile/edit
exports.showEditForm = (req, res) => {
    const user = req.user;
    res.render('profile/edit', { user });
};

// POST /profile/edit
exports.handleEdit = async (req, res) => {
    try {
        const userId = req.user._id;
        const { email, firstname, lastname } = req.body;

        const updatedUser = await User.updateUserDirect({
            userId,
            updateFields: { email, firstname, lastname }
        });

        res.redirect('/profile/view');
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Profile update failed.');
    }
};

const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).send('Incorrect current password');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        // Send password change confirmation email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: config.email.user,
                pass: config.email.pass
            }
        });

        await transporter.sendMail({
            to: user.email,
            subject: 'Your password has been changed - OldPhoneDeals',
            html: `
    <p>Hi ${user.firstname},</p>
    <p>This is a confirmation that your account password was recently changed.</p>
    <p>If this was you, no further action is needed.</p>
    <p>If you did not perform this action, please <a href="http://localhost:3000/auth/reset">reset your password</a> immediately or contact support.</p>
    <p style="margin-top:1rem;">– OldPhoneDeals Security Team</p>
  `
        });

        return res.status(200).send('Password updated successfully');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
};

const PhoneListing = require('../models/phoneListing');

exports.getMyListings = async (req, res) => {
  const listings = await PhoneListing.getListingsByUser(req.user._id);
  res.json(listings);
};

exports.addPhoneListing = async (req, res) => {
  try {
    const data = { ...req.body, seller: req.user._id };
    const listing = await PhoneListing.createListing(data);
    res.status(200).json(listing);
  } catch (err) {
    res.status(500).send('Failed to add listing');
  }
};

exports.toggleListingStatus = async (req, res) => {
  const listing = await PhoneListing.findById(req.params.id);
  if (!listing || String(listing.seller) !== String(req.user._id)) {
    return res.status(404).send('Listing not found or unauthorized');
  }

  const updated = await PhoneListing.updateListingByOwner(req.params.id, req.user._id, { disabled: !listing.disabled });
  res.send('Status updated');
};

exports.deleteListing = async (req, res) => {
  const deleted = await PhoneListing.deleteListingByOwner(req.params.id, req.user._id);
  if (!deleted) return res.status(404).send('Listing not found');
  res.send('Listing deleted');
};

exports.getCommentsOnMyListings = async (req, res) => {
  const listings = await PhoneListing.getListingsWithReviewsBySeller(req.user._id);

  const commentData = listings.map(listing => ({
    phoneId: listing._id,
    phoneTitle: listing.title,
    reviews: listing.reviews.map((review, index) => ({
      index,
      reviewer: review.reviewer,
      rating: review.rating,
      comment: review.comment,
      hidden: review.hidden
    }))
  }));

  res.json(commentData);
};

exports.toggleCommentHiddenStatus = async (req, res) => {
  const { phoneId, index } = req.params;

  const updatedListing = await PhoneListing.toggleReviewHiddenStatus(phoneId, parseInt(index));

  if (!updatedListing) {
    return res.status(404).send('Comment not found');
  }

  res.send('Comment visibility toggled');
};

exports.getMyWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist.item');
    const wishlist = user.wishlist.map(entry => ({
        id: entry.item._id,
        title: entry.item.title,
        brand: entry.item.brand,
        price: entry.item.price,
        available: entry.isAvailable
    }));
    res.json(wishlist);
};