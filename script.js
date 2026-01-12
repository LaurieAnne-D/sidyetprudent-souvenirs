// Smooth scroll to targets
document.querySelectorAll('[data-scroll-to]').forEach(btn => {
    btn.addEventListener('click', e => {
        const target = document.querySelector(btn.dataset.scrollTo);
        if (target) { target.scrollIntoView({ behavior: 'smooth' }) }
    });
});

// Animations au scroll (IntersectionObserver)
// - .reveal + variante (.reveal-up / .reveal-left / .reveal-right / .reveal-zoom / .reveal-wipe)
// - data-stagger="80" sur un conteneur pour décaler les enfants .reveal (cascade)
// - data-reveal-once sur un élément pour ne l'animer qu'une seule fois

(() => {
    // Accessibilité : si l'utilisateur réduit les animations, on affiche tout
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
        return;
    }

    // Cascade automatique
    document.querySelectorAll('[data-stagger]').forEach(container => {
        const step = parseInt(container.getAttribute('data-stagger'), 10) || 80; // ms
        container.querySelectorAll('.reveal').forEach((el, i) => {
            el.style.setProperty('--delay', (i * step) + 'ms');
        });
    });

    // Observer
    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const el = entry.target;
            const once = el.hasAttribute('data-reveal-once');
            if (entry.isIntersecting) {
                el.classList.add('is-in');
                if (once) io.unobserve(el);
            } else {
                if (!once) el.classList.remove('is-in');
            }
        }
    }, {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.15
    });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ----------------------------------------------------
    3. COMPTEUR "MARIÉS DEPUIS..." (COUNT UP)
      ---------------------------------------------------- */
function initCountUp() {
    const container = document.getElementById('count-up');
    if (!container) return;

    // Date cible récupérée depuis l'attribut data-date
    const targetDate = new Date(container.dataset.date).getTime();

    // Éléments DOM
    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMins = document.getElementById('cd-mins');
    const elSecs = document.getElementById('cd-secs');

    function update() {
        const now = new Date().getTime();
        const distance = now - targetDate; // Positif car la date est passée

        if (distance < 0) {
            // Si la date est future (ex: test), on affiche 0
            if (elDays) elDays.innerText = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (elDays) elDays.innerText = days < 10 ? '0' + days : days;
        if (elHours) elHours.innerText = hours < 10 ? '0' + hours : hours;
        if (elMins) elMins.innerText = minutes < 10 ? '0' + minutes : minutes;
        if (elSecs) elSecs.innerText = seconds < 10 ? '0' + seconds : seconds;
    }

    setInterval(update, 1000);
    update();
}

// Lancement du compteur
initCountUp();


// FAQ <details> — ouverture/fermeture fluides, robustes (sans toggle natif)
(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Option : true => un seul panneau ouvert à la fois
    const onlyOneOpen = false;

    const items = document.querySelectorAll('.faq-item');
    items.forEach((details) => {
        const summary = details.querySelector('summary');
        const panel = details.querySelector('.faq-content');
        if (!summary || !panel) return;

        let animating = false;

        // État initial si <details open> présent au chargement
        if (details.hasAttribute('open')) {
            panel.style.height = 'auto';
            panel.classList.add('is-open');
        } else {
            panel.style.height = '0px';
            panel.classList.remove('is-open');
        }

        summary.addEventListener('click', (e) => {
            // Empêche le toggle natif (qui cause les glitches)
            e.preventDefault();
            if (animating) return;

            const isOpen = details.hasAttribute('open');
            if (isOpen) {
                close(details, panel);
            } else {
                if (onlyOneOpen) {
                    // Ferme les autres d'abord
                    items.forEach((other) => {
                        if (other !== details && other.hasAttribute('open')) {
                            const otherPanel = other.querySelector('.faq-content');
                            if (otherPanel) close(other, otherPanel);
                        }
                    });
                }
                open(details, panel);
            }
        });

        function open(el, panelEl) {
            animating = true;
            el.classList.add('is-animating');

            // pose l'état "ouvert" pour l'accessibilité/ARIA
            el.setAttribute('open', '');

            // 0 -> hauteur finale
            panelEl.classList.add('is-open');
            panelEl.style.height = '0px';
            panelEl.style.opacity = '0';
            requestAnimationFrame(() => {
                panelEl.style.height = panelEl.scrollHeight + 'px';
                panelEl.style.opacity = '1';
            });

            const onEnd = (ev) => {
                if (ev.propertyName !== 'height') return;
                panelEl.style.height = 'auto'; // fige ouvert
                el.classList.remove('is-animating');
                panelEl.removeEventListener('transitionend', onEnd);
                animating = false;
            };
            panelEl.addEventListener('transitionend', onEnd);
        }

        function close(el, panelEl) {
            animating = true;
            el.classList.add('is-animating');

            // auto -> valeur fixe -> 0
            panelEl.style.height = panelEl.scrollHeight + 'px';
            panelEl.style.opacity = '1';
            // force reflow
            // eslint-disable-next-line no-unused-expressions
            panelEl.offsetHeight;

            requestAnimationFrame(() => {
                panelEl.style.height = '0px';
                panelEl.style.opacity = '0';
                panelEl.classList.remove('is-open');
            });

            const onEnd = (ev) => {
                if (ev.propertyName !== 'height') return;
                el.removeAttribute('open'); // on ferme réellement à la fin
                el.classList.remove('is-animating');
                panelEl.removeEventListener('transitionend', onEnd);
                animating = false;
            };
            panelEl.addEventListener('transitionend', onEnd);
        }
    });
})();

// ===== Config WhatsApp =====
const WA_NUMBER = "590690912416"; // format international SANS +

// ===== Modale RSVP =====
(() => {
    const modal = document.getElementById('rsvp-modal');
    const openBtn = document.getElementById('rsvp-open');
    const closeEls = modal?.querySelectorAll('[data-close]');
    const form = document.getElementById('rsvp-form');
    const inputName = document.getElementById('rsvp-name');
    const messageField = document.getElementById('rsvp-message');

    if (!modal || !openBtn || !form) return;

    let lastFocus = null;

    function openModal() {
        lastFocus = document.activeElement;
        modal.classList.remove('is-closing');
        modal.classList.add('is-open');     // déclenche les transitions CSS
        // focus champ
        setTimeout(() => inputName?.focus({ preventScroll: true }), 0);
        document.addEventListener('keydown', onKey);
        document.addEventListener('focus', trapFocus, true);
    }


    function closeModal() {
        // on lance l’anim inverse puis on nettoie à la fin
        modal.classList.add('is-closing');
        modal.classList.remove('is-open');

        const dialog = modal.querySelector('.modal__dialog');
        const overlay = modal.querySelector('.modal__overlay');
        let ended = 0;
        const done = () => {
            ended++;
            if (ended < 2) return; // attendre fin overlay + boîte
            modal.classList.remove('is-closing');
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('focus', trapFocus, true);
            lastFocus?.focus?.();
        };

        dialog?.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'transform' || e.propertyName === 'opacity') done();
        }, { once: true });

        overlay?.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'opacity') done();
        }, { once: true });
    }

    function onKey(e) {
        if (e.key === 'Escape') closeModal();
    }

    function trapFocus(e) {
        if (modal.getAttribute('aria-hidden') === 'true') return;
        if (!modal.contains(e.target)) {
            e.stopPropagation();
            modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
        }
    }

    openBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    closeEls?.forEach(el => el.addEventListener('click', closeModal));
    modal.querySelector('.modal__overlay')?.addEventListener('click', closeModal);

    // Envoi WhatsApp
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (inputName.value || '').trim();
        const msg = (messageField?.value || '').trim();
        if (!name || !msg) return;

        const text = encodeURIComponent(`Livre d'or\nCoucou Prudent & Sidonie\n${msg}.\n${name}.`);
        const url = `https://wa.me/${WA_NUMBER}?text=${text}`;
        window.open(url, '_blank', 'noopener');
        closeModal();
    });
})();
