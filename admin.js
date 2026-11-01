
const API = "https://miru-api.briottia.workers.dev";

let token = sessionStorage.getItem("miru_admin_token") || "";
let products = [];
let orders = [];

const $ = selector => document.querySelector(selector);

/* =========================
   NOTIFICHE
========================= */

function showNotice(message, isError = false) {
    const notice = $("#notice");
    if (!notice) return;

    notice.textContent = message;
    notice.classList.remove("hidden", "error-notice");

    if (isError) {
        notice.classList.add("error-notice");
    }

    window.clearTimeout(showNotice.timer);

    showNotice.timer = window.setTimeout(() => {
        notice.classList.add("hidden");
    }, 5000);
}

/* =========================
   API
========================= */

async function api(path, options = {}) {
    const response = await fetch(API + path, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token ? {
                Authorization: `Bearer ${token}`
            } : {}),
            ...(options.body ? {
                "Content-Type": "application/json"
            } : {})
        }
    });

    const responseText = await response.text();

    let data = {};

    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = {
            error: responseText || "Risposta non valida dal server."
        };
    }

    if (!response.ok) {
        throw new Error(data.error || `Errore ${response.status}`);
    }

    return data;
}

/* =========================
   LOGIN
========================= */

function showLogin() {
    $("#login-screen").classList.remove("hidden");
    $("#admin-app").classList.add("hidden");
}

function showApp() {
    $("#login-screen").classList.add("hidden");
    $("#admin-app").classList.remove("hidden");

    loadDashboard();
}

async function checkSession() {
    if (!token) {
        showLogin();
        return;
    }

    try {
        const result = await api("/admin/session");

        if (result.authenticated) {
            showApp();
        } else {
            logout(false);
        }
    } catch {
        logout(false);
    }
}

function logout(message = true) {
    if (token) {
        fetch(API + "/admin/logout", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).catch(() => {});
    }

    token = "";

    sessionStorage.removeItem("miru_admin_token");

    showLogin();

    if (message) {
        $("#login-error").textContent = "You have been logged out.";
    }
}

$("#login-form").addEventListener("submit", async event => {
    event.preventDefault();

    const password = $("#admin-password").value;
    const error = $("#login-error");

    error.textContent = "Signing in...";

    try {
        const response = await fetch(API + "/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Login failed.");
        }

        token = data.token;

        sessionStorage.setItem("miru_admin_token", token);

        $("#admin-password").value = "";
        error.textContent = "";

        showApp();

    } catch (err) {
        error.textContent = err.message;
    }
});

$("#logout-button").addEventListener("click", () => logout());
$("#settings-logout").addEventListener("click", () => logout());

/* =========================
   NAVIGAZIONE
========================= */

function openPage(name) {
    document.querySelectorAll(".admin-page").forEach(page => {
        page.classList.toggle(
            "active",
            page.id === `page-${name}`
        );
    });

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === name
        );
    });

    const titles = {
        dashboard: "Overview",
        products: "Products",
        orders: "Orders",
        homepage: "Homepage",
        settings: "Settings"
    };

    $("#page-title").textContent = titles[name] || "Overview";

    if (name === "products") loadProducts();
    if (name === "orders") loadOrders();
    if (name === "homepage") loadHomepageSettings();
}

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.go);
    });
});

/* =========================
   DATI
========================= */

function getItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.orders)) return data.orders;

    return [];
}

/* =========================
   PRODOTTI
========================= */

async function loadProducts() {
    $("#products-list").innerHTML =
        "<p class='muted'>Loading products...</p>";

    try {
        const data = await api("/admin/products");

        products = getItems(data);

        renderProducts();

        $("#stat-products").textContent = products.length;

        $("#stat-visible").textContent =
            products.filter(product => product.visible !== false).length;

    } catch (error) {
        $("#products-list").textContent = error.message;
    }
}

function renderProducts() {
    const list = $("#products-list");

    const filter = ($("#product-filter").value || "").toLowerCase();

    const filtered = products.filter(product =>
        (product.title || "").toLowerCase().includes(filter)
    );

    list.replaceChildren();

    if (!filtered.length) {
        list.textContent = "No products found.";
        return;
    }

    filtered.forEach(product => {
        const row = document.createElement("article");
        row.className = "product-row";

        const image = document.createElement("img");

        const defaultImage =
            product.images?.find(item => item.is_default) ||
            product.images?.[0];

        image.src = defaultImage?.src || "";
        image.alt = product.title || "Product";

        const info = document.createElement("div");
        info.className = "product-info";

        const title = document.createElement("strong");
        title.textContent = product.title || "Untitled product";

        const detail = document.createElement("small");

        detail.textContent =
            `${product.visible === false ? "Not visible" : "Visible"} · ID: ${product.id}`;

        info.append(title, detail);

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const edit = document.createElement("button");
        edit.textContent = "EDIT";

        edit.addEventListener("click", () => {
            editProduct(product);
        });

        const visibility = document.createElement("button");

        visibility.textContent =
            product.visible === false ? "PUBLISH" : "UNPUBLISH";

        visibility.addEventListener("click", () => {
            toggleProduct(product);
        });

        const remove = document.createElement("button");

        remove.textContent = "DELETE";
        remove.className = "danger";

        remove.addEventListener("click", () => {
            deleteProduct(product);
        });

        actions.append(edit, visibility, remove);

        row.append(image, info, actions);

        list.append(row);
    });
}

/* =========================
   STILE EDITOR PRODOTTO
========================= */

function addEditorStyle() {
    if ($("#miru-editor-style")) return;

    const style = document.createElement("style");

    style.id = "miru-editor-style";

    style.textContent = `
        .miru-editor-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(0,0,0,.7);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            overflow-y: auto;
        }

        .miru-editor {
            background: #f5f1e8;
            color: #25251f;
            width: 100%;
            max-width: 620px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 25px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
        }

        .miru-editor h2 {
            margin-top: 0;
        }

        .miru-editor label {
            display: block;
            margin: 15px 0 6px;
            font-weight: bold;
        }

        .miru-editor input[type="text"],
        .miru-editor input[type="number"],
        .miru-editor textarea {
            box-sizing: border-box;
            width: 100%;
            padding: 12px;
            border: 1px solid #bbb;
            border-radius: 6px;
            background: white;
            font: inherit;
        }

        .miru-editor textarea {
            min-height: 110px;
            resize: vertical;
        }

        .miru-variant {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
        }

        .miru-variant strong {
            display: block;
        }

        .miru-variant .miru-enabled {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-top: 10px;
            font-weight: normal;
        }

        .miru-editor-actions {
            display: flex;
            gap: 10px;
            margin-top: 22px;
        }

        .miru-editor-actions button {
            flex: 1;
            padding: 13px;
            border: 0;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }

        .miru-save {
            background: #555d3b;
            color: white;
        }

        .miru-cancel {
            background: #ddd8ce;
            color: #222;
        }

        .miru-editor button:disabled {
            opacity: .5;
            cursor: not-allowed;
        }
    `;

    document.head.appendChild(style);
}

/* =========================
   MODIFICA PRODOTTO
========================= */

function editProduct(product) {
    addEditorStyle();

    const variants = product.variants || [];

    const overlay = document.createElement("div");
    overlay.className = "miru-editor-overlay";

    const form = document.createElement("form");
    form.className = "miru-editor";

    const heading = document.createElement("h2");
    heading.textContent = "Modifica prodotto";

    form.appendChild(heading);

    // Titolo

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Nome prodotto";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.required = true;
    titleInput.value = product.title || "";

    form.append(titleLabel, titleInput);

    // Descrizione

    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "Descrizione";

    const descriptionInput = document.createElement("textarea");
    descriptionInput.value = product.description || "";

    form.append(descriptionLabel, descriptionInput);

    // Varianti

    const variantsHeading = document.createElement("h3");
    variantsHeading.textContent = "Prezzi e disponibilità";
    variantsHeading.style.marginTop = "25px";

    form.appendChild(variantsHeading);

    const variantInputs = [];

    variants.forEach(variant => {
        const box = document.createElement("div");
        box.className = "miru-variant";

        const name = document.createElement("strong");
        name.textContent =
            variant.title || `Variante ${variant.id}`;

        const priceLabel = document.createElement("label");
        priceLabel.textContent = "Prezzo (€)";

        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.min = "0";
        priceInput.step = "0.01";
        priceInput.required = true;

        priceInput.value =
            (Number(variant.price || 0) / 100).toFixed(2);

        const enabledLabel = document.createElement("label");
        enabledLabel.className = "miru-enabled";

        const enabledInput = document.createElement("input");
        enabledInput.type = "checkbox";

        enabledInput.checked =
            variant.is_enabled !== false &&
            variant.is_available !== false;

        if (variant.is_available === false) {
            enabledInput.disabled = true;
        }

        const enabledText = document.createElement("span");

        enabledText.textContent =
            variant.is_available === false
                ? "Non disponibile dal fornitore"
                : "Variante in vendita";

        enabledLabel.append(enabledInput, enabledText);

        box.append(
            name,
            priceLabel,
            priceInput,
            enabledLabel
        );

        form.appendChild(box);

        variantInputs.push({
            id: variant.id,
            priceInput,
            enabledInput,
            original: variant
        });
    });

    if (!variants.length) {
        const warning = document.createElement("p");

        warning.textContent =
            "Questo prodotto non contiene varianti modificabili.";

        form.appendChild(warning);
    }

    // Pulsanti

    const actions = document.createElement("div");
    actions.className = "miru-editor-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "miru-cancel";
    cancelButton.textContent = "ANNULLA";

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.className = "miru-save";
    saveButton.textContent = "SALVA MODIFICHE";

    actions.append(cancelButton, saveButton);

    form.appendChild(actions);

    overlay.appendChild(form);

    document.body.appendChild(overlay);

    cancelButton.addEventListener("click", () => {
        overlay.remove();
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    // Salvataggio

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!titleInput.value.trim()) {
            showNotice("Inserisci il nome del prodotto.", true);
            titleInput.focus();
            return;
        }

        const updatedVariants = [];

        for (const item of variantInputs) {
            const price = Number(item.priceInput.value);

            if (!Number.isFinite(price) || price < 0) {
                showNotice("Inserisci un prezzo valido.", true);
                item.priceInput.focus();
                return;
            }

            updatedVariants.push({
                ...item.original,
                price: Math.round(price * 100),
                is_enabled:
                    item.original.is_available === false
                        ? false
                        : item.enabledInput.checked
            });
        }

        saveButton.disabled = true;
        saveButton.textContent = "SALVATAGGIO...";

        try {
            await api(
                `/admin/products/${encodeURIComponent(product.id)}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        title: titleInput.value.trim(),
                        description: descriptionInput.value.trim(),
                        variants: updatedVariants
                    })
                }
            );

            overlay.remove();

            showNotice("Prodotto aggiornato correttamente.");

            await loadProducts();

        } catch (error) {
            saveButton.disabled = false;
            saveButton.textContent = "SALVA MODIFICHE";

            showNotice(error.message, true);
        }
    });
}

/* =========================
   PUBBLICAZIONE
========================= */

async function toggleProduct(product) {
    const publishing = product.visible === false;

    if (!confirm(
        publishing
            ? `Publish "${product.title}"?`
            : `Unpublish "${product.title}"?`
    )) {
        return;
    }

    try {
        await api(
            `/admin/products/${encodeURIComponent(product.id)}/${publishing ? "publish" : "unpublish"}`,
            {
                method: "POST",
                ...(publishing
                    ? {
                        body: JSON.stringify({
                            title: true,
                            description: true,
                            images: true,
                            variants: true,
                            tags: true,
                            keyFeatures: true,
                            shipping_template: true
                        })
                    }
                    : {})
            }
        );

        showNotice("Printify received the request. Refreshing products...");

        await loadProducts();

    } catch (error) {
        showNotice(error.message, true);
    }
}

/* =========================
   ELIMINAZIONE
========================= */

async function deleteProduct(product) {
    if (!confirm(
        `Permanently delete "${product.title}" from Printify?`
    )) {
        return;
    }

    try {
        await api(
            `/admin/products/${encodeURIComponent(product.id)}`,
            {
                method: "DELETE"
            }
        );

        showNotice("Product deleted.");

        await loadProducts();

    } catch (error) {
        showNotice(error.message, true);
    }
}

$("#product-filter").addEventListener("input", renderProducts);

$("#refresh-products").addEventListener("click", loadProducts);

/* =========================
   ORDINI
========================= */

async function loadOrders() {
    $("#orders-list").innerHTML =
        "<p class='muted'>Loading orders...</p>";

    try {
        const data = await api("/admin/orders");

        orders = getItems(data);

        renderOrders();

        $("#stat-orders").textContent = orders.length;

    } catch (error) {
        $("#orders-list").textContent = error.message;
    }
}

function renderOrders() {
    const list = $("#orders-list");

    list.replaceChildren();

    if (!orders.length) {
        list.textContent = "No orders found.";
        return;
    }

    orders.forEach(order => {
        const row = document.createElement("article");
        row.className = "order-row";

        const info = document.createElement("div");
        info.className = "order-info";

        const title = document.createElement("strong");

        title.textContent =
            `Order ${order.number || order.id}`;

        const detail = document.createElement("small");

        detail.textContent =
            `${order.status || "Status unavailable"} · ${order.created_at || ""}`;

        info.append(title, detail);

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const details = document.createElement("button");
        details.textContent = "DETAILS";

        details.addEventListener("click", () => {
            showOrderDetails(order);
        });

        actions.append(details);

        if (
            ["on-hold", "payment-not-received"].includes(order.status)
        ) {
            const send = document.createElement("button");

            send.textContent = "SEND TO PRODUCTION";

            send.addEventListener("click", () => {
                sendOrder(order);
            });

            actions.append(send);
        }

        row.append(info, actions);

        list.append(row);
    });
}

async function showOrderDetails(order) {
    try {
        const details = await api(
            `/admin/orders/${encodeURIComponent(order.id)}`
        );

        alert(JSON.stringify(details, null, 2));

    } catch (error) {
        showNotice(error.message, true);
    }
}

async function sendOrder(order) {
    if (!confirm(
        `Send order ${order.number || order.id} to production?`
    )) {
        return;
    }

    try {
        await api(
            `/admin/orders/${encodeURIComponent(order.id)}/send-to-production`,
            {
                method: "POST"
            }
        );

        showNotice("Order sent to Printify.");

        await loadOrders();

    } catch (error) {
        showNotice(error.message, true);
    }
}

$("#refresh-orders").addEventListener("click", loadOrders);

/* =========================
   HOMEPAGE
========================= */

async function loadHomepageSettings() {
    try {
        const settings = await api("/settings");

        $("#announcement").value =
            settings.announcement || "";

        $("#hero-title").value =
            settings.heroTitle || "";

        $("#hero-text").value =
            settings.heroText || "";

        $("#featured-products").value =
            (settings.featuredProducts || []).join(", ");

    } catch (error) {
        showNotice(error.message, true);
    }
}

$("#homepage-form").addEventListener("submit", async event => {
    event.preventDefault();

    const settings = {
        announcement: $("#announcement").value.trim(),

        heroTitle: $("#hero-title").value.trim(),

        heroText: $("#hero-text").value.trim(),

        featuredProducts: $("#featured-products").value
            .split(",")
            .map(id => id.trim())
            .filter(Boolean)
    };

    try {
        await api("/admin/settings", {
            method: "PUT",
            body: JSON.stringify(settings)
        });

        showNotice("Homepage settings saved.");

    } catch (error) {
        showNotice(error.message, true);
    }
});

/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {
    await Promise.allSettled([
        loadProducts(),
        loadOrders()
    ]);
}

/* =========================
   AVVIO
========================= */

checkSession();
