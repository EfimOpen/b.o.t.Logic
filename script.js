// ===== API для отзывов (Google Apps Script) =====
const REVIEWS_API = "https://script.google.com/macros/s/AKfycbw1kblvoyY-y8GHFrNlpaOUE0MCTS9674COAyEbOwD-gTwV5fBVJI7nE42aDa4p7pxatw/exec";

// для сравнения, изменились ли отзывы
let lastReviewsHash = null;


// ===== Плавный скролл по якорям в шапке =====
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


// ===== Загрузка отзывов с Google Sheets =====
async function loadReviews(options = {}) {
    const { highlightFirst = false, isAuto = false } = options;
    const listEl = document.getElementById("reviews-list");
    if (!listEl) return;

    try {
        const resp = await fetch(REVIEWS_API);
        const data = await resp.json();

        if (!Array.isArray(data)) return;

        const hash = JSON.stringify(data);
        if (isAuto && hash === lastReviewsHash) {
            // ничего не изменилось — не перерисовываем
            return;
        }
        lastReviewsHash = hash;

        listEl.innerHTML = "";

        if (data.length === 0) {
            const empty = document.createElement("p");
            empty.className = "section-subtitle";
            empty.textContent = "Пока отзывов нет. Будете первым 🙂";
            listEl.appendChild(empty);
            return;
        }

        data.forEach((r, index) => {
            const name = (r.name || "Клиент").toString();
            const rating = Number(r.rating) || 0;
            const text = (r.text || "").toString();
            const source = (r.source || "").toString();
            const initial = name.trim().charAt(0).toUpperCase() || "•";

            const item = document.createElement("article");
            item.className = "review-item";

            const head = document.createElement("div");
            head.className = "review-head";

            const avatar = document.createElement("div");
            avatar.className = "review-avatar";
            avatar.textContent = initial;

            const meta = document.createElement("div");
            meta.className = "review-meta";

            const nameEl = document.createElement("div");
            nameEl.className = "review-name";
            nameEl.textContent = name;

            const ratingEl = document.createElement("div");
            ratingEl.className = "review-rating";
            ratingEl.textContent = "★".repeat(rating || 0);

            meta.appendChild(nameEl);
            meta.appendChild(ratingEl);

            head.appendChild(avatar);
            head.appendChild(meta);

            const textEl = document.createElement("div");
            textEl.className = "review-text";
            textEl.textContent = text;

            item.appendChild(head);
            item.appendChild(textEl);

            if (source) {
                const sourceEl = document.createElement("div");
                sourceEl.className = "review-source";
                sourceEl.textContent = source === "bot" ? "Отзыв из Telegram-бота" : "Отзыв с сайта";
                item.appendChild(sourceEl);
            }

            // лёгкая анимация появления
            requestAnimationFrame(() => {
                item.classList.add("review-item-visible");
                if (highlightFirst && index === 0) {
                    item.classList.add("review-item-new");
                    setTimeout(() => {
                        item.classList.remove("review-item-new");
                    }, 2500);
                }
            });

            listEl.appendChild(item);
        });
    } catch (err) {
        console.error("Ошибка загрузки отзывов:", err);
    }
}


// ===== Инициализация формы отзыва на сайте =====
function initReviewForm() {
    const form = document.getElementById("review-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const body = {
            name: (formData.get("name") || "").trim(),
            rating: Number(formData.get("rating") || 0),
            text: (formData.get("text") || "").trim(),
            source: "site",
        };

        if (!body.name || !body.text || !body.rating) {
            return;
        }

        try {
            await fetch(REVIEWS_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            form.reset();
            // подгружаем отзывы с подсветкой свежего
            loadReviews({ highlightFirst: true });
        } catch (err) {
            console.error("Ошибка отправки отзыва:", err);
        }
    });
}


// ===== Основная инициализация страницы =====
window.addEventListener("DOMContentLoaded", () => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

    // === Появление блоков при скролле ===
    const revealTargets = document.querySelectorAll(
        ".section, .hero-card, .card, .step, .manager-card, .why-item, .faq-item, .request-card"
    );

    revealTargets.forEach((el) => el.classList.add("reveal"));

    if (!prefersReduced && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("reveal-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        revealTargets.forEach((el) => observer.observe(el));
    } else {
        revealTargets.forEach((el) => el.classList.add("reveal-visible"));
    }

    // === Лёгкий 3D-параллакс для hero-card и manager-card ===
    if (hasFinePointer && !prefersReduced) {
        const tiltConfigs = [
            { element: document.querySelector(".hero-card"), strength: 7 },
            { element: document.querySelector(".manager-card"), strength: 6 },
        ].filter((item) => item.element);

        tiltConfigs.forEach(({ element, strength }) => {
            const computed = window.getComputedStyle(element).transform;
            element.dataset.baseTransform = computed === "none" ? "" : computed;

            const handleMove = (event) => {
                const rect = element.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;

                const rotateX = -y * strength;
                const rotateY = x * strength;

                const base = element.dataset.baseTransform || "";
                element.style.transform =
                    `${base} perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
                element.style.boxShadow = "0 30px 80px rgba(1, 8, 16, 1)";
            };

            const handleLeave = () => {
                const base = element.dataset.baseTransform || "";
                element.style.transform = base;
                element.style.boxShadow = "";
            };

            element.addEventListener("pointermove", handleMove);
            element.addEventListener("pointerleave", handleLeave);
        });
    }

    // === Заявка менеджеру с сайта: открываем чат в Telegram с текстом ===
    const requestForm = document.querySelector(".request-form:not(#review-form)");
    if (requestForm) {
        requestForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(requestForm);
            const name = (formData.get("name") || "").trim() || "Не указано";
            const tg = (formData.get("telegram") || "").trim() || "Не указан";
            const task = (formData.get("task") || "").trim() || "Не описана";
            const budget = (formData.get("budget") || "").trim() || "Не выбран";

            const textLines = [
                "Заявка с сайта b.o.t.logic",
                "",
                `Имя: ${name}`,
                `Telegram: ${tg}`,
                `Ниша и задача: ${task}`,
                `Бюджет: ${budget}`,
            ];

            const message = encodeURIComponent(textLines.join("\n"));
            const url = `https://t.me/Efim_botLogic?text=${message}`;
            window.open(url, "_blank");
        });
    }

    // === Инициализация отзывов ===
    loadReviews();
    initReviewForm();

    // live-обновление отзывов каждые 25 секунд
    setInterval(() => {
        loadReviews({ isAuto: true });
    }, 25000);
});

