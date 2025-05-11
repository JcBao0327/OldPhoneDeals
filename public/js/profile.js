
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;

    const res = await fetch('/profile/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
});

    const messageEl = document.getElementById('passwordMessage');
    if (res.ok) {
    messageEl.style.color = 'green';
    messageEl.textContent = '✅ Password updated successfully.';
    form.reset();
} else {
    const errorText = await res.text();
    messageEl.style.color = 'red';
    messageEl.textContent = errorText;
}
});

    document.getElementById('showAddFormBtn').addEventListener('click', () => {
    const formContainer = document.getElementById('addListingFormContainer');
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
});

    document.getElementById('addListingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());

    const res = await fetch('/profile/listings/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

    const msg = document.getElementById('addListingMessage');
    if (res.ok) {
    msg.textContent = 'Listing added successfully';
    e.target.reset();
    loadMyListings();
} else {
    msg.textContent = 'Failed to add listing';
}
});

    async function loadMyListings() {
    const res = await fetch('/profile/listings');
    const listings = await res.json();
    const container = document.getElementById('myListings');
    container.innerHTML = '';

    if (listings.length === 0) {
    container.innerHTML = '<p>You have no listings yet.</p>';
    return;
}

    listings.forEach(listing => {
    const item = document.createElement('div');
    item.innerHTML = `
        <strong>${listing.title}</strong> (${listing.brand}) - $${listing.price} - Stock: ${listing.stock}
        <br>Status: ${listing.disabled ? 'Disabled' : 'Enabled'}
        <br>
        <button onclick="toggleListing('${listing._id}')">${listing.disabled ? 'Enable' : 'Disable'}</button>
        <button onclick="deleteListing('${listing._id}')">Delete</button>
        <hr>
      `;
    container.appendChild(item);
});
}

    async function toggleListing(id) {
    const res = await fetch(`/profile/listings/${id}/toggle`, { method: 'POST' });
    if (res.ok) loadMyListings();
}

    async function deleteListing(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    const res = await fetch(`/profile/listings/${id}/delete`, { method: 'POST' });
    if (res.ok) loadMyListings();
}

    loadMyListings();

    async function loadSellerComments() {
    const res = await fetch('/profile/comments-on-my-listings');
    const data = await res.json();

    const container = document.getElementById('commentsContainer');
    container.innerHTML = '';

    if (data.length === 0) {
    container.innerHTML = '<p>You have not listed any phones yet.</p>';
    return;
}

    data.forEach(listing => {
    const phoneTitle = listing.phoneTitle;
    const phoneId = listing.phoneId;

    const section = document.createElement('div');
    section.innerHTML = `<h4>${phoneTitle}</h4>`;

    if (listing.reviews.length === 0) {
    section.innerHTML += '<p>No comments yet.</p>';
} else {
    listing.reviews.forEach((r, idx) => {
    const div = document.createElement('div');
    div.innerHTML = `
          <p>
            ★ ${r.rating} - ${r.comment}
            ${r.hidden ? '<em>(Hidden)</em>' : ''}
            <button onclick="toggleReview('${phoneId}', ${idx})">
              ${r.hidden ? 'Show' : 'Hide'}
            </button>
          </p>
        `;
    section.appendChild(div);
});
}

    container.appendChild(section);
    container.appendChild(document.createElement('hr'));
});
}

    async function toggleReview(phoneId, index) {
    const res = await fetch(`/profile/comments/${phoneId}/${index}/toggle`, {
    method: 'POST'
});
    if (res.ok) {
    loadSellerComments();
}
}

    loadSellerComments();
