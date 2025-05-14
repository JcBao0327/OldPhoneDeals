const PhoneListing = require('../models/phoneListing');
const User = require('../models/user');

exports.renderHomePage = (req, res) => {
    res.render('mainpage/Main');
};  

exports.fetchBestSellerPhones = async (req, res) => {
    const bestSellerPhones = await PhoneListing.getBestSellers();
    res.json(bestSellerPhones);
};

exports.fetchSoonSoldOutPhones = async (req, res) => {
    const soonSoldOutPhones = await PhoneListing.getSoldOutSoon();
    res.json(soonSoldOutPhones);
};

exports.searchPhones = async (req, res) => { 
    const keyword = req.query.searchKeyword || ''; 
    const searchedPhones = await PhoneListing.searchPhones(keyword);
    res.json(searchedPhones);
};

exports.viewItemDetail = async (req, res) => {
    try {
        const phoneIdParam = req.params.phoneId;

        // Find phone listing and populate seller's firstname and lastname
        const phoneListing = await PhoneListing.findById(phoneIdParam)
        .populate('seller', 'firstname lastname');


        if (!phoneListing) {
        return res.status(404).json({ error: 'Phone listing not found.' });
        }

        // Reject listing with no stock
        if (phoneListing.stock <= 0) {
            return res.status(404).json({ error: 'Phone is out of stock.' });
        }

        // Construct seller's full name
        const seller = phoneListing.seller;
        const sellerFullName = seller
        ? `${seller.firstname} ${seller.lastname}`
        : 'Unknown Seller';

        // Prepare data to return to frontend
        const phoneDetails = {
            _id: phoneListing._id,
            title: phoneListing.title,
            brand: phoneListing.brand,
            imageUrl: phoneListing.image,
            price: phoneListing.price,
            stock: phoneListing.stock,
            sellerName: sellerFullName,
            sellerId: phoneListing.seller._id.toString() //return seller id converting from obj type to string type 
        };

        return res.json({ phone: phoneDetails });

    } catch (error) {
      return res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.getCartQuantityFromDetail = async (req, res) => {
    try {
        const phoneId = req.params.phoneId;
        const userId = req.user._id;
  
        //  Fetch user with cart
        const user = await User.findById(userId).lean();
        if (!user) {return res.status(404).json({ error: 'User not found' });}
  
      //  Search for matching phoneId in cart
        const cartEntry = user.cart.find(entry =>
            entry.item.toString() === phoneId
        );
  
        const quantity = cartEntry ? cartEntry.quantity : 0;
  
        return res.json({ count: quantity });
    } catch (err) {
        console.error('Error checking cart quantity:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getWishListStatusFromDetail = async (req, res) => {
    try {
        const phoneId = req.params.phoneId;
        const userId = req.user._id;

        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isInWishlist = user.wishlist.some(entry =>
            entry.item.toString() === phoneId
        );

        return res.json({ inWishlist: isInWishlist });
    } catch (err) {
        console.error('Error checking wishlist status:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
  

exports.modifyWishlistFromDetail = async (req, res) => {
    try {
      const phoneId = req.params.phoneId;
      const userId = req.user._id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
  
      // Check if phone already in wishlist
      const existingIndex = user.wishlist.findIndex(entry =>
        entry.item.toString() === phoneId
      );
  
      if (existingIndex !== -1) {
        // Remove from wishlist
        user.wishlist.splice(existingIndex, 1);
        await user.save();
        return res.json({ success: true, message: 'Removed from wishlist' });
      } else {
        // Add to wishlist
        user.wishlist.push({ item: phoneId, isAvailable: true });
        await user.save();
        return res.json({ success: true, message: 'Added to wishlist' });
      }
    } catch (err) {
      console.error('Error modifying wishlist:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };