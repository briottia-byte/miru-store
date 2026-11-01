
const itemsContainer = document.querySelector("#cart-items");

function euro(cents) {
    return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR"
    }).format(cents / 100);
}

function renderCart() {
    const cart = getCart();

    itemsContainer.replaceChildren();

    let total = 0;

    if (!cart.length) {
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
        total += item.price * item.quantity;

        const row = document.createElement("article");
        row.className = "cart-item";

        const image = document.createElement("img");
        image.src = item.image || "";
        image.alt = item.title;

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const title = document.createElement("h3");
        title.textContent = item.title;

        const variant = document.createElement("p");
        variant.textContent = item.variantTitle;

        const price = document.createElement("div");
        price.className = "cart-item-price";
        price.textContent = euro(item.price);

        const controls = document.createElement("div");
        controls.className = "quantity-controls";

        const minus = document.createElement("button");
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Diminuisci quantità");

        const quantity = document.createElement("span");
        quantity.textContent = item.quantity;

        const plus = document.createElement("button");
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
        remove.className = "remove-item";
        remove.textContent = "RIMUOVI";

        remove.addEventListener("click", () => {
            removeItem(index);
        });

        info.append(title, variant, price, controls, remove);

        const itemTotal = document.createElement("div");
        itemTotal.className = "item-total";
        itemTotal.textContent = euro(item.price * item.quantity);

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

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();

    cart.splice(index, 1);

    saveCart(cart);
    renderCart();
}

document.addEventListener("DOMContentLoaded", renderCart);
