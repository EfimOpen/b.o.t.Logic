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

// Анимация появления блоков при прокрутке
window.addEventListener("DOMContentLoaded", () => {
    const revealTargets = document.querySelectorAll(
        ".section, .hero-card, .card, .step, .manager-card, .feature, .faq-item"
    );

    // добавляем базовый класс, который прячет элементы
    revealTargets.forEach((el) => {
        el.classList.add("reveal");
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
        }
    );

    revealTargets.forEach((el) => observer.observe(el));
});

