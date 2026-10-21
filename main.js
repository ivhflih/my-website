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

    // الهيدر: خط سفلي بعد ما ينزل الزائر، وشريط التقدم، وزر واتساب العائم بعد الواجهة
    const header = document.querySelector("[data-header]");
    const progress = document.querySelector("[data-progress]");
    const floatBtn = document.querySelector("[data-float]");
    let headTick = false;
    const onScrollHeader = () => {
        headTick = false;
        const y = window.scrollY;
        if (header) header.classList.toggle("is-scrolled", y > 8);
        if (progress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
        }
        if (floatBtn) floatBtn.classList.toggle("is-shown", y > window.innerHeight * 0.7);
    };
    onScrollHeader();
    window.addEventListener("scroll", () => {
        if (!headTick) { headTick = true; requestAnimationFrame(onScrollHeader); }
    }, { passive: true });
    window.addEventListener("resize", onScrollHeader);

    // ألوان الموقع: ليد دايمًا (اللون يدور لحاله)، وزر واحد يقلب بين الفاتح والداكن وينحفظ في متصفح الزائر
    const metaColor = document.querySelector('meta[name="theme-color"]');
    // المتصفح يرجّع اللون المخلوط بصيغ مثل oklch(...) أو color(srgb ...)، وشريط الجوال يبيه #RRGGBB:
    // نرسمه في نقطة وحدة على canvas ونقرا قيمته
    const toHex = value => {
        try {
            const ctx = document.createElement("canvas").getContext("2d");
            ctx.fillStyle = value;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
        } catch (e) {
            return value;
        }
    };

    // ليد: درجة اللون تدور 15 درجة بالثانية (دورة كاملة كل 24 ثانية)، ومحسوبة من الوقت
    // عشان تكمل من نفس اللون لما ينتقل الزائر لصفحة ثانية. تتوقف لو الصفحة مخفية.
    root.setAttribute("data-accent", "led");
    let ledTimer = 0;
    const ledTick = () => root.style.setProperty("--hue", ((Date.now() / 1000 * 15) % 360).toFixed(1));
    const led = () => {
        if (!document.hidden && !ledTimer) {
            ledTick();
            if (!reduceMotion) ledTimer = setInterval(ledTick, 80);
        } else if (document.hidden && ledTimer) {
            clearInterval(ledTimer);
            ledTimer = 0;
        }
    };
    document.addEventListener("visibilitychange", led);
    led();

    const modeBtn = document.querySelector("[data-mode-toggle]");
    const syncMode = () => {
        const dark = root.getAttribute("data-mode") === "dark";
        if (modeBtn) modeBtn.setAttribute("aria-pressed", String(dark));
        // لون شريط المتصفح في الجوال = لون خلفية الصفحة
        if (metaColor) metaColor.content = toHex(getComputedStyle(document.body).backgroundColor);
    };
    if (modeBtn) {
        modeBtn.addEventListener("click", () => {
            const dark = root.getAttribute("data-mode") !== "dark";
            if (dark) root.setAttribute("data-mode", "dark");
            else root.removeAttribute("data-mode");
            try { localStorage.setItem("md-mode", dark ? "dark" : "light"); } catch (e) { /* المتصفح يمنع الحفظ: يشتغل بدون حفظ */ }
            syncMode();
        });
    }
    syncMode();

    // جملة الواجهة تتبدّل كل ثواني (وتوقف لو الصفحة مخفية أو الزائر يفضّل تقليل الحركة)
    const swap = document.querySelector("[data-swap]");
    if (swap && !reduceMotion) {
        const slides = Array.from(swap.children);
        let index = 0, timer = 0;
        const next = () => {
            const prev = slides[index];
            prev.classList.remove("is-on");
            prev.classList.add("is-out");
            setTimeout(() => prev.classList.remove("is-out"), 700);
            index = (index + 1) % slides.length;
            slides[index].classList.add("is-on");
        };
        const start = () => { if (!timer) timer = setInterval(next, 3200); };
        const stop = () => { clearInterval(timer); timer = 0; };
        document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
        setTimeout(start, 1400);
    }

    // القائمة العلوية: مؤشر ينزلق تحت الرابط، ويعلّم القسم اللي يقرأه الزائر
    const nav = document.querySelector(".site-nav");
    if (nav) {
        const links = Array.from(nav.querySelectorAll("a"));
        const pill = document.createElement("span");
        pill.className = "site-nav__pill";
        pill.setAttribute("aria-hidden", "true");
        nav.prepend(pill);

        // الأقسام الموجودة في نفس الصفحة بس (في صفحة الطلب ما فيه أقسام، فيشتغل مع الماوس فقط)
        const targets = links.map(a => {
            const hash = a.getAttribute("href").split("#")[1];
            const onPage = a.pathname === location.pathname || a.getAttribute("href").startsWith("#");
            return hash && onPage ? document.getElementById(hash) : null;
        });
        let active = null;

        const moveTo = link => {
            links.forEach(a => a.classList.toggle("is-current", a === link));
            if (!link) {
                pill.classList.remove("is-on");
                return;
            }
            // إذا كان المؤشر مخفي، يظهر مكانه على طول بدون ما ينزلق من الطرف
            const jump = !pill.classList.contains("is-on");
            pill.classList.toggle("is-jump", jump);
            pill.style.width = link.offsetWidth + "px";
            pill.style.transform = "translateX(" + link.offsetLeft + "px)";
            if (jump) void pill.offsetWidth;
            pill.classList.add("is-on");
            pill.classList.remove("is-jump");
        };

        links.forEach(a => {
            a.addEventListener("mouseenter", () => moveTo(a));
            a.addEventListener("focus", () => moveTo(a));
        });
        nav.addEventListener("mouseleave", () => moveTo(active));
        nav.addEventListener("focusout", e => { if (!nav.contains(e.relatedTarget)) moveTo(active); });

        if (targets.some(Boolean)) {
            let ticking = false;
            const spy = () => {
                ticking = false;
                const line = window.innerHeight * 0.4;
                let current = null;
                targets.forEach((section, i) => {
                    if (section && section.getBoundingClientRect().top < line) current = links[i];
                });
                // بعد آخر قسم (الدعوة والفوتر) يبقى على آخر قسم مرّ عليه
                if (current !== active) {
                    active = current;
                    links.forEach(a => {
                        a.classList.toggle("is-active", a === active);
                        if (a === active) a.setAttribute("aria-current", "true");
                        else a.removeAttribute("aria-current");
                    });
                    if (!nav.matches(":hover") && !nav.contains(document.activeElement)) moveTo(active);
                }
            };
            const queueSpy = () => {
                if (!ticking) {
                    ticking = true;
                    requestAnimationFrame(spy);
                }
            };
            window.addEventListener("scroll", queueSpy, { passive: true });
            window.addEventListener("resize", () => { moveTo(active); queueSpy(); });
            document.fonts && document.fonts.ready.then(() => moveTo(active));
            queueSpy();
        }
    }

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

    // رمز الكود المجسّم: يميل مع الماوس، ويوقف حركته لما يطلع برا الشاشة
    const code3d = document.querySelector("[data-code3d]");
    if (code3d && !reduceMotion) {
        const scene = code3d.querySelector(".code3d__scene");
        if (finePointer) {
            const zone = code3d.closest("section") || code3d;
            zone.addEventListener("pointermove", e => {
                const r = code3d.getBoundingClientRect();
                const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
                const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
                scene.style.setProperty("--ry", (x * 18).toFixed(1) + "deg");
                scene.style.setProperty("--rx", (-y * 14).toFixed(1) + "deg");
            });
            zone.addEventListener("pointerleave", () => {
                scene.style.setProperty("--ry", "0deg");
                scene.style.setProperty("--rx", "0deg");
            });
        }
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(([entry]) => code3d.classList.toggle("is-paused", !entry.isIntersecting)).observe(code3d);
        }
    }

    // نافذة الكود المجسّمة: الكود ينكتب حرف حرف بألوانه، ويعيد من البداية
    const editor = document.querySelector("[data-editor3d]");
    if (editor) {
        const pre = editor.querySelector("[data-type]");
        // كل سطر قطع: [النوع، النص]. k كلمة محجوزة، s نص، t وسم، c تعليق
        const LINES = [
            [["c", "<!-- MD-DESIGN -->"]],
            [["t", "<header>"]],
            [["", "  "], ["t", "<h1>"], ["", "Welcome"], ["t", "</h1>"]],
            [["", "  "], ["t", "<a "], ["k", "class"], ["", "="], ["s", "\"btn\""], ["t", ">"], ["", "Order now"], ["t", "</a>"]],
            [["t", "</header>"]],
            [],
            [["k", "const"], ["", " site = {"]],
            [["", "  speed: "], ["s", "\"fast\""], ["", ","]],
            [["", "  mobile: "], ["k", "true"]],
            [["", "};"]]
        ];
        const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const paint = (line, upto) => {
            let left = upto, html = "";
            for (const [cls, text] of line) {
                if (left <= 0) break;
                const part = esc(text.slice(0, left));
                html += cls ? '<span class="' + cls + '">' + part + "</span>" : part;
                left -= text.length;
            }
            return html;
        };
        const lengthOf = line => line.reduce((n, [, text]) => n + text.length, 0);
        const caret = '<span class="editor3d__caret"></span>';
        const draw = (li, ci) => {
            const rows = LINES.slice(0, li).map(line => paint(line, Infinity));
            if (li < LINES.length) rows.push(paint(LINES[li], ci) + caret);
            else rows[rows.length - 1] += caret;
            pre.innerHTML = rows.join("\n");
        };

        if (reduceMotion) {
            draw(LINES.length, 0);
            editor.classList.add("is-done");
        } else {
            let li = 0, ci = 0, visible = false, timer = 0;
            const tick = () => {
                timer = 0;
                if (!visible) return;
                if (li >= LINES.length) {
                    editor.classList.add("is-done");
                    timer = setTimeout(() => { li = 0; ci = 0; editor.classList.remove("is-done"); tick(); }, 2800);
                    return;
                }
                if (ci < lengthOf(LINES[li])) {
                    ci++;
                    draw(li, ci);
                    timer = setTimeout(tick, 34 + Math.random() * 40);
                } else {
                    li++;
                    ci = 0;
                    draw(li, ci);
                    timer = setTimeout(tick, 200);
                }
            };
            draw(0, 0);
            // يكتب بس وهي ظاهرة على الشاشة
            if ("IntersectionObserver" in window) {
                new IntersectionObserver(([entry]) => {
                    visible = entry.isIntersecting;
                    editor.classList.toggle("is-paused", !visible);
                    if (visible && !timer) tick();
                }).observe(editor);
            } else {
                visible = true;
                tick();
            }
            if (finePointer) {
                const scene = editor.querySelector(".editor3d__scene");
                const zone = editor.closest("section") || editor;
                zone.addEventListener("pointermove", e => {
                    const r = editor.getBoundingClientRect();
                    const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
                    const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
                    scene.style.setProperty("--ry", (x * 16).toFixed(1) + "deg");
                    scene.style.setProperty("--rx", (-y * 12).toFixed(1) + "deg");
                });
                zone.addEventListener("pointerleave", () => {
                    scene.style.setProperty("--ry", "0deg");
                    scene.style.setProperty("--rx", "0deg");
                });
            }
        }
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
            // على الجوال: تتصفح كل ما تظهر الشاشة، وترجع لأولها
            const seen = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    const screen = entry.target;
                    if (!entry.isIntersecting || screen.dataset.busy) return;
                    screen.dataset.busy = "1";
                    measure(screen);
                    setTimeout(() => {
                        screen.classList.add("is-scrolling");
                        const dur = parseFloat(getComputedStyle(screen).getPropertyValue("--dur")) || 3;
                        setTimeout(() => {
                            screen.classList.remove("is-scrolling");
                            setTimeout(() => delete screen.dataset.busy, 1200);
                        }, dur * 1000 + 1400);
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

    // الطلب السريع: أزرار "لنبدأ مشروعك" تفتح نافذة بثلاثة أسئلة، وبدون سكربت تبقى روابط لصفحة الطلب
    const quick = document.getElementById("quick");
    if (quick && typeof quick.showModal === "function") {
        const form = quick.querySelector("[data-quick-form]");
        const error = document.getElementById("quick-error");
        const lead = quick.querySelector("[data-quick-lead]");
        const showError = on => { error.hidden = !on; lead.hidden = on; };
        let opener = null;

        // التنظيف يصير مباشرة عند الإغلاق، وحدث close احتياط لزر Esc
        const cleanup = () => {
            root.classList.remove("quick-open");
            if (opener) {
                opener.focus();
                opener = null;
            }
        };
        const close = () => {
            if (quick.open) quick.close();
            cleanup();
        };
        quick.addEventListener("close", cleanup);
        quick.addEventListener("cancel", () => setTimeout(cleanup, 0));

        const open = from => {
            opener = from;
            showError(false);
            root.classList.add("quick-open");
            quick.showModal();
            const first = form.querySelector('input[name="q-type"]:checked') ? form.querySelector('input[name="q-budget"]') : form.querySelector('input[name="q-type"]');
            if (first) first.focus();
        };

        document.querySelectorAll("[data-quick]").forEach(link => {
            link.addEventListener("click", e => {
                e.preventDefault();
                // خدمة محددة (مطعم، تطوير موقع) تختار النوع تلقائيًا
                const key = link.getAttribute("data-quick");
                if (key) {
                    const match = form.querySelector('input[data-key="' + key + '"]');
                    if (match) match.checked = true;
                }
                open(link);
            });
        });

        // جاء من صفحة شكل (زر "أبي هذا الشكل"): نفتح الطلب والشكل واللون مكتوبين فيه
        const STYLES = ["ثلاثي الأبعاد", "فاخر وأنيق", "بسيط ونظيف", "جريء وملوّن"];
        const params = new URLSearchParams(location.search);
        const style = params.get("style");
        const color = params.get("color") || "";
        const picked = quick.querySelector("[data-quick-picked]");
        let chosen = "";
        if (STYLES.includes(style)) {
            chosen = style + (/^[؀-ۿ ]{1,20}$/.test(color) ? " (اللون: " + color + ")" : "");
            picked.textContent = "الشكل المختار: " + chosen;
            picked.hidden = false;
            open(null);
        }

        quick.querySelector("[data-quick-close]").addEventListener("click", close);
        // الضغط خارج النافذة يقفلها
        quick.addEventListener("click", e => { if (e.target === quick) close(); });
        form.addEventListener("change", () => showError(false));

        form.addEventListener("submit", e => {
            e.preventDefault();
            const pick = name => {
                const el = form.querySelector('input[name="' + name + '"]:checked');
                return el ? el.value : "";
            };
            const type = pick("q-type"), budget = pick("q-budget"), time = pick("q-time");
            if (!type || !budget || !time) {
                showError(true);
                const missing = form.querySelector('input[name="' + (!type ? "q-type" : !budget ? "q-budget" : "q-time") + '"]');
                if (missing) missing.focus();
                return;
            }
            const name = document.getElementById("q-name").value.trim();
            const lines = [
                "السلام عليكم، أرغب في تصميم موقع:",
                "",
                "نوع الموقع: " + type,
                "الميزانية: " + budget,
                "موعد التسليم: " + time
            ];
            if (chosen) lines.push("الشكل: " + chosen);
            if (name) lines.push("الاسم: " + name);
            window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
            close();
        });
    }
})();
