// =========================================================
// MD-DESIGN: التفاعلات المشتركة بين الصفحات
// =========================================================

// رقم واتساب: غيّره من هنا بس، بالصيغة الدولية بدون + وبدون صفر البداية
const WHATSAPP = "966559333976";

(function () {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // روابط واتساب المباشرة (تبقى على صفحة الطلب لو تعطل السكربت)
    const waText = encodeURIComponent("السلام عليكم، أرغب في الاستفسار عن تصميم موقع.");
    document.querySelectorAll("[data-wa]").forEach(a => {
        a.href = "https://wa.me/" + WHATSAPP + "?text=" + waText;
        a.target = "_blank";
        a.rel = "noopener";
    });

    // الهيدر: خط سفلي بعد ما ينزل الزائر
    const header = document.querySelector("[data-header]");
    const onScrollHeader = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });

    // قائمة الجوال
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    if (toggle && menu) {
        const label = toggle.querySelector(".sr-only");
        const setOpen = open => {
            toggle.setAttribute("aria-expanded", String(open));
            if (label) label.textContent = open ? "إغلاق القائمة" : "فتح القائمة";
            root.classList.toggle("menu-open", open);
            if (open) {
                menu.hidden = false;
                requestAnimationFrame(() => menu.setAttribute("data-open", ""));
                const first = menu.querySelector("a");
                if (first) first.focus();
            } else {
                menu.removeAttribute("data-open");
                setTimeout(() => { if (!menu.hasAttribute("data-open")) menu.hidden = true; }, reduceMotion ? 0 : 450);
            }
        };
        toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
        menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setOpen(false);
                toggle.focus();
            }
        });
        window.addEventListener("resize", () => {
            if (window.innerWidth > 960 && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
        });
    }

    // الظهور التدريجي أثناء التمرير
    const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
    reveals.forEach(el => {
        const siblings = Array.from(el.parentElement.children).filter(c => c.hasAttribute("data-reveal"));
        el.style.setProperty("--d", Math.min(siblings.indexOf(el), 5) * 90 + "ms");
    });
    if (reduceMotion) {
        reveals.forEach(el => el.classList.add("is-in"));
    } else {
        // أي عنصر وصل له الزائر أو تجاوزه يظهر، حتى لو قفز للأسفل مرة وحدة (رابط أو زر End)
        let pending = reveals.slice();
        let ticking = false;
        const sweep = () => {
            ticking = false;
            const line = window.innerHeight * 0.92;
            pending = pending.filter(el => {
                if (el.getBoundingClientRect().top < line) {
                    el.classList.add("is-in");
                    return false;
                }
                return true;
            });
            if (!pending.length) {
                window.removeEventListener("scroll", queue);
                window.removeEventListener("resize", queue);
            }
        };
        const queue = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(sweep);
            }
        };
        window.addEventListener("scroll", queue, { passive: true });
        window.addEventListener("resize", queue);
        window.addEventListener("load", queue);
        queue();
    }

    // مجموعة الشاشات في الواجهة: عمق خفيف يتبع الماوس
    const stack = document.querySelector("[data-stack]");
    if (stack && finePointer && !reduceMotion) {
        const hero = stack.closest("section") || stack;
        let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
        const tick = () => {
            x += (tx - x) * 0.08;
            y += (ty - y) * 0.08;
            stack.style.setProperty("--px", x.toFixed(3));
            stack.style.setProperty("--py", y.toFixed(3));
            raf = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
        };
        hero.addEventListener("pointermove", e => {
            const r = stack.getBoundingClientRect();
            tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)));
            ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
            if (!raf) raf = requestAnimationFrame(tick);
        });
        hero.addEventListener("pointerleave", () => {
            tx = 0; ty = 0;
            if (!raf) raf = requestAnimationFrame(tick);
        });
    }

    // الشاشات اللي تتصفح الموقع كامل داخل إطارها
    const screens = Array.from(document.querySelectorAll("[data-scroll-screen]"));
    const measure = screen => {
        const img = screen.querySelector("img");
        if (!img) return;
        const travel = Math.max(0, img.getBoundingClientRect().height - screen.getBoundingClientRect().height);
        screen.style.setProperty("--travel", travel.toFixed(0));
        screen.style.setProperty("--dur", Math.max(2.4, Math.min(11, travel / 300)).toFixed(2) + "s");
    };
    screens.forEach(screen => {
        const img = screen.querySelector("img");
        if (img && !img.complete) img.addEventListener("load", () => measure(screen), { once: true });
        measure(screen);
    });
    window.addEventListener("resize", () => screens.forEach(measure));

    if (!reduceMotion) {
        if (finePointer) {
            screens.forEach(screen => {
                const frame = screen.closest(".piece__frame") || screen;
                const on = () => { measure(screen); screen.classList.add("is-scrolling"); };
                const off = () => screen.classList.remove("is-scrolling");
                frame.addEventListener("mouseenter", on);
                frame.addEventListener("mouseleave", off);
                frame.addEventListener("focus", on);
                frame.addEventListener("blur", off);
            });
        } else if ("IntersectionObserver" in window) {
            // على الجوال: تتصفح مرة وحدة لما تظهر الشاشة، وترجع لأولها
            const seen = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const screen = entry.target;
                    seen.unobserve(screen);
                    measure(screen);
                    setTimeout(() => {
                        screen.classList.add("is-scrolling");
                        const dur = parseFloat(getComputedStyle(screen).getPropertyValue("--dur")) || 3;
                        setTimeout(() => screen.classList.remove("is-scrolling"), dur * 1000 + 1400);
                    }, 500);
                });
            }, { threshold: 0.6 });
            screens.forEach(s => seen.observe(s));
        }
    }

    // خط مراحل التنفيذ يتعبى مع التمرير
    const steps = document.querySelector("[data-steps]");
    if (steps) {
        const items = Array.from(steps.querySelectorAll(".step"));
        let ticking = false;
        const update = () => {
            ticking = false;
            const r = steps.getBoundingClientRect();
            const vh = window.innerHeight;
            const p = reduceMotion ? 1 : Math.max(0, Math.min(1, (vh * 0.72 - r.top) / (r.height * 0.9)));
            steps.style.setProperty("--p", p.toFixed(3));
            items.forEach((item, i) => item.classList.toggle("is-on", p >= i / Math.max(1, items.length - 1) - 0.02));
        };
        update();
        window.addEventListener("scroll", () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        window.addEventListener("resize", update);
    }

    // المؤشر المخصص (كمبيوتر فقط)
    const cursor = document.querySelector("[data-cursor-el]");
    if (cursor && finePointer && !reduceMotion) {
        root.classList.add("has-cursor");
        let cx = -100, cy = -100, x = -100, y = -100, running = false;
        const loop = () => {
            x += (cx - x) * 0.22;
            y += (cy - y) * 0.22;
            cursor.style.setProperty("--cx", x.toFixed(1) + "px");
            cursor.style.setProperty("--cy", y.toFixed(1) + "px");
            if (Math.abs(cx - x) > 0.1 || Math.abs(cy - y) > 0.1) requestAnimationFrame(loop);
            else running = false;
        };
        window.addEventListener("pointermove", e => {
            cx = e.clientX; cy = e.clientY;
            cursor.classList.add("is-active");
            if (!running) { running = true; requestAnimationFrame(loop); }
        }, { passive: true });
        document.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
        document.querySelectorAll('[data-cursor="view"]').forEach(el => {
            el.addEventListener("mouseenter", () => cursor.classList.add("is-view"));
            el.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
        });
    }
})();
