/* ==========================================================================
   PersonalSoft · Deck digital
   Depende de: Swiper 11, GSAP 3 (+ ScrollTrigger, ScrollToPlugin)
   ========================================================================== */
(() => {
    'use strict';

    // ---------------------------------------------------------------------
    // Utilidades y estado
    // ---------------------------------------------------------------------
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    const MOBILE_MQ = window.matchMedia('(max-width: 768px)');
    const HOVER_MQ = window.matchMedia('(hover: hover) and (pointer: fine)');
    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = () => MOBILE_MQ.matches;
    const hasGsap = () => typeof window.gsap !== 'undefined';

    const SECTION_IDS = [
        'slider-section',
        'service-container-1',
        'service-container-2',
        'service-container-3',
        'service-container-4',
        'commercial-card-section'
    ];

    const state = {
        introDone: false,
        swiper: null,
        autoplayPaused: false,
        navigating: false,
        snapping: false,
        ytPlayer: null,
        muted: true,
        lastFocus: null
    };

    // ---------------------------------------------------------------------
    // Plataforma y alto de viewport
    // ---------------------------------------------------------------------
    function detectPlatform() {
        const ua = navigator.userAgent;
        const root = document.documentElement;
        if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
            root.classList.add('is-ipad');
        }

        // Navegadores sin unidades dvh/svh: calcular el alto real una vez por cambio de tamaño
        if (!CSS.supports('height', '100svh')) {
            const setH = () => root.style.setProperty('--app-height', `${window.innerHeight}px`);
            setH();
            window.addEventListener('resize', setH, { passive: true });
            window.addEventListener('orientationchange', setH, { passive: true });
        }
    }

    // ---------------------------------------------------------------------
    // Navegación entre secciones
    // ---------------------------------------------------------------------
    const getSections = () => SECTION_IDS
        .map(id => document.getElementById(id))
        .filter(el => el && el.offsetParent !== null);

    function scrollToElement(el, duration = 0.7) {
        const y = el.getBoundingClientRect().top + window.scrollY;
        if (hasGsap() && window.ScrollToPlugin && !REDUCED_MOTION) {
            gsap.killTweensOf(window);
            return new Promise(resolve => {
                gsap.to(window, { duration, scrollTo: { y, autoKill: false }, ease: 'power2.inOut', onComplete: resolve });
            });
        }
        window.scrollTo({ top: y, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
        return new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    function navigateTo(targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;
        if (targetId !== 'slider-section') state.swiper?.autoplay?.stop();
        state.navigating = true;
        scrollToElement(target).then(() => { state.navigating = false; });
    }

    // Snap por rueda del ratón (escritorio). Si la sección es más alta que la
    // pantalla, se deja el scroll nativo hasta llegar a su borde.
    function initWheelSnap() {
        let cooldownUntil = 0;

        const currentIndex = sections => {
            const marker = window.innerHeight * 0.4;
            let idx = 0;
            sections.forEach((sec, i) => { if (sec.getBoundingClientRect().top <= marker) idx = i; });
            return idx;
        };

        window.addEventListener('wheel', e => {
            if (isMobile() || !state.introDone || e.ctrlKey) return;
            if (document.body.classList.contains('no-scroll')) return;

            if (state.snapping || state.navigating || performance.now() < cooldownUntil) {
                e.preventDefault();
                return;
            }

            const dir = Math.sign(e.deltaY);
            if (!dir) return;

            const sections = getSections();
            const idx = currentIndex(sections);
            const rect = sections[idx].getBoundingClientRect();

            if (dir > 0 && rect.bottom > window.innerHeight + 2) return;
            if (dir < 0 && rect.top < -2) return;

            const next = sections[idx + dir];
            if (!next) return;

            e.preventDefault();
            state.snapping = true;
            scrollToElement(next, 0.6).then(() => {
                state.snapping = false;
                cooldownUntil = performance.now() + 350;
            });
        }, { passive: false });
    }

    // Resalta la sección activa en el menú flotante y en la barra inferior
    function initActiveSectionTracking(getItems) {
        let ticking = false;

        const update = () => {
            ticking = false;
            const marker = window.innerHeight * 0.35;
            let activeId = null;
            for (const sec of getSections()) {
                const r = sec.getBoundingClientRect();
                if (r.top <= marker && r.bottom > marker) { activeId = sec.id; break; }
            }
            getItems().forEach(item => {
                const isActive = item.dataset.target === activeId;
                item.classList.toggle(item.dataset.activeClass, isActive);
                if (isActive) item.setAttribute('aria-current', 'true');
                else item.removeAttribute('aria-current');
            });
        };

        const onScroll = () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return update;
    }

    // ---------------------------------------------------------------------
    // Menú flotante (tablet / escritorio) y barra inferior (móvil)
    // ---------------------------------------------------------------------
    function buildFloatingMenu(deckUrl) {
        const items = [
            ['slider-section', 'fa-house', 'Home'],
            ['service-container-1', 'fa-laptop-code', 'Soluciones en Desarrollo'],
            ['service-container-2', 'fa-robot', 'Automatización'],
            ['service-container-3', 'fa-database', 'Gestión de Datos'],
            ['service-container-4', 'fa-industry', 'Modelos de Entrega'],
            ['commercial-card-section', 'fa-envelope', 'Contacto']
        ];

        const nav = document.createElement('nav');
        nav.id = 'floating-service-menu';
        nav.className = 'fsm-hidden';
        nav.setAttribute('aria-label', 'Menú de servicios');

        const li = (inner) => `<li>${inner}</li>`;
        const content = (icon, label) =>
            `<span class="fsm-icon"><i class="fa-solid ${icon}"></i></span><span class="fsm-tooltip">${label}</span>`;

        nav.innerHTML = `<ul>${items.map(([target, icon, label]) => li(
            `<button type="button" class="fsm-item" data-target="${target}" data-active-class="fsm-item--active" aria-label="${label}">${content(icon, label)}</button>`
        )).join('')}${deckUrl ? li(
            `<a class="fsm-item" href="${deckUrl}" target="_blank" rel="noopener" aria-label="Descargar Deck">${content('fa-download', 'Descargar Deck')}</a>`
        ) : ''}</ul>`;

        nav.addEventListener('click', e => {
            const btn = e.target.closest('button.fsm-item');
            if (btn) navigateTo(btn.dataset.target);
        });

        document.body.appendChild(nav);
        return nav;
    }

    function initNavigation() {
        const deckLink = $('.js-deck-link');
        const fsm = buildFloatingMenu(deckLink ? deckLink.href : '');

        const bottomItems = $$('.bottom-app-nav__item');
        bottomItems.forEach(a => {
            a.dataset.target = a.getAttribute('href').slice(1);
            a.dataset.activeClass = 'is-active';
        });

        // Enlaces internos (barra inferior) y botones "Descubre más"
        document.addEventListener('click', e => {
            const link = e.target.closest('[data-nav]');
            if (link) {
                e.preventDefault();
                navigateTo(link.dataset.target);
                return;
            }
            const discover = e.target.closest('.discover-btn[data-target]');
            if (discover) navigateTo(discover.dataset.target);
        });

        const refreshActive = initActiveSectionTracking(() => [...$$('.fsm-item[data-target]', fsm), ...bottomItems]);

        return {
            show() {
                fsm.classList.remove('fsm-hidden');
                refreshActive();
            }
        };
    }

    // ---------------------------------------------------------------------
    // Intro con video de YouTube (solo tablet / escritorio)
    // ---------------------------------------------------------------------
    function initIntro(onDone) {
        const intro = $('#intro-section');
        const iframe = $('#intro-video');
        const audioBtn = $('#audio-toggle-btn');
        const audioIcon = $('#audio-icon');

        const reveal = () => {
            intro.classList.add('hidden');
            iframe.removeAttribute('src'); // detiene el video y libera recursos
            $('#slider-section').classList.add('active');
            onDone();
        };

        const skip = (instant = false) => {
            if (state.introDone) return;
            state.introDone = true;
            document.body.classList.add('intro-complete');
            try { state.ytPlayer?.pauseVideo?.(); } catch (_) { /* sin API */ }

            if (instant || !hasGsap() || REDUCED_MOTION) { reveal(); return; }

            const circle = $('#circular-transition');
            const size = Math.hypot(window.innerWidth, window.innerHeight) * 2;
            gsap.to(['#skip-intro-btn', '#audio-toggle-btn'], { opacity: 0, duration: 0.3 });
            gsap.set(circle, { opacity: 1, visibility: 'visible' });
            gsap.to(circle, {
                width: size,
                height: size,
                duration: 1,
                ease: 'power2.inOut',
                onComplete: () => {
                    reveal();
                    gsap.set(circle, { width: 100, height: 100, opacity: 0, visibility: 'hidden' });
                }
            });
        };

        // En móvil no hay intro
        if (isMobile()) { skip(true); return; }

        // Si la ventana pasa a tamaño móvil durante la intro, saltarla (antes quedaba la página en blanco)
        MOBILE_MQ.addEventListener('change', e => { if (e.matches) skip(true); });

        const origin = /^https?:/.test(location.protocol) ? `&origin=${encodeURIComponent(location.origin)}` : '';
        iframe.src = iframe.dataset.src + origin;

        window.onYouTubeIframeAPIReady = () => {
            state.ytPlayer = new YT.Player('intro-video', {
                events: {
                    onReady: e => { e.target.mute(); e.target.playVideo(); },
                    onStateChange: e => { if (e.data === YT.PlayerState.ENDED) skip(); }
                }
            });
        };
        const api = document.createElement('script');
        api.src = 'https://www.youtube.com/iframe_api';
        api.async = true;
        document.head.appendChild(api);

        $('#skip-intro-btn').addEventListener('click', () => skip());

        audioBtn.addEventListener('click', e => {
            e.stopPropagation();
            const player = state.ytPlayer;
            if (!player || typeof player.mute !== 'function') return;
            state.muted = !state.muted;
            if (state.muted) {
                player.mute();
            } else {
                player.unMute();
                player.setVolume(100);
                player.playVideo();
            }
            audioIcon.className = `fa-solid ${state.muted ? 'fa-volume-xmark' : 'fa-volume-high'}`;
            audioBtn.setAttribute('aria-label', state.muted ? 'Activar sonido' : 'Silenciar');
        });
    }

    // ---------------------------------------------------------------------
    // Animaciones de los slides
    // ---------------------------------------------------------------------
    const slideParts = slide => ({
        titleArea: $('.title-area', slide),
        title: $('.title', slide),
        disc: $('.disc', slide),
        btnWrap: $('.creative-btn--wrap', slide),
        img: $('.slide-bg', slide)
    });

    // Divide el título en letras (una sola vez). Cada palabra queda en un bloque
    // que no se parte, para que el texto siga ajustándose bien en pantallas pequeñas.
    function splitLetters(title) {
        if (title._chars) return title._chars;
        title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());

        const chars = [];
        const walk = node => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) { walk(child); return; }
                if (child.nodeType !== Node.TEXT_NODE) return;
                const frag = document.createDocumentFragment();
                child.textContent.split(/(\s+)/).forEach(part => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                    const word = document.createElement('span');
                    word.className = 'title-word';
                    word.setAttribute('aria-hidden', 'true');
                    for (const letter of part) {
                        const c = document.createElement('span');
                        c.className = 'title-char';
                        c.textContent = letter;
                        word.appendChild(c);
                        chars.push(c);
                    }
                    frag.appendChild(word);
                });
                child.replaceWith(frag);
            });
        };
        walk(title);
        title._chars = chars;
        return chars;
    }

    // Letras que suben desde abajo con un rebote elástico suave
    function animateTitleLetters(title, delay = 0) {
        if (!title || REDUCED_MOTION) return;
        const chars = splitLetters(title);
        gsap.killTweensOf(chars);
        gsap.fromTo(chars,
            { yPercent: 40, opacity: 0 },
            {
                yPercent: 0,
                opacity: 1,
                delay,
                duration: 0.9,
                ease: 'elastic.out(1, 0.55)',
                stagger: { each: 0.035, from: 'start' },
                overwrite: true
            });
    }

    // Movimiento sutil: con ratón sigue el cursor; en táctil, deriva lenta
    function startParallax(slide) {
        stopParallax(slide);
        const { titleArea, disc, btnWrap, img } = slideParts(slide);
        const layers = [[titleArea, 18, 0.7], [disc, 28, 0.9], [btnWrap, 35, 1.2], [img, -8, 0.25]]
            .filter(([el]) => el);

        if (HOVER_MQ.matches) {
            const movers = layers.map(([el, depth]) => ({
                depth,
                x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power2.out' }),
                y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power2.out' })
            }));
            const onMove = e => {
                const r = slide.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                movers.forEach(m => { m.x(px * m.depth); m.y(py * m.depth); });
            };
            slide.addEventListener('mousemove', onMove, { passive: true });
            slide._parallaxCleanup = () => slide.removeEventListener('mousemove', onMove);
        } else {
            const tweens = layers.map(([el, , power], i) => gsap.to(el, {
                x: gsap.utils.random(-8 * power, 8 * power),
                y: gsap.utils.random(-10 * power, 10 * power),
                duration: gsap.utils.random(4, 7) + i * 0.4,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            }));
            slide._parallaxCleanup = () => tweens.forEach(t => t.kill());
        }
    }

    function stopParallax(slide) {
        if (slide._parallaxCleanup) {
            slide._parallaxCleanup();
            slide._parallaxCleanup = null;
        }
    }

    function animateSlideIn(slide, forward = true) {
        if (!slide || !hasGsap()) return;
        const { titleArea, title, disc, btnWrap, img } = slideParts(slide);

        if (img) {
            gsap.killTweensOf(img);
            gsap.fromTo(img, { scale: 1.08 }, { scale: 1.02, duration: 12, ease: 'none' });
        }

        // En móvil solo se animan las letras del título; el resto aparece sin animación
        if (isMobile() || REDUCED_MOTION) {
            gsap.set([titleArea, disc, btnWrap].filter(Boolean), { clearProps: 'opacity,transform' });
            animateTitleLetters(title, 0.05);
            return;
        }

        const dx = forward ? 1 : -1;
        if (titleArea) {
            // El bloque solo aparece; el movimiento lo hacen las letras
            gsap.fromTo(titleArea,
                { opacity: 0, x: 0, y: 0, scale: 1 },
                { opacity: 1, duration: 0.2, delay: 0.1, ease: 'power1.out' });
            animateTitleLetters(title, 0.1);
        }
        if (disc) {
            gsap.fromTo(disc,
                { opacity: 0, y: 80, x: 25 * dx },
                { opacity: 1, y: 0, x: 0, duration: 1.1, delay: 0.18, ease: 'power3.out' });
        }
        if (btnWrap) {
            gsap.fromTo(btnWrap,
                { opacity: 0, y: 100, x: 20 * dx, scale: 0.85 },
                { opacity: 1, y: 0, x: 0, scale: 1, duration: 1.2, delay: 0.26, ease: 'back.out(1.4)' });
        }
        gsap.delayedCall(1.3, () => {
            if (slide.classList.contains('swiper-slide-active')) startParallax(slide);
        });
    }

    function animateSlideOut(slide, forward = true) {
        if (!slide || !hasGsap()) return;
        stopParallax(slide);
        const { titleArea, disc, btnWrap, img } = slideParts(slide);
        if (img) gsap.killTweensOf(img);
        if (isMobile() || REDUCED_MOTION) return;

        const toX = forward ? -20 : 20;
        if (btnWrap) gsap.to(btnWrap, { opacity: 0, y: -35, x: toX, scale: 0.9, duration: 0.3, ease: 'power3.in', overwrite: true });
        if (disc) gsap.to(disc, { opacity: 0, y: -25, x: toX, duration: 0.45, delay: 0.05, ease: 'power2.in', overwrite: true });
        if (titleArea) gsap.to(titleArea, { opacity: 0, y: -20, x: toX, scale: 0.96, duration: 0.6, delay: 0.1, ease: 'power2.in', overwrite: true });
    }

    // ---------------------------------------------------------------------
    // Slider
    // ---------------------------------------------------------------------
    function initSwiper() {
        if (state.swiper || typeof window.Swiper === 'undefined') return;

        const playPause = $('#slider-playpause');
        const total = $$('.services-swiper .swiper-slide').length;
        let currentSlide = null;
        let currentReal = 0;

        const setPaused = paused => {
            state.autoplayPaused = paused;
            playPause.classList.toggle('paused', paused);
            playPause.setAttribute('aria-label', paused ? 'Reanudar reproducción automática' : 'Pausar reproducción automática');
            if (!state.swiper) return;
            if (paused) state.swiper.autoplay.stop();
            else state.swiper.autoplay.start();
        };

        const onChange = sw => {
            const next = sw.slides[sw.activeIndex];
            if (next === currentSlide) return;
            const forward = ((sw.realIndex - currentReal + total) % total) === 1 || sw.realIndex === currentReal;
            if (currentSlide) animateSlideOut(currentSlide, forward);
            currentSlide = next;
            currentReal = sw.realIndex;
            setTimeout(() => animateSlideIn(next, forward), 100);
        };

        state.swiper = new Swiper('.services-swiper', {
            loop: true,
            speed: 900,
            effect: 'fade',
            fadeEffect: { crossFade: true },
            grabCursor: true,
            keyboard: { enabled: true, onlyInViewport: true },
            autoplay: { delay: 12000, disableOnInteraction: false, pauseOnMouseEnter: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            on: {
                init: onChange,
                slideChangeTransitionStart: onChange
            }
        });

        playPause.addEventListener('click', () => setPaused(!state.autoplayPaused));
        $$('.swiper-button-prev, .swiper-button-next').forEach(btn =>
            btn.addEventListener('click', () => setPaused(true)));

        $('.slider-scroll-indicator').addEventListener('click', () => {
            state.swiper.slideNext();
            setPaused(true);
        });

        // Espacio = pausa/reanuda, solo con el slider en pantalla
        document.addEventListener('keydown', e => {
            if (e.code !== 'Space' || e.target.closest('input, textarea, button, a, [role="button"]')) return;
            if (document.body.classList.contains('no-scroll')) return;
            const r = $('#slider-section').getBoundingClientRect();
            if (r.top > window.innerHeight / 2 || r.bottom < window.innerHeight / 2) return;
            e.preventDefault();
            setPaused(!state.autoplayPaused);
        });
    }

    // ---------------------------------------------------------------------
    // Animaciones de las secciones (solo tablet / escritorio)
    // ---------------------------------------------------------------------
    function initSectionAnimations() {
        if (!hasGsap() || !window.ScrollTrigger || REDUCED_MOTION) return;
        gsap.registerPlugin(ScrollTrigger);

        // gsap.matchMedia revierte todo automáticamente al pasar a móvil
        gsap.matchMedia().add('(min-width: 769px)', () => {
            $$('.service-detail, .commercial-card-section').forEach(section => {
                const elements = $$('.service-element', section)
                    .sort((a, b) => (+a.dataset.order || 0) - (+b.dataset.order || 0));
                if (!elements.length) return;

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 75%',
                        end: 'bottom 25%',
                        toggleActions: 'play reverse play reverse'
                    }
                });

                elements.forEach((el, i) => {
                    tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.4, ease: 'power2.out' }, i * 0.4);

                    // Parallax con la variable --py (propiedad "translate"), sin chocar con "transform"
                    if (!el.classList.contains('feature-card')) {
                        gsap.fromTo(el, { '--py': '0px' }, {
                            '--py': `${Math.round(34 * (1 + i * 0.15))}px`,
                            ease: 'none',
                            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 }
                        });
                    }
                });

                gsap.fromTo(section, { backgroundPosition: '50% 42%' }, {
                    backgroundPosition: '50% 62%',
                    ease: 'none',
                    scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
                });
            });

            // El cubo animado sigue al ratón
            const cleanups = [];
            if (HOVER_MQ.matches) {
                $$('.service-container').forEach(container => {
                    const media = $('.lvl-cube', container);
                    if (!media) return;
                    const moveX = gsap.quickTo(media, 'x', { duration: 0.4, ease: 'power2.out' });
                    const moveY = gsap.quickTo(media, 'y', { duration: 0.4, ease: 'power2.out' });
                    const onMove = e => {
                        const r = container.getBoundingClientRect();
                        moveX(((e.clientX - r.left) / r.width - 0.5) * 24);
                        moveY(((e.clientY - r.top) / r.height - 0.5) * 24);
                    };
                    const onLeave = () => { moveX(0); moveY(0); };
                    container.addEventListener('mousemove', onMove, { passive: true });
                    container.addEventListener('mouseleave', onLeave, { passive: true });
                    cleanups.push(() => {
                        container.removeEventListener('mousemove', onMove);
                        container.removeEventListener('mouseleave', onLeave);
                    });
                });
            }
            return () => cleanups.forEach(fn => fn());
        });
    }

    // ---------------------------------------------------------------------
    // Modales de servicio
    // ---------------------------------------------------------------------
    const TIMINGS = [
        { base: 0.02, left: 0.46, slide: 0.5, right: 0.62, text: 0.48, image: 0.66 },
        { base: 0.06, left: 0.54, slide: 0.58, right: 0.7, text: 0.56, image: 0.74 },
        { base: 0.1, left: 0.6, slide: 0.64, right: 0.78, text: 0.62, image: 0.82 }
    ];

    function animateModalContent(panel, textOnly = false) {
        if (!panel || !hasGsap() || REDUCED_MOTION) return;
        const slides = $$('.modal-slide', panel);
        const active = slides.find(s => s.classList.contains('active'));
        const t = TIMINGS[Math.max(0, slides.indexOf(active)) % TIMINGS.length];
        const heading = active && $('h4', active);
        const text = active && $('p', active);
        const left = $('.modal-content-left', panel);
        const right = $('.modal-content-right', panel);
        const image = $('.modal-graphic-image', panel);

        gsap.killTweensOf([left, right, active, heading, text, image].filter(Boolean));

        if (!textOnly) {
            if (left) gsap.fromTo(left, { opacity: 0, x: -26 }, { opacity: 1, x: 0, duration: t.left, delay: t.base, ease: 'power3.out' });
            if (right) gsap.fromTo(right, { opacity: 0, x: 26, scale: 0.96 }, { opacity: 1, x: 0, scale: 1, duration: t.right, delay: t.base + 0.12, ease: 'power3.out' });
            if (image) gsap.fromTo(image, { opacity: 0, x: 18, scale: 0.95 }, { opacity: 1, x: 0, scale: 1, duration: t.image, delay: t.base + 0.24, ease: 'power3.out' });
        }
        if (active) gsap.fromTo(active, { opacity: 0, y: 20, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: t.slide, delay: t.base + 0.06, ease: 'power2.out' });
        if (heading) gsap.fromTo(heading, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.36, delay: t.base + 0.14, ease: 'power2.out' });
        if (text) gsap.fromTo(text, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: t.text, delay: t.base + 0.2, ease: 'power2.out' });

        // Listas con diseño (tarjetas, pasos, mosaicos): entran una tras otra
        const items = active ? $$('.dc-anim > li', active) : [];
        if (items.length) {
            gsap.killTweensOf(items);
            gsap.fromTo(items,
                { opacity: 0, y: 16, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.45, delay: t.base + 0.18, stagger: 0.07, ease: 'power2.out', clearProps: 'transform' });
        }
    }

    function activateTab(modal, index, animate = true) {
        const buttons = $$('.modal-tab__btn', modal);
        const panels = $$('.modal-tab__content', modal);
        const i = Math.min(Math.max(0, index), panels.length - 1);

        buttons.forEach((b, n) => {
            b.classList.toggle('active', n === i);
            b.setAttribute('aria-selected', String(n === i));
        });
        panels.forEach((p, n) => p.classList.toggle('active', n === i));

        const panel = panels[i];
        $$('.modal-slide', panel).forEach((s, n) => s.classList.toggle('active', n === 0));
        $('.feature-modal__content', modal).scrollTop = 0;
        if (animate) animateModalContent(panel);
    }

    function stepSlide(modal, dir) {
        const panel = $('.modal-tab__content.active', modal);
        if (!panel) return;
        const slides = $$('.modal-slide', panel);
        const current = slides.findIndex(s => s.classList.contains('active'));
        const next = (current + dir + slides.length) % slides.length;
        slides.forEach((s, n) => s.classList.toggle('active', n === next));
        animateModalContent(panel, true);
    }

    // Abre un modal (microlíneas o casos de éxito) en la pestaña indicada
    function openModal(modal, tabIndex, opener) {
        if (!modal) return;

        state.lastFocus = opener;
        activateTab(modal, tabIndex, false);

        modal.removeAttribute('inert');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        state.swiper?.autoplay?.stop();

        const panel = $('.feature-modal__panel', modal);
        const backdrop = $('.feature-modal__backdrop', modal);
        const tabs = $('.modal-tabs', modal);

        if (hasGsap() && !REDUCED_MOTION) {
            gsap.killTweensOf([panel, backdrop, tabs]);
            gsap.timeline()
                .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' }, 0)
                .fromTo(panel,
                    { opacity: 0, scale: 0.82, y: 34, filter: 'blur(16px)', borderRadius: 36 },
                    { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', borderRadius: 0, duration: 0.62, ease: 'back.out(1.18)', clearProps: 'filter,transform,borderRadius' }, 0)
                .fromTo(tabs, { opacity: 0, y: 24, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out', clearProps: 'transform' }, 0.16);
            setTimeout(() => animateModalContent($('.modal-tab__content.active', modal)), 110);
        }

        $('.feature-modal__close', modal).focus({ preventScroll: true });
    }

    function closeModal(modal) {
        if (!modal || modal.getAttribute('aria-hidden') === 'true') return;

        const finish = () => {
            modal.setAttribute('aria-hidden', 'true');
            modal.setAttribute('inert', '');
            document.body.classList.remove('no-scroll');
            state.lastFocus?.focus({ preventScroll: true });
        };

        if (!hasGsap() || REDUCED_MOTION) { finish(); return; }

        const panel = $('.feature-modal__panel', modal);
        const backdrop = $('.feature-modal__backdrop', modal);
        const tabs = $('.modal-tabs', modal);
        gsap.killTweensOf([panel, backdrop, tabs]);
        gsap.timeline({ onComplete: finish })
            .to(tabs, { opacity: 0, y: 8, scale: 0.99, duration: 0.2, ease: 'power2.in' }, 0)
            .to(panel, { opacity: 0, scale: 0.86, y: 30, filter: 'blur(14px)', borderRadius: 34, duration: 0.34, ease: 'power3.in' }, 0.04)
            .to(backdrop, { opacity: 0, duration: 0.28, ease: 'power2.in' }, 0.06);
    }

    function initModals() {
        document.addEventListener('click', e => {
            const card = e.target.closest('.feature-card');
            if (card) {
                const cards = $$('.feature-card', card.closest('.service-features'));
                openModal($('[data-feature-modal]', card.closest('.service-container')), cards.indexOf(card), card);
                return;
            }

            const caseBtn = e.target.closest('.case-btn');
            if (caseBtn) {
                openModal($('[data-case-modal]', caseBtn.closest('.service-container')), 0, caseBtn);
                return;
            }

            const modal = e.target.closest('.feature-modal');
            if (!modal) return;

            if (e.target.closest('[data-close], .feature-modal__close')) { closeModal(modal); return; }

            const tab = e.target.closest('.modal-tab__btn');
            if (tab) { activateTab(modal, +tab.dataset.tab); return; }

            const nav = e.target.closest('.modal-nav-button');
            if (nav) stepSlide(modal, nav.classList.contains('modal-nav-button--prev') ? -1 : 1);
        });

        document.addEventListener('keydown', e => {
            const modal = $('.feature-modal[aria-hidden="false"]');
            if (!modal) return;
            if (e.key === 'Escape') closeModal(modal);
            else if (e.key === 'ArrowLeft') stepSlide(modal, -1);
            else if (e.key === 'ArrowRight') stepSlide(modal, 1);
        });

        // Deslizar con el dedo entre puntos del modal
        $$('.feature-modal').forEach(modal => {
            let startX = 0;
            let startY = 0;
            const content = $('.modal-tabs__content', modal);
            content.addEventListener('touchstart', e => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });
            content.addEventListener('touchend', e => {
                const dx = e.changedTouches[0].clientX - startX;
                const dy = e.changedTouches[0].clientY - startY;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) stepSlide(modal, dx < 0 ? 1 : -1);
            }, { passive: true });
        });
    }

    // ---------------------------------------------------------------------
    // Arranque
    // ---------------------------------------------------------------------
    // Salto inmediato arriba (sin la animación de "scroll-behavior: smooth" del CSS)
    const scrollToTopNow = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    let loaderHidden = false;
    function hideLoader() {
        if (loaderHidden) return; // se llama en "load" y como respaldo a los 4 s: solo actúa una vez
        loaderHidden = true;
        $('#loading-overlay')?.classList.add('hidden');
        scrollToTopNow();
        window.ScrollTrigger?.refresh();
    }

    // Cada vez que se carga o recarga el sitio, empieza en el primer viewport
    function initStartAtTop() {
        // El navegador no debe restaurar la posición anterior
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.ScrollTrigger?.clearScrollMemory?.('manual');

        // Quitar un #ancla de la URL para que no salte a esa sección
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);

        scrollToTopNow();
        // Safari y Firefox pueden restaurar tarde: se repite al terminar de cargar
        window.addEventListener('load', () => {
            scrollToTopNow();
            requestAnimationFrame(scrollToTopNow);
        }, { once: true });
        // Al recargar, dejar guardada la posición 0 antes de salir
        window.addEventListener('beforeunload', scrollToTopNow);
    }

    function init() {
        initStartAtTop();
        detectPlatform();

        const nav = initNavigation();
        initModals();
        initSectionAnimations();
        initWheelSnap();

        $$('.js-home-logo').forEach(logo => logo.addEventListener('click', () => {
            scrollToTopNow();
            location.reload();
        }));

        initIntro(() => {
            initSwiper();
            nav.show();
            window.ScrollTrigger?.refresh();
        });

        // Ocultar el loader al cargar (máximo 4 s aunque el video de YouTube tarde)
        if (document.readyState === 'complete') setTimeout(hideLoader, 300);
        else window.addEventListener('load', () => setTimeout(hideLoader, 300), { once: true });
        setTimeout(hideLoader, 4000);
    }

    // Los scripts usan "defer": el DOM ya está listo
    init();
})();
