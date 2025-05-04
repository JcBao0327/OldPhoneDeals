// Handle back button click
    function handleBack() {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
            <h2>Check out succeeded</h2>
            <p>Redirecting to Main page in 5 seconds...</p>
        </div>
    `;

    // After 5 seconds, redirect to the Main Page
    setTimeout(function() {
        window.location.href = '/';
    }, 5000);
}

    // Update quantity
    function updateQuantity(itemId) {
        const input = document.querySelector(`#quantity-${itemId}`);
        let quantity = parseInt(input.value);

        if (isNaN(quantity) || quantity < 0 || quantity > data-stock || !Number.isInteger(quantity)) {
            alert("Please enter a valid non-negative non-decimal quantity.");
            input.value = 1;
            return;
        }

        if (quantity === 0) {
            if (confirm("Quantity is 0. Do you want to remove this item from the cart?")) {
                const removeForm = document.querySelector(`#remove-form-${itemId}`);
                removeForm.submit();
            } else {
                input.value = 1;
            }
            return;
        }

        const form = document.querySelector(`#update-form-${itemId}`);
        form.querySelector('input[name="quantity"]').value = quantity;
        form.submit();

        recalculateTotal();
    }

    // Recalculate total price based on the updated quantities
    function recalculateTotal() {
        let total = 0;
        document.querySelectorAll('.cart-item').forEach(item => {
            const price = parseFloat(item.getAttribute('data-price'));
            const quantityInput = item.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value);
            if (!isNaN(price) && !isNaN(quantity)) {
                total += price * quantity;
            }
        });

        const totalAmountElement = document.getElementById('total-amount');
        totalAmountElement.innerText = `$${total.toFixed(2)}`;
    }

    // Live recalculate when changing quantity input
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('input', recalculateTotal);
        });
    });

    // Transaction confirmation
    function confirmTransaction() {
        if (confirm("Do you want to confirm the transaction?")) {
            document.getElementById('checkout-form').submit();
        }
    }