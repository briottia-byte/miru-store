const HOME_API = "https://miru-api.briottia.workers.dev/products";

const homeGrid = document.querySelector("#home-product-grid");
const homeStatus = document.querySelector("#home-product-status");


function getProductImage(product) {
    const image = product.images?.find(item => item.is_default)
        || product.images?.[0];

    return image?.src || image?.url || "";
}


function getProductCategory(product) {
    const title = (product.title || "").toLowerCase();

    const tags = Array.isArray(product.tags)
        ? product.tags.join(" ").toLowerCase()
        : "";

    const text = `${title} ${tags}`;

    if (/tote|bag|backpack|pouch/.test(text)) {
        return "Carry with you";
    }

    if (/mug|bottle|cup|home|decor|coaster/.test(text)) {
        return "For your space";
    }

    if (/notebook|journal|paper|stationery|planner/.test(text)) {
        return "Creative corner";
    }

    return "Everyday objects";
}


function selectHomepageProducts(products) {
    const categories = [
        "Carry with you",
        "For your space",
        "Creative corner",
        "Everyday objects"
    ];

    const selected = [];

    categories.forEach(category => {
        const product = products.find(item =>
            getProductCategory(item) === category &&
            getProductImage(item) &&
            !selected.includes(item)
        );

        if (product) {
            selected.push(product);
        }
    });

    if (selected.length < 4) {
        products.forEach(product => {
            if (
                selected.length < 4 &&
                !selected.includes(product) &&
                getProductImage(product)
            ) {
                selected.push(product);
            }
        });
    }

    return selected.slice(0, 4);
}


function createProductCard(product, index) {
    const card = document.createElement("article");
    card.className = "home-product-card";

    const imageLink = document.createElement("a");
    imageLink.className = "home-product-image-link";
    imageLink.href = `product.html?id=${encodeURIComponent(product.id)}`;

    const image = document.createElement("img");
    image.src = getProductImage(product);
    image.alt = product.title || "Miru product";
    image.loading = "lazy";

    const number = document.createElement("span");
    number.className = "home-product-number";
    number.textContent = `0${index + 1}`;

    imageLink.append(image, number);

    const category = document.createElement("p");
    category.className = "home-product-category";
    category.textContent = getProductCategory(product);

    const title = document.createElement("h3");
    title.textContent = product.title || "Miru object";

    const discover = document.createElement("a");
    discover.className = "home-product-discover";
    discover.href = imageLink.href;
    discover.textContent = "DISCOVER →";

    card.append(
        imageLink,
        category,
        title,
        discover
    );

    return card;
}


function renderHomepageProducts(products) {
    homeGrid.replaceChildren();

    const selected = selectHomepageProducts(products);

    if (selected.length === 0) {
        homeStatus.textContent = "The collection is coming soon.";
        return;
    }

    homeStatus.textContent = "";

    selected.forEach((product, index) => {
        const card = createProductCard(product, index);
        homeGrid.appendChild(card);
    });
}


async function loadHomepageProducts() {
    try {
        homeStatus.textContent = "Discovering the collection...";

        const response = await fetch(HOME_API);

        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        const data = await response.json();

        const products = Array.isArray(data)
            ? data
            : data.data || data.products || [];

        renderHomepageProducts(products);

    } catch (error) {
        console.error("Miru homepage error:", error);

        homeStatus.textContent =
            "The collection is temporarily unavailable.";
    }
}


loadHomepageProducts();