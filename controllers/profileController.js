const nodemailer = require('nodemailer');
const config = require('../config/config.yaml');

exports.viewProfile = (req, res) => {
    const user = req.user;  // 来自 JWT 校验后的 authMiddleware
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

// 获取我发布的所有 Listings
exports.getMyListings = async (req, res) => {
  const listings = await PhoneListing.getListingsByUser(req.user._id);
  res.json(listings);
};

// 添加新的 Listing
exports.addPhoneListing = async (req, res) => {
  try {
    const data = { ...req.body, seller: req.user._id };
    const listing = await PhoneListing.createListing(data);
    res.status(200).json(listing);
  } catch (err) {
    res.status(500).send('Failed to add listing');
  }
};

// 启用或禁用 Listing
exports.toggleListingStatus = async (req, res) => {
  const listing = await PhoneListing.findById(req.params.id);
  if (!listing || String(listing.seller) !== String(req.user._id)) {
    return res.status(404).send('Listing not found or unauthorized');
  }

  const updated = await PhoneListing.updateListingByOwner(req.params.id, req.user._id, { disabled: !listing.disabled });
  res.send('Status updated');
};

// 删除 Listing
exports.deleteListing = async (req, res) => {
  const deleted = await PhoneListing.deleteListingByOwner(req.params.id, req.user._id);
  if (!deleted) return res.status(404).send('Listing not found');
  res.send('Listing deleted');
};

// 查看我所有 Listing 的评论
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

// 切换评论可见性
exports.toggleCommentHiddenStatus = async (req, res) => {
  const { phoneId, index } = req.params;

  const updatedListing = await PhoneListing.toggleReviewHiddenStatus(phoneId, parseInt(index));

  if (!updatedListing) {
    return res.status(404).send('Comment not found');
  }

  res.send('Comment visibility toggled');
};