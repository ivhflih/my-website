// شريط تجربة الأشكال: دوائر ألوان (زي محلات الملابس) تبدّل ألوان النموذج كله،
// وزر "أبي هذا الشكل" يفتح الطلب السريع في الرئيسية ومعه الشكل واللون.
// كل صفحة تعرّف window.KIT = { style, name, palettes: [{ name, swatch, vars }] }
(function () {
    const kit = window.KIT;
    if (!kit || !kit.palettes || !kit.palettes.length) return;
    const root = document.documentElement;

    const wrap = document.createElement("div");
    wrap.className = "kit";
    wrap.innerHTML =
        '<div class="kit__bar" role="region" aria-label="تجربة ألوان الشكل">' +
            '<a class="kit__back" href="../index.html#styles">كل الأشكال</a>' +
            '<div class="kit__group">' +
                '<span class="kit__label">اللون: <b data-kit-name></b></span>' +
                '<div class="kit__colors" data-kit-colors></div>' +
            '</div>' +
            '<a class="kit__cta" data-kit-cta>أبي هذا الشكل</a>' +
        '</div>';

    const colors = wrap.querySelector("[data-kit-colors]");
    const label = wrap.querySelector("[data-kit-name]");
    const cta = wrap.querySelector("[data-kit-cta]");

    const apply = index => {
        const palette = kit.palettes[index];
        Object.keys(palette.vars).forEach(key => root.style.setProperty(key, palette.vars[key]));
        colors.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
        label.textContent = palette.name;
        cta.href = "../index.html?style=" + encodeURIComponent(kit.name) + "&color=" + encodeURIComponent(palette.name) + "#top";
    };

    kit.palettes.forEach((palette, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "kit__swatch";
        b.style.setProperty("--sw", palette.swatch);
        b.title = palette.name;
        b.innerHTML = '<span class="kit-sr">' + palette.name + "</span>";
        b.addEventListener("click", () => apply(i));
        colors.appendChild(b);
    });

    document.body.appendChild(wrap);
    document.body.classList.add("has-kit");
    apply(0);
})();
