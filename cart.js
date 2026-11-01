
const CART_KEY = "miru-cart";

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const countElement = document.querySelector("#cart-count");

    if (!countElement) return;

    const total = getCart().reduce((sum, item) => {
        return sum + (Number(item.quantity) || 0);
    }, 0);

    countElement.textContent = total;
}

function addToCart(product, variant) {
    if (!product || !variant) return;

    const cart = getCart();

    const existing = cart.find(item =>
        String(item.productId) === String(product.id) &&
        String(item.variantId) === String(variant.id)
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        const defaultImage =
            product.images?.find(image => image.is_default) ||
            product.images?.[0];

        cart.push({
            productId: product.id,
            variantId: variant.id,
            title: product.title || "Miru product",
            variantTitle: variant.title || "Standard",
            price: Number(variant.price) || 0,
            image: defaultImage?.src || defaultImage?.url || "",
            quantity: 1
        });
    }

    saveCart(cart);
}

document.addEventListener("DOMContentLoaded", updateCartCount);

window.addEventListener("storage", updateCartCount);
