
const API = "https://miru-api.briottia.workers.dev";

let token = sessionStorage.getItem("miru_admin_token") || "";
let products = [];
let orders = [];

const $ = selector => document.querySelector(selector);

function showNotice(message, isError = false) {
    const notice = $("#notice");
    notice.textContent = message;
    notice.classList.remove("hidden", "error-notice");
    if (isError) notice.classList.add("error-notice");

    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => {
        notice.classList.add("hidden");
    }, 5000);
}

async function api(path, options = {}) {
    const response = await fetch(API + path, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.body ? { "Content-Type": "application/json" } : {})
        }
    });

    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { error: text || "Risposta non valida dal server." };
    }

    if (!response.ok) {
        throw new Error(data.error || `Errore ${response.status}`);
    }

    return data;
}

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
            headers: { Authorization: `Bearer ${token}` }
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
        const result = await fetch(API + "/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        const data = await result.json();

        if (!result.ok) {
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

function openPage(name) {
    document.querySelectorAll(".admin-page").forEach(page => {
        page.classList.toggle("active", page.id === `page-${name}`);
    });

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle("active", button.dataset.page === name);
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
    button.addEventListener("click", () => openPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.go));
});

function getItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.orders)) return data.orders;
    return [];
}

async function loadProducts() {
    $("#products-list").innerHTML = "<p class='muted'>Loading products...</p>";

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
        const defaultImage = product.images?.find(item => item.is_default)
            || product.images?.[0];
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
        edit.addEventListener("click", () => editProduct(product));

        const visibility = document.createElement("button");
        visibility.textContent = product.visible === false ? "PUBLISH" : "UNPUBLISH";
        visibility.addEventListener("click", () => toggleProduct(product));

        const remove = document.createElement("button");
        remove.textContent = "DELETE";
        remove.className = "danger";
        remove.addEventListener("click", () => deleteProduct(product));

        actions.append(edit, visibility, remove);
        row.append(image, info, actions);
        list.append(row);
    });
}

async function editProduct(product) {
    const title = prompt("Product title:", product.title || "");
    if (title === null) return;

    const description = prompt(
        "Product description:",
        product.description || ""
    );
    if (description === null) return;

    try {
        await api(`/admin/products/${encodeURIComponent(product.id)}`, {
            method: "PUT",
            body: JSON.stringify({ title, description })
        });

        showNotice("Product updated.");
        await loadProducts();
    } catch (error) {
        showNotice(error.message, true);
    }
}

async function toggleProduct(product) {
    const publishing = product.visible === false;

    if (!confirm(
        publishing
            ? `Publish "${product.title}"?`
            : `Unpublish "${product.title}"?`
    )) return;

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

async function deleteProduct(product) {
    if (!confirm(
        `Permanently delete "${product.title}" from Printify?`
    )) return;

    try {
        await api(`/admin/products/${encodeURIComponent(product.id)}`, {
            method: "DELETE"
        });

        showNotice("Product deleted.");
        await loadProducts();
    } catch (error) {
        showNotice(error.message, true);
    }
}

$("#product-filter").addEventListener("input", renderProducts);
$("#refresh-products").addEventListener("click", loadProducts);

async function loadOrders() {
    $("#orders-list").innerHTML = "<p class='muted'>Loading orders...</p>";

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
        title.textContent = `Order ${order.number || order.id}`;

        const detail = document.createElement("small");
        detail.textContent =
            `${order.status || "Status unavailable"} · ${order.created_at || ""}`;

        info.append(title, detail);

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const details = document.createElement("button");
        details.textContent = "DETAILS";
        details.addEventListener("click", () => showOrderDetails(order));

        actions.append(details);

        if (["on-hold", "payment-not-received"].includes(order.status)) {
            const send = document.createElement("button");
            send.textContent = "SEND TO PRODUCTION";
            send.addEventListener("click", () => sendOrder(order));
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
    if (!confirm(`Send order ${order.number || order.id} to production?`)) {
        return;
    }

    try {
        await api(
            `/admin/orders/${encodeURIComponent(order.id)}/send-to-production`,
            { method: "POST" }
        );

        showNotice("Order sent to Printify.");
        await loadOrders();
    } catch (error) {
        showNotice(error.message, true);
    }
}

$("#refresh-orders").addEventListener("click", loadOrders);

async function loadHomepageSettings() {
    try {
        const settings = await api("/settings");

        $("#announcement").value = settings.announcement || "";
        $("#hero-title").value = settings.heroTitle || "";
        $("#hero-text").value = settings.heroText || "";
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

async function loadDashboard() {
    await Promise.allSettled([loadProducts(), loadOrders()]);
}

checkSession();
