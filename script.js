const menuToggle = document.querySelector("#menu-toggle");
const mainNav = document.querySelector("#main-nav");

menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu"
    );
});

// Chiude il menu dopo aver selezionato una voce
mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open menu");
    });
});