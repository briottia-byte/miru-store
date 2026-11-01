
const itemsContainer = document.querySelector("#cart-items");

function euro(cents) {
    return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR"
    }).format((Number(cents) || 0) / 100);
}

function renderCart() {
    const cart = getCart();

    itemsContainer.replaceChildren();

    let total = 0;

    if (cart.length === 0) {
        const empty = document.createElement("div");
        empty.className = "cart-empty";

        const message = document.createElement("p");
        message.textContent = "Il tuo carrello è ancora vuoto.";

        const link = document.createElement("a");
        link.href = "shop.html";
        link.textContent = "SCOPRI LA COLLEZIONE →";

        empty.append(message, link);
        itemsContainer.appendChild(empty);
    }

    cart.forEach((item, index) => {
        const quantityValue = Math.max(1, Number(item.quantity) || 1);
        const priceValue = Number(item.price) || 0;

        total += priceValue * quantityValue;

        const row = document.createElement("article");
        row.className = "cart-item";

        const image = document.createElement("img");
        image.src = item.image || "";
        image.alt = item.title || "Miru product";
        image.loading = "lazy";

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const title = document.createElement("h3");
        title.textContent = item.title || "Miru product";

        const variant = document.createElement("p");
        variant.textContent = item.variantTitle || "Standard";

        const price = document.createElement("div");
        price.className = "cart-item-price";
        price.textContent = euro(priceValue);

        const controls = document.createElement("div");
        controls.className = "quantity-controls";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Diminuisci quantità");

        const quantity = document.createElement("span");
        quantity.textContent = quantityValue;

        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";
        plus.setAttribute("aria-label", "Aumenta quantità");

        minus.addEventListener("click", () => {
            changeQuantity(index, -1);
        });

        plus.addEventListener("click", () => {
            changeQuantity(index, 1);
        });

        controls.append(minus, quantity, plus);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-item";
        remove.textContent = "RIMUOVI";

        remove.addEventListener("click", () => {
            removeItem(index);
        });

        info.append(title, variant, price, controls, remove);

        const itemTotal = document.createElement("div");
        itemTotal.className = "item-total";
        itemTotal.textContent = euro(priceValue * quantityValue);

        row.append(image, info, itemTotal);
        itemsContainer.appendChild(row);
    });

    document.querySelector("#cart-subtotal").textContent = euro(total);
    document.querySelector("#cart-total").textContent = euro(total);

    updateCartCount();
}

function changeQuantity(index, amount) {
    const cart = getCart();

    if (!cart[index]) return;

    cart[index].quantity =
        (Number(cart[index].quantity) || 1) + amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();

    if (!cart[index]) return;

    cart.splice(index, 1);

    saveCart(cart);
    renderCart();
}

document.addEventListener("DOMContentLoaded", renderCart);
