const AppConfig = {
    DEFAULT_MAX_PRICE: 1000000,           
    DEFAULT_PRICE_SLIDER_MAX: 1000,
    RESULTS_PER_PAGE: 10,
    REVIEWS_PER_PAGE : 3,
    LONG_COMMENT_WORD_THERSHOLD : 200       
};
  
const SortOptions = {
    PRICE_ASCENDING: 'price_asc',
    PRICE_DESCENDING: 'price_desc'
};

let filteredPhoneResults = [];
let allCurrentItemCachedReviews = [];
let currentReviewPage = 1;
  
$(document).ready(function () {

    // Check if a redirect is waiting after login
    const pendingRedirect = sessionStorage.getItem('redirectAfterLogin');

    if (pendingRedirect) {
        sessionStorage.removeItem('redirectAfterLogin'); // Prevent infinite loop
        window.location.href = pendingRedirect;
        return; // Skip the rest of initialization until redirect finishes
    }

    checkLoginStatus();  

    const pendingItem = sessionStorage.getItem('postLoginItemToLoad');
    if (pendingItem) {
        $.get('/loginstatus', function (res) {
        if (res.loggedIn) {
            sessionStorage.removeItem('postLoginItemToLoad');
            loadItemState(pendingItem, res.userId); // pass user id into the item detail state `
        } else {
            window.location.href = '/auth/signin'; // fallback if still not logged in
        }
    });
    } else {
        loadHomeState();
    }
  
    // Event bindings for top-bar buttons    
    $('#web-logo').on('click', function () {
        loadHomeState(); // Show home, hide other states
    });
    
    $('#search-button').on('click', function () {
        const query = $('#search-bar').val().trim();
        if (query) {
            loadSearchState(); 
        }
    });
    
    $('#signin-button').on('click', function () {
        window.location.href = '/auth/signin';
    });
    
    $('#signout-button').on('click', function () {
        $.get('/auth/signout', function () {
            window.loggedInUserId = undefined;
            window.isLoggedIn = false;
            updateAuthButtons(false);
            location.reload();
        });
    });
    
    $('#profile-button').on('click', function () {
        window.location.href = '/profile/view';
    });

    
    $('#cart-button').on('click', function () {
        const redirectPath = '/checkout/cart';
        
        $.get('/loginstatus', function (res) {
            if (res.loggedIn) {
                window.location.href = redirectPath;
            } else {
                sessionStorage.setItem('redirectAfterLogin', redirectPath);
                window.location.href = '/auth/signin';
            }
        });
    });
      
      
    
    // Event delegation for dynamically loaded content
    //If req.user is null, go to auth home or go to item detail page
    $(document).on('click', '.listing-card', function () {
        const phoneId = $(this).data('id');
        
        $.get('/loginstatus', function (res) {
            if (!res.loggedIn) {
            // Store intent to load this item after login (in-page)
            sessionStorage.setItem('postLoginItemToLoad', phoneId);
            window.location.href = '/auth/signin';
            } else {
            checkLoginStatus();
            loadItemState(phoneId, res.userId);
            }
        });
    });
      
      
    
    // Event delegation for pagination, render phone listing results only for current page
    $(document).on('click', '.page-link', function (e) {
        e.preventDefault();
        const page = $(this).data('page');
        renderCurrentPage(page);
    });

    
    // Event delegation for updating or removing cart item
    $(document).on('click', '#add-to-cart-button', function () {
        const phoneId = $('#item-info').data('id'); 
        handleCartUpdate(phoneId);
    });


    $(document).on('click', '#add-to-wishlist-button', function () {
        const phoneId = $('#item-info').data('id');
        
        $.post(`/phones/${phoneId}/wishlist`, { phoneId }, function (res) {
            if (res.success) {
                alert(res.message || 'Wishlist status updated.');
                updateWishlistStatus();
            } else {
                alert('Wishlist update failed.');
            }
        });
    });
    
      // Event delegation for submitting a review
    $(document).on('submit', '#review-form', function (e) {
        e.preventDefault();
        
        // Read phoneId from central location
        const phoneId = $('#item-info').data('id');
        const rating = $('#review-rating').val();
        const comment = $('#review-comment').val().trim();
        const hidden = $('#review-hidden').is(':checked');
        
        if (!comment) {
            alert('Please enter a comment.');
            return;
        }
        
        $.post('/reviews/post', { phoneId, rating, comment, hidden }, function (res) {
            if (res.success) {
                alert('Review submitted successfully.');
                loadReviews(phoneId);
            } else {
                alert('Failed to submit review.');
            }
        });
    });
 

    // On click function for loading more reviews
    $(document).on('click', '#load-more-reviews', function () {
        currentReviewPage++;
        renderReviewPage();
    });
    
    // On click function for collapsing to only first three comments 
    $(document).on('click', '#collapse-reviews', function () {
        currentReviewPage = 1;
        renderReviewPage();
    });
      
    // On click function for showing more or showing less for a comment longer than 200 words
    $(document).on('click', '.toggle-comment', function () {
        const $toggleButton = $(this);
        const $reviewItem = $toggleButton.closest('.review-item');

        // Toggle between short and full comment views
        $reviewItem.find('.short-text, .full-text').toggle();

        // Update button label based on current state
        const isCurrentlyShowingMore = $toggleButton.text() === 'Show more';
        $toggleButton.text(isCurrentlyShowingMore ? 'Show less' : 'Show more');
    });
      
});

// helper function to handle cart quantity updates
function handleCartUpdate(phoneId) {
    const input = prompt('Please update the amount in cart.\nEnter zero to remove:');
    const quantity = parseInt(input, 10);

    if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
        alert('Please enter a valid non-negative whole number.');
        return;
    }

    if (quantity === 0) {
        // DELETE request to remove item
        $.ajax({
        url: '/checkout/remove',
        method: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({ itemId: phoneId }),
        success: function (res) {
            if (res.success) {
                alert('Item removed from cart.');
                updateCartCount();
            } else {
                alert('Failed to remove item from cart.');
            }
        }
        });
    } else {
        // PUT request to update quantity
        $.ajax({
        url: '/checkout/update',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ itemId: phoneId, quantity }),
        success: function (res) {
            if (res.success || res.message) {
              alert(res.message || 'Cart quantity updated successfully.');
              updateCartCount();
            } else {
              alert('Failed to update cart.');
            }
          },
          error: function (xhr, status, error) {
            console.error('AJAX error:', status, error);
            console.error('Response text:', xhr.responseText);
            alert('Error updating cart: ' + (xhr.responseJSON?.error || 'Unknown error.'));
          }
    });
    }
}
  
    
function checkLoginStatus() {
    $.get('/loginstatus', function (res) {
        updateAuthButtons(res.loggedIn);
        window.loggedInUserId = res.loggedIn ? res.userId : null;
    });
}

function updateAuthButtons(isAuthenticated) {
    if (isAuthenticated) {
      $('#signin-button').hide();
      $('#profile-button, #signout-button').show();
    } else {
      $('#signin-button').show();
      $('#profile-button, #signout-button').hide();
    }
}
  
  //Function to load the home state
function loadHomeState() {
    $('#home-state').show();
    $('#search-state, #item-state').hide();

    const $bestSellersList = $('#best-sellers-list').empty();
    const $soldOutSoonList = $('#sold-out-soon-list').empty();

    $.get('/phones/bestsellers', function (bestSellerPhones) {
        bestSellerPhones.forEach(phone => {
        $bestSellersList.append(createListingCard(phone));
        });
    });

    $.get('/phones/soldoutsoon', function (soldOutSoonPhones) {
        soldOutSoonPhones.forEach(phone => {
        $soldOutSoonList.append(createListingCard(phone));
        });
    });
}
  
  
  
  //Function to load search state 
function loadSearchState() {
    // Show the search state section and hide other sections
    showSearchStateDOM();

    // Fetch search results from backend and handle results
    fetchSearchResults()
        .then(results => {
        storeSearchResults(results);
        updatePriceSlider(results);
        populateBrandFilter(results);
        renderResults(results);
        initializePagination(results); //create pagnination button
        renderCurrentPage(1); // render the first page of search results 
        bindFrontendFilterEvents();
        });
}



// Show the search state section in the UI
function showSearchStateDOM() {
    $('#search-state').show();
    $('#home-state, #item-state').hide();
}
  
// Fetch search results using current input filter values
function fetchSearchResults() {
    const searchKeywordInput = $('#search-bar').val() || '';
    const selectedBrandInput = $('#brand-filter').val() || '';
    const maxPriceInput = parseFloat($('#price-range').val()) || AppConfig.DEFAULT_MAX_PRICE;
    const sortOptionInput = $('#sort-option').val() || '';
    const currentPageInput = 1;

    return $.get('/phones/search', {
        searchKeyword: searchKeywordInput,
        brand: selectedBrandInput,
        maxPrice: maxPriceInput,
        sort: sortOptionInput,
        page: currentPageInput
    });
}
  
// Store fetched search results globally for frontend filtering
function storeSearchResults(results) {
    cachedSearchResults = results;
    filteredPhoneResults = [...cachedSearchResults];
}
  
// Update the price slider max value and label based on results
function updatePriceSlider(results) {
    const priceList = results.map(phoneItem => phoneItem.price);

    const minPriceInResults = priceList.length > 0
        ? Math.min(...priceList)
        : 0;

    const maxPriceInResults = priceList.length > 0
        ? Math.max(...priceList)
        : AppConfig.DEFAULT_PRICE_SLIDER_MAX;

    const sliderElement = document.getElementById('price-slider');

    // Destroy existing slider instance if it exists (avoid duplicate creation)
    if (sliderElement.noUiSlider) {
        sliderElement.noUiSlider.destroy();
    }

    // Create new slider
    noUiSlider.create(sliderElement, {
        start: [minPriceInResults, maxPriceInResults],
        connect: true,
        range: {
        min: minPriceInResults,
        max: maxPriceInResults
        },
        step: 10,
        tooltips: true,
        format: {
        to: value => Math.round(value),
        from: value => parseFloat(value)
        }
    });

    // Update UI values on slider change
    sliderElement.noUiSlider.on('update', function (values) {
        document.getElementById('price-min').textContent = values[0];
        document.getElementById('price-max').textContent = values[1];
    });
}

  
// Populate the brand filter dropdown based on results
function populateBrandFilter(results) {
    const uniqueBrands = [...new Set(results.map(phoneItem => phoneItem.brand))];
    const brandFilter = $('#brand-filter').empty().append('<option value="">All</option>');
    uniqueBrands.forEach(brand => {
        brandFilter.append(`<option value="${brand}">${brand}</option>`);
    });
    $('#brand-filter').val(''); 
}
  
//Given by filtered items, calling to render results to create listing card items given by page number
function renderCurrentPage(currentPage = 1) {
    const resultsPerPage = AppConfig.RESULTS_PER_PAGE;
    const totalItems = filteredPhoneResults.length;

    // Calculate the index range for the current page
    const firstItemIndex = (currentPage - 1) * resultsPerPage;
    const lastItemIndex = Math.min(firstItemIndex + resultsPerPage, totalItems);

    // Get only the items for the current page
    const paginatedItems = filteredPhoneResults.slice(firstItemIndex, lastItemIndex);

    // Render those items on the page
    renderResults(paginatedItems);

    // Update the UI to show which results are being displayed
    $('#result-range').text(
        `Showing results ${firstItemIndex + 1}-${lastItemIndex} of ${totalItems}`
    );
}
  
  
// Render search results into the UI
function renderResults(resultsToRender) {
    const resultsContainer = $('#search-results').empty();
    resultsToRender.forEach((phoneItem, index) => {
        resultsContainer.append(createListingCard(phoneItem));
    });
}
  
// Bind frontend filter events for brand, price, and sort changes
// Event delegation for filters
function bindFrontendFilterEvents() {
    $('#brand-filter').off('change').on('change', applyFrontendFilters);
    $('#sort-option').off('change click').on('change click', applyFrontendFilters);

    const slider = document.getElementById('price-slider');
    if (slider && slider.noUiSlider) {
        slider.noUiSlider.on('change', applyFrontendFilters);
    }
}
  
  // Initialize pagination controls based on total number of pages
function initializePagination() {
    const totalItems = filteredPhoneResults.length;
    const itemsPerPage = AppConfig.RESULTS_PER_PAGE;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const paginationElement = $('#pagination-container .pagination').empty();

    for (let i = 1; i <= totalPages; i++) {
        paginationElement.append(
        `<li class="page-item"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`
        );
    }
}
  
  
// Further filtering for items based on previous results from global variable filteredPhoneResults
function applyFrontendFilters() {
    const selectedBrandName = $('#brand-filter').val();
    const selectedSortOption = $('#sort-option').val();

    // Get price range from noUiSlider
    const slider = document.getElementById('price-slider');
    const [selectedMinPrice, selectedMaxPrice] = slider && slider.noUiSlider
        ? slider.noUiSlider.get().map(value => parseFloat(value))
        : [0, AppConfig.DEFAULT_MAX_PRICE];

    filteredPhoneResults = cachedSearchResults;

    // Filter by brand
    if (selectedBrandName) {
        filteredPhoneResults = filteredPhoneResults.filter(
        phoneItem => phoneItem.brand === selectedBrandName
        );
    }

    // Filter by price range
    filteredPhoneResults = filteredPhoneResults.filter(
        phoneItem =>
        phoneItem.price >= selectedMinPrice &&
        phoneItem.price <= selectedMaxPrice
    );

    // Sort results
    if (selectedSortOption === SortOptions.PRICE_ASCENDING) {
        filteredPhoneResults.sort((a, b) => a.price - b.price);
    } else if (selectedSortOption === SortOptions.PRICE_DESCENDING) {
        filteredPhoneResults.sort((a, b) => b.price - a.price);
    }

    initializePagination();      // generate page buttons
    renderCurrentPage(1);        // render first page of filtered results
}
  


// Function to load item state
function loadItemState(phoneId, currentUserId) {
    $('#item-state').show();
    $('#home-state, #search-state').hide();

    // Fetch phone details
    $.get(`/phones/${phoneId}`, function (res) {
    const phone = res.phone;
    $('#item-info').data('id', phoneId);
    $('#item-title').text(phone.title);
    $('#item-price').text(`$${phone.price}`);
    $('#item-stock').text(`Stock: ${phone.stock}`);
    $('#item-seller-name').text(phone.sellerName);
    $('#item-seller-id').text(`Seller ID: ${phone.sellerId}`).hide();
    $('#item-image').attr('src', phone.imageUrl);

    //  Determine if current user is seller
    const isSeller = isCurrentUserSeller(currentUserId, phone.sellerId);

    //  Hide purchase controls and review section for sellers
    if (isSeller) {
        $('#purchase-controls').hide();
        $('#review-form').hide();
    } else {
        $('#purchase-controls').show();
        $('#review-form').show();
    }

    // Update purchase controls
    $('#add-to-cart-button, #add-to-wishlist-button').data('id', phoneId);
    updateCartCount();
    updateWishlistStatus();

    // Load reviews
    loadReviews(phoneId);
    });
}

//Boolean Function check if current login user is seller, return true if yes
function isCurrentUserSeller(currentUserId, sellerId) {
    if (!currentUserId || !sellerId) return false;
    return String(currentUserId) === String(sellerId);
}
    

// Function to fetch all reviews once 
function loadReviews(phoneId) {
    const currentUserId = window.loggedInUserId || null;
  
    // Extract sellerId from frontend dom and trim
    const sellerText = $('#item-seller-id').text().trim(); 
    const sellerId = sellerText.replace('Seller ID:', '').trim();

    $.get(`/reviews/phone/${phoneId}`, function (res) {
        const allReviews = res.reviews || [];

        //  Store all reviews unfiltered
        allCurrentItemCachedReviews = allReviews;
        
        const visibleReviews = allReviews.filter(review => {
            const isSeller = currentUserId && String(currentUserId) === String(sellerId);
            const isReviewer = currentUserId && String(review.reviewerId) === String(currentUserId);          

            //  Seller sees all, reviewer sees their own, others see only non-hidden
            if (isSeller || isReviewer) return true;
            return !review.hidden;
        });

        //  Optionally store separately if needed
        allCurrentItemCachedReviews = visibleReviews;

        currentReviewPage = 1;
        renderReviewPage();
    });
}
  
  
  // Renders the current page of visible reviews with optional "Load More" or "Show Less" controls
  function renderReviewPage() {
  
    // Determine the review range for the current page
    const startIndex = 0;
    const endIndex = currentReviewPage * AppConfig.REVIEWS_PER_PAGE;
    const currentPageReviews = allCurrentItemCachedReviews.slice(startIndex, endIndex);
  
    // Clear and prepare the review container
    const $reviewListContainer = $('#review-list').empty();
  
    // Loop through and render each review block
    currentPageReviews.forEach(review => {
        const isLongComment = review.comment.length > AppConfig.LONG_COMMENT_WORD_THERSHOLD;
        const shortComment = review.comment.slice(0, AppConfig.LONG_COMMENT_WORD_THERSHOLD);
    
        // Build the review HTML block with short/full text toggling if needed
        const hiddenClass = review.hidden ? 'hidden' : '';
        const fullClass = `review-comment ${hiddenClass}`;

        const $reviewItem = $(`
            <div class="review-item">
            <p><strong>${review.reviewerName}</strong> - ${'⭐'.repeat(review.rating)}</p>
            <p class="${fullClass}">
                ${
                isLongComment
                    ? `<span class="short-text">${shortComment}...</span><span class="full-text" style="display:none;">${review.comment}</span>`
                    : `<span>${review.comment}</span>`
                }
            </p>
            ${
                isLongComment
                ? `<button class="toggle-comment" data-id="${review.id}">Show more</button>`
                : ''
            }
            </div>
        `);
  
      $reviewListContainer.append($reviewItem);
    });
  
    // Determine whether to show "Load More" or "Show Less" button
    const hasMoreReviews = allCurrentItemCachedReviews.length > endIndex;
    const actionButtonHTML = hasMoreReviews
      ? `<button id="load-more-reviews">Load More</button>`
      : (currentReviewPage > 1
          ? `<button id="collapse-reviews">Show Less</button>`
          : '');
  
    // Append the button if applicable
    if (actionButtonHTML) {
      $reviewListContainer.append(`<div class="review-actions">${actionButtonHTML}</div>`);
    }
  }
  
    
// Function to update cart quantity for the current listing
function updateCartCount() {
    const phoneId = $('#item-info').data('id');
    $.get(`/phones/${phoneId}/cart`, function (res) {
        $('#cart-count').text(res.count);
    });
}
  


// 
function updateWishlistStatus() {
    const phoneId = $('#item-info').data('id');
  
    $.get(`/phones/${phoneId}/wishlist`, function (res) {
      if (res.inWishlist) {
        $('#add-to-wishlist-button').text('Remove from Wishlist');
        $('#wishlist-status').text('Added');
      } else {
        $('#add-to-wishlist-button').text('Add to Wishlist');
        $('#wishlist-status').text('Not added');
      }
    });
}

// Helper function to create a listing card for each phonelisting instance
function createListingCard(phone) {
    return $(`
        <div class="listing-card" data-id="${phone._id}">
        <img src="${phone.image}" alt="${phone.title}" class="listing-image">
        <h3 class="listing-title">${phone.title}</h3>
        <p class="listing-price">$${phone.price}</p>
        </div>
    `);
}