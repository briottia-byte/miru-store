
const API_URL = "https://miru-api.briottia.workers.dev/products";

const content = document.querySelector("#product-content");
const message = document.querySelector("#product-message");

let currentProduct = null;

function getProducts(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.products)) return data.products;
    return [];
}

function formatPrice(cents) {
    return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR"
    }).format((Number(cents) || 0) / 100);
}

function getAvailableVariants(product) {
    return (product.variants || []).filter(variant =>
        variant.is_enabled !== false &&
        variant.is_available !== false
    );
}

function updateVariant() {
    const select = document.querySelector("#variant-select");
    const price = document.querySelector("#product-price");
    const image = document.querySelector("#product-image");

    if (!select || !price) return;

    const variant = currentProduct.variants.find(item =>
        String(item.id) === select.value
    );

    if (!variant) return;

    price.textContent = formatPrice(variant.price);

    const images = currentProduct.images || [];

    const matchingImage = images.find(item =>
        Array.isArray(item.variant_ids) &&
        item.variant_ids.includes(Number(variant.id))
    );

    const defaultImage =
        images.find(item => item.is_default) || images[0];

    const selectedImage = matchingImage || defaultImage;

    if (selectedImage && image) {
        image.src = selectedImage.src || selectedImage.url || "";
    }
}

function renderProduct(product) {
    currentProduct = product;

    const variants = getAvailableVariants(product);
    const images = product.images || [];

    const defaultImage =
        images.find(item => item.is_default) || images[0];

    const firstVariant = variants[0];

    content.replaceChildren();

    const gallery = document.createElement("div");
    gallery.className = "product-gallery";

    const image = document.createElement("img");
    image.id = "product-image";
    image.className = "main-image";
    image.src = defaultImage?.src || defaultImage?.url || "";
    image.alt = product.title || "Miru product";

    gallery.appendChild(image);

    const info = document.createElement("section");
    info.className = "product-info";

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = "MIRU COLLECTION";

    const title = document.createElement("h1");
    title.className = "product-title";
    title.textContent = product.title || "Untitled product";

    const price = document.createElement("p");
    price.className = "product-price";
    price.id = "product-price";
    price.textContent = firstVariant
        ? formatPrice(firstVariant.price)
        : "Non disponibile";

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent =
        product.description || "Scopri questo prodotto della collezione Miru.";

    info.append(category, title, price, description);

    if (variants.length) {
        const label = document.createElement("label");
        label.className = "option-label";
        label.htmlFor = "variant-select";
        label.textContent = "SELEZIONA LA VARIANTE";

        const select = document.createElement("select");
        select.className = "variant-select";
        select.id = "variant-select";

        variants.forEach(variant => {
            const option = document.createElement("option");
            option.value = variant.id;
            option.textContent = variant.title || `Variante ${variant.id}`;
            select.appendChild(option);
        });

        select.addEventListener("change", updateVariant);

        const availability = document.createElement("p");
        availability.id = "availability";
        availability.className = "availability";
        availability.textContent = "Disponibile";

        const button = document.createElement("button");
        button.className = "shop-button";
        button.textContent = "AGGIUNGI AL CARRELLO";

        button.addEventListener("click", () => {
            const selected = variants.find(item =>
                String(item.id) === select.value
            );

            if (!selected) return;

            addToCart(product, selected);

            button.textContent = "AGGIUNTO AL CARRELLO ✓";

            setTimeout(() => {
                button.textContent = "AGGIUNGI AL CARRELLO";
            }, 1800);
        });

        const note = document.createElement("p");
        note.className = "product-note";
        note.textContent = "Puoi controllare i tuoi articoli nel carrello.";

        info.append(label, select, availability, button, note);

    } else {
        const availability = document.createElement("p");
        availability.className = "availability unavailable";
        availability.textContent = "Attualmente non disponibile.";

        info.appendChild(availability);
    }

    content.append(gallery, info);
}

async function loadProduct() {
    try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get("id");

        if (!productId) {
            throw new Error("Nessun prodotto selezionato.");
        }

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Impossibile caricare i prodotti.");
        }

        const data = await response.json();
        const products = getProducts(data);

        const product = products.find(item =>
            String(item.id) === String(productId)
        );

        if (!product) {
            throw new Error("Prodotto non trovato.");
        }

        document.title = `${product.title} — Miru`;

        renderProduct(product);

    } catch (error) {
        content.textContent = error.message;
        message.textContent =
            "Torna allo shop per scegliere un altro prodotto.";
    }
}

loadProduct();
