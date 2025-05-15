// Update quantity
async function handleUpdateQuantity(itemId) {
    const input = document.querySelector(`#quantity-${itemId}`);
    let quantity = parseInt(input.value);
    const maxStock = parseInt(input.dataset.stock);
    
    if (maxStock === 0) {
        alert("This item is out of stock.");
        return;
    }

    if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
        alert("Please enter a valid non-negative non-decimal quantity.");
        input.value = 1;
        return;
    }

    if (quantity > maxStock) {
        alert(`Only ${maxStock} items in stock.`);
        input.value = maxStock;
        return;
    }

    if (quantity === 0) {
        if (confirm("Quantity is 0. Do you want to remove this item from the cart?")) {
            await removeItem(itemId);
        } else {
            input.value = 1;
        }
        return;
    }

    const response = await fetch(`/checkout/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId, quantity })
    });

    const result = await response.json();
    if (!response.ok) {
        alert(`Error: ${result.message}`);
        return;
    }

    recalculateTotal();
}

    // Recalculate total price based on the updated quantities
    function recalculateTotal() {
        let total = 0;
        document.querySelectorAll('.cart-item').forEach(item => {
            const checkbox = item.querySelector('input[name="itemCheckbox"]');
            if (checkbox && checkbox.checked) {
                const price = parseFloat(item.getAttribute('data-price'));
                const quantityInput = item.querySelector('.quantity-input');
                const quantity = parseInt(quantityInput.value);
                if (!isNaN(price) && !isNaN(quantity)) {
                    total += price * quantity;
                }
            }
        });

        const totalAmountElement = document.getElementById('total-amount');
        totalAmountElement.innerText = `$${total.toFixed(2)}`;
    }

    // Remove item from cart
    async function removeItem(itemId) {

            const response = await fetch(`/checkout/remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId })
            });
            if (response.ok) {
                // Reload the page or update the UI
                location.reload();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
    }

    // Transaction confirmation and Redirection
    /**
     * Displays success message and redirects.
     * Note: Assumes transaction already succeeded on server.
     */

    // Template for checkout success message
    function getCheckoutSuccessTemplate() {
        return `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
                <h2>Checkout Succeeded</h2>
                <p>Redirecting to the main page in 5 seconds...</p>
            </div>
        `;
    }

    // Utility function for delayed redirection
    function redirectAfterDelay(url, delay) {
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    }

    async function confirmTransaction() {

        const checkedBoxes = document.querySelectorAll('input[name="itemCheckbox"]:checked');
        const selectedItemIds = Array.from(checkedBoxes).map(cb => cb.value);

        if (selectedItemIds.length === 0) {
            alert('Please select at least one item to check out.');
            return;
    }

            const response = await fetch('/checkout/transaction', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ selectedItemIds })
            });
    
            const data = await response.json();
    
            if (!response.ok || !data.transaction?.items?.length) {
                alert("Transaction failed or cart is empty.");
                return;
            }
    
            // Show success UI immediately
            document.body.innerHTML = getCheckoutSuccessTemplate();
    
            // Redirect after 5 seconds
            redirectAfterDelay('/', 5000);
    
    }
    
    
    