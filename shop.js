const API_URL = "https://miru-api.briottia.workers.dev/products";

const productGrid = document.querySelector("#product-grid");
const shopStatus = document.querySelector("#shop-status");
const searchInput = document.querySelector("#product-search");

let products = [];

async function loadProducts() {
    try {
        shopStatus.textContent = "Loading the Miru collection...";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        const data = await response.json();

        console.log("Printify response:", data);

        products = Array.isArray(data)
            ? data
            : data.data || data.products || [];

        renderProducts(products);

    } catch (error) {
        console.error(error);
        shopStatus.textContent =
            "Something went wrong. Please try again later.";
    }
}

function renderProducts(items) {
    productGrid.replaceChildren();

    if (items.length === 0) {
        shopStatus.textContent = "No products found.";
        return;
    }

    shopStatus.textContent = `${items.length} products`;

    items.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const image = document.createElement("img");
        image.className = "product-image";
        image.alt = product.title || "Miru product";

        const defaultImage = product.images?.find(img => img.is_default)
            || product.images?.[0];

        image.src = defaultImage?.src || defaultImage?.url || "";

        const title = document.createElement("h3");
        title.textContent = product.title || "Untitled product";

        const link = document.createElement("a");
        link.href = `product.html?id=${encodeURIComponent(product.id)}`;
        link.className = "product-link";
        link.textContent = "Discover";

        card.append(image, title, link);
        productGrid.appendChild(card);
    });
}

searchInput.addEventListener("input", () => {
    const search = searchInput.value.toLowerCase();

    const filtered = products.filter(product =>
        product.title?.toLowerCase().includes(search)
    );

    renderProducts(filtered);
});

loadProducts();