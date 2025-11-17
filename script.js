// Плавный скролл по якорям
document.addEventListener("click", function (event) {
    const link = event.target.closest("a[href^='#']");
    if (!link) return;

    const targetId = link.getAttribute("href").slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    window.scrollTo({
        top: target.offsetTop - 70,
        behavior: "smooth",
    });
});
