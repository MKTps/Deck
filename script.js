(function(){
    // Load floating menu include and initialize its behavior. Show menu only after slider-section.
    function initFSMListeners(container){
        const items = container.querySelectorAll('.fsm-item');
        items.forEach(item=>{
            item.addEventListener('click', ()=>{
                const target = item.getAttribute('data-target');
                const download = item.getAttribute('data-download');
                if(target){
                    if(window.gsap && gsap.to){
                        gsap.to(window, { duration: 1.2, scrollTo: { y: `#${target}`, offsetY: 0 }, ease: 'power3.inOut' });
                    } else {
                        const el = document.getElementById(target);
                        if(el) el.scrollIntoView({behavior:'smooth'});
                    }
                } else if(download){
                    // Trigger file download (uses anchor with download attr)
                    try{
                        const a = document.createElement('a');
                        a.href = download;
                        a.setAttribute('download','');
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }catch(err){
                        // fallback to opening in new tab
                        window.open(download, '_blank');
                    }
                }
            });
            item.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); item.click(); } });
        });
    }

    let fsmLoaded = false;
    let fsmElement = null;

    function loadFSM(){
        if(fsmLoaded) return Promise.resolve(fsmElement);

        // Si la pÃ¡gina se sirve vÃ­a file://, fetch no funciona en muchos navegadores.
        // En ese caso usamos un fallback inline para que funcione sin servidor.
        if(window.location.protocol === 'file:'){
            const html = `
<nav id="floating-service-menu" class="fsm-hidden" aria-label="Menú de servicios">
    <ul>
        <li class="fsm-item" data-target="service-container-1" tabindex="0" aria-label="Solutions Development">
            <span class="fsm-icon"><i class="fa-solid fa-laptop-code"></i></span>
            <span class="fsm-tooltip">Solutions Development</span>
        </li>
        <li class="fsm-item" data-target="service-container-2" tabindex="0" aria-label="Automation">
            <span class="fsm-icon"><i class="fa-solid fa-robot"></i></span>
            <span class="fsm-tooltip">Automation</span>
        </li>
        <li class="fsm-item" data-target="service-container-3" tabindex="0" aria-label="Data Management">
            <span class="fsm-icon"><i class="fa-solid fa-database"></i></span>
            <span class="fsm-tooltip">Data Management</span>
        </li>
        <li class="fsm-item" data-target="service-container-4" tabindex="0" aria-label="Smart Factory">
            <span class="fsm-icon"><i class="fa-solid fa-industry"></i></span>
            <span class="fsm-tooltip">Smart Factory</span>
        </li>
        <li class="fsm-item" data-target="commercial-card-section" tabindex="0" aria-label="Contacto">
            <span class="fsm-icon"><i class="fa-solid fa-envelope"></i></span>
            <span class="fsm-tooltip">Contacto</span>
        </li>
        <li class="fsm-item fsm-item--download" tabindex="0" aria-label="Descargar Deck" id="fsm-download-btn" data-download="deck.pdf">
            <span class="fsm-icon"><i class="fa-solid fa-download"></i></span>
            <span class="fsm-tooltip">Descargar Deck</span>
        </li>
    </ul>
</nav>`;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            const nav = wrapper.querySelector('#floating-service-menu');
            document.body.appendChild(nav);
            fsmLoaded = true;
            fsmElement = nav;
            initFSMListeners(nav);
            return Promise.resolve(nav);
        }

        return fetch('includes/floating-menu.html')
            .then(res => {
                if(!res.ok) throw new Error('No se pudo cargar el include: ' + res.status);
                return res.text();
            })
            .then(html => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = html;
                const nav = wrapper.querySelector('#floating-service-menu');
                if(nav){
                    document.body.appendChild(nav);
                    fsmLoaded = true;
                    fsmElement = nav;
                    initFSMListeners(nav);
                    return nav;
                }
                throw new Error('Elemento #floating-service-menu no encontrado en include.');
            });
    }

    function checkScrollAndToggle(){
        // Show the floating menu when first service section is visible
        const firstService = document.getElementById('service-container-1');
        if(!firstService) return;
        const rect = firstService.getBoundingClientRect();
        // Show menu when first service is in viewport
        if(rect.top < window.innerHeight){
            // show
            if(!fsmLoaded){
                loadFSM().catch(()=>{}).then(nav=>{ if(nav){ nav.classList.remove('fsm-hidden'); nav.classList.add('fsm-visible'); } });
            } else if(fsmElement){
                fsmElement.classList.remove('fsm-hidden');
                fsmElement.classList.add('fsm-visible');
            }
        } else {
            // hide
            if(fsmLoaded && fsmElement){
                fsmElement.classList.remove('fsm-visible');
                fsmElement.classList.add('fsm-hidden');
            }
        }
    }

document.addEventListener('DOMContentLoaded', function(){
        // run initial check (in case page loaded already scrolled)
        checkScrollAndToggle();
        window.addEventListener('scroll', checkScrollAndToggle, { passive: true });
        window.addEventListener('resize', checkScrollAndToggle);
        
        // Use GSAP + ScrollTrigger for section entry animations (desktop only)
        try{
            if(window.innerWidth > 768 && window.gsap && gsap.registerPlugin && window.ScrollTrigger){
                gsap.registerPlugin(ScrollTrigger);
                // Parallax for floating orbs on scroll
                const orb1 = document.querySelector('.orb1');
                const orb2 = document.querySelector('.orb2');
                const orb3 = document.querySelector('.orb3');
                if(orb1){
                    gsap.to(orb1, {
                        y: -120,
                        ease: 'none',
                        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 }
                    });
                }
                if(orb2){
                    gsap.to(orb2, {
                        y: 140,
                        ease: 'none',
                        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 }
                    });
                }
                if(orb3){
                    gsap.to(orb3, {
                        y: -80,
                        ease: 'none',
                        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 }
                    });
                }

                // Autonomous floating motion for orbs
                if(orb1){
                    gsap.to(orb1, { x: 18, y: -12, duration: 18, ease: 'sine.inOut', yoyo: true, repeat: -1 });
                }
                if(orb2){
                    gsap.to(orb2, { x: -16, y: 18, duration: 22, ease: 'sine.inOut', yoyo: true, repeat: -1 });
                }
                if(orb3){
                    gsap.to(orb3, { x: 14, y: 10, duration: 24, ease: 'sine.inOut', yoyo: true, repeat: -1 });
                }

                // Scroll-driven animations for elements with .animate-on-scroll
                document.querySelectorAll('.animate-on-scroll').forEach(el => {
                    gsap.fromTo(el,
                        { opacity: 0, y: 50 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: 'power2.out',
                            immediateRender: false,
                            scrollTrigger: {
                                trigger: el,
                                start: 'top 80%',
                                end: 'bottom 20%',
                                toggleActions: 'play reverse play reverse'
                            }
                        }
                    );
                });

                // Parallax hover for LVL GIFs inside service sections
                document.querySelectorAll('.service-container').forEach(section => {
                    const img = section.querySelector('.lvl-gif');
                    if(!img) return;
                    const moveX = gsap.quickTo(img, 'x', { duration: 0.6, ease: 'power2.out' });
                    const moveY = gsap.quickTo(img, 'y', { duration: 0.6, ease: 'power2.out' });
                    section.addEventListener('mousemove', (e) => {
                        const rect = section.getBoundingClientRect();
                        const relX = (e.clientX - rect.left) / rect.width - 0.5;
                        const relY = (e.clientY - rect.top) / rect.height - 0.5;
                        moveX(relX * 24);
                        moveY(relY * 24);
                    });
                    section.addEventListener('mouseleave', () => {
                        moveX(0);
                        moveY(0);
                    });
                });
            } else {
                // On mobile (or when GSAP missing) ensure animated elements are visible and disable transitions
                console.warn('GSAP not used (mobile or unavailable) â€” forcing visible state');
                document.querySelectorAll('.service-detail').forEach(sec => sec.classList.add('in-view'));
                document.querySelectorAll('.animate-on-scroll').forEach(el => {
                    try{
                        el.style.opacity = 1;
                        el.style.transform = 'none';
                        el.style.transition = 'none';
                    }catch(e){}
                });
            }
        }catch(err){ console.warn('Error initializing ScrollTrigger animations', err); }

        // Snap scroll: force full-section navigation per wheel step
        (function initScrollSnap(){
            let isSnapping = false;
            const sectionSelectors = [
                '#service-container-1',
                '#service-container-2',
                '#service-container-3',
                '#service-container-4',
                '#commercial-card-section'
            ];

            function getSections(){
                const list = sectionSelectors
                    .map(sel => document.querySelector(sel))
                    .filter(Boolean);
                const slider = document.getElementById('slider-section');
                if(slider && slider.classList.contains('active')){
                    return [slider, ...list];
                }
                return list;
            }

            function getCurrentIndex(sections){
                const y = window.scrollY || 0;
                let idx = 0;
                sections.forEach((sec, i) => {
                    if(sec.offsetTop <= y + 4){
                        idx = i;
                    }
                });
                return idx;
            }

            window.addEventListener('wheel', (e) => {
                if(!document.body.classList.contains('scroll-enabled')){
                    document.body.classList.add('scroll-enabled');
                }
                if(document.body.classList.contains('no-scroll')) return;
                if(e.target.closest('.feature-modal')) return;
                if(isSnapping) return;
                e.preventDefault();
                const sections = getSections();
                if(!sections.length) return;
                const current = getCurrentIndex(sections);
                const dir = e.deltaY > 0 ? 1 : -1;
                const nextIndex = Math.min(sections.length - 1, Math.max(0, current + dir));
                if(nextIndex === current) return;
                isSnapping = true;
                if(window.gsap && gsap.killTweensOf){
                    gsap.killTweensOf(window);
                }
                gsap.to(window, {
                    duration: 0.15,
                    scrollTo: { y: sections[nextIndex], offsetY: 0 },
                    ease: 'power3.inOut',
                    onComplete: () => { isSnapping = false; }
                });
            }, { passive: false });
        })();

    });

})();
// ============================================
// SCROLL AL TOP AL CARGAR LA PÃGINA
// ============================================
if (window.history.scrollRestoration) {
    window.history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;

// ============================================
// VARIABLES GLOBALES
// ============================================
let swiper;
let introCompleted = false;
let timerInterval;
let timeLeft = 30;

// ============================================
// OCULTAR LOADING
// ============================================
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
        startSkipTimer();
        try{ if(window.ScrollTrigger){ ScrollTrigger.refresh(true); } }catch(e){}
    }, 500);
});

// Logo click: reset page to top and reload
document.addEventListener('DOMContentLoaded', () => {
    const logos = document.querySelectorAll('#logo, .logo-mark');
    if(logos.length){
        logos.forEach(logo => {
            logo.style.cursor = 'pointer';
            logo.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo(0, 0);
                window.location.reload();
            });
        });
    }
});

// ============================================
// TEMPORIZADOR DE SKIP INTRO
// ============================================
function startSkipTimer() {
    const progressCircle = document.querySelector('.skip-btn-circle-progress');
    const circumference = 534.07; // 2 * PI * 85

    timerInterval = setInterval(() => {
        timeLeft--;

        // Actualizar cÃ­rculo de progreso
        const progress = (30 - timeLeft) / 30;
        const offset = circumference * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            skipIntro();
        }
    }, 1000);
}

// ============================================
// YOUTUBE PLAYER API
// ============================================
let youtubePlayer;
let isMuted = true;

// Esta función se llama automáticamente cuando la API de YouTube está lista
window.onYouTubeIframeAPIReady = function() {
    youtubePlayer = new YT.Player('intro-video', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerReady(event) {
    // El video ya debe estar en autoplay gracias a los parámetros del iframe
}

function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED = 0
    if (event.data === YT.PlayerState.ENDED) {
        skipIntro();
    }
}

// ============================================
// AUDIO TOGGLE
// ============================================
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const audioIcon = document.getElementById('audio-icon');

audioToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evitar que active el skip
    isMuted = !isMuted;
    
    if (youtubePlayer && youtubePlayer.mute && youtubePlayer.unMute) {
        if (isMuted) {
            youtubePlayer.mute();
        } else {
            youtubePlayer.unMute();
        }
    }
    
    audioIcon.innerHTML = isMuted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
});

// ============================================
// SKIP INTRO FUNCTION âœ… AJUSTADO (OPCIÃ“N A)
// ============================================
function skipIntro() {
    if (introCompleted) return;
    introCompleted = true;

    // Limpiar temporizador
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Pausar el video de YouTube
    if (youtubePlayer && youtubePlayer.pauseVideo) {
        youtubePlayer.pauseVideo();
    }

    // Mostrar elementos móviles dependientes del intro inmediatamente
    try{ document.body.classList.add('intro-complete'); }catch(e){}

    const introSection = document.getElementById('intro-section');
    const sliderSection = document.getElementById('slider-section');
    const skipBtn = document.getElementById('skip-intro-btn');
    const audioBtn = document.getElementById('audio-toggle-btn');
    const circularTransition = document.getElementById('circular-transition');

    // Ocultar botones
    gsap.to([skipBtn, audioBtn], {
        opacity: 0,
        duration: 0.3
    });

    // âœ… Mostrar el cÃ­rculo SOLO cuando se haga skip
    gsap.set(circularTransition, { opacity: 1, visibility: "visible" });

    // Animar cÃ­rculo expandiÃ©ndose
    const maxDimension = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)) * 2;

    gsap.to(circularTransition, {
        width: maxDimension,
        height: maxDimension,
        duration: 1,
        ease: 'power2.inOut',
                onComplete: () => {
                    introSection.classList.add('hidden');
                    sliderSection.classList.add('active');

                    // Inicializar Swiper
                    initSwiper();

                    // Animar entrada del primer slide
                    animateSlideIn(0);

                    // Refresh ScrollTrigger after intro unlock
                    try{ if(window.ScrollTrigger){ ScrollTrigger.refresh(true); } }catch(e){}

                    // âœ… Resetear y OCULTAR el cÃ­rculo de nuevo
                    gsap.set(circularTransition, {
                        width: 100,
                        height: 100,
                opacity: 0,
                visibility: "hidden"
            });
                    
        }
    });
}

// ============================================
// SKIP INTRO BUTTON CLICK
// ============================================
document.getElementById('skip-intro-btn').addEventListener('click', (e) => {
    // Si el click fue en el botÃ³n de audio, no hacer nada
    if (e.target.closest('#audio-toggle-btn')) return;
    skipIntro();
});

// ============================================
// VIDEO AUTO SKIP CUANDO TERMINE
// ============================================
// El evento 'ended' ahora se maneja en onPlayerStateChange de la API de YouTube

// ============================================
// TYPEWRITER ANIMATION FUNCTION
// ============================================
        function animateTitleTypewriter(slideIndex) {
            const slides = document.querySelectorAll('.swiper-slide');
            if (slides[slideIndex]) {
                const title = slides[slideIndex].querySelector('.title');
                if (title) {
                    // Allow wrapping on small screens
                    if(window.innerWidth <= 768){
                        title.classList.remove('typing');
                        title.style.setProperty('--target-width', '100%');
                        title.style.setProperty('--steps', 1);
                        return;
                    }

                    // Calculate the actual width of the text
                    const tempSpan = document.createElement('span');
                    tempSpan.textContent = title.textContent;
                    tempSpan.style.visibility = 'hidden';
                    tempSpan.style.whiteSpace = 'nowrap';
            tempSpan.style.display = 'inline-block';
            tempSpan.style.fontSize = window.getComputedStyle(title).fontSize;
            tempSpan.style.fontWeight = window.getComputedStyle(title).fontWeight;
            tempSpan.style.letterSpacing = window.getComputedStyle(title).letterSpacing;
            document.body.appendChild(tempSpan);
            const width = tempSpan.offsetWidth;
            document.body.removeChild(tempSpan);

                    // Set the CSS variables for animation target and steps
                    const steps = Math.max(12, (title.textContent || '').trim().length);
                    title.style.setProperty('--target-width', (width + 8) + 'px');
                    title.style.setProperty('--steps', steps);

            // Remove previous animation
            title.classList.remove('typing');
            // Trigger reflow to restart animation
            void title.offsetWidth;
            // Add typing animation
            title.classList.add('typing');
        }
    }
}

// ============================================
// INICIALIZAR SWIPER
// ============================================
function initSwiper() {
    swiper = new Swiper('.services-swiper', {
        direction: 'horizontal',
        loop: true,
        speed: 800,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        preloadImages: true,
        watchSlidesProgress: true,
        updateOnImagesReady: true,
        observer: true,
        observeParents: true,
        autoplay: {
            delay: 10000,
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            type: 'progressbar',
            clickable: false,
        },
        parallax: true,
        on: {
            slideChangeTransitionStart: function() {
                animateSlideOut(this.previousIndex);
            },
            slideChangeTransitionEnd: function() {
                animateSlideIn(this.activeIndex);
            }
        }
    });

    // Animar el primer slide
    animateSlideIn(0);
}

            // ============================================
            // MODAL TABS SYSTEM
            // ============================================

            function initializeModalTabs(){
                document.querySelectorAll('.feature-modal').forEach(modal => {
                    // Tab buttons
                    const tabBtns = modal.querySelectorAll('.modal-tab__btn');
                    const tabContents = modal.querySelectorAll('.modal-tab__content');
                    const modalTabs = modal.querySelector('.modal-tabs');
                    const prevBtn = modalTabs.querySelector('.modal-nav-button--prev');
                    const nextBtn = modalTabs.querySelector('.modal-nav-button--next');

                    tabBtns.forEach(btn => {
                        btn.addEventListener('click', () => {
                            const tabIndex = btn.getAttribute('data-tab');
                            
                            // Deactivate all tabs and contents
                            tabBtns.forEach(b => b.classList.remove('active'));
                            tabContents.forEach(c => c.classList.remove('active'));
                            
                            // Activate selected tab
                            btn.classList.add('active');
                            const activeContent = modal.querySelector(`[data-tab-panel="${tabIndex}"]`);
                            if(activeContent){
                                activeContent.classList.add('active');
                                // Reset to first slide when switching tabs
                                const slides = activeContent.querySelectorAll('.modal-slide');
                                slides.forEach((s, i) => {
                                    if(i === 0) s.classList.add('active');
                                    else s.classList.remove('active');
                                });
                                updateSlideCounter(activeContent);
                            }
                        });
                    });

                    // Slide navigation - using side buttons
                    if(prevBtn && nextBtn){
                        prevBtn.addEventListener('click', () => {
                            const activeTabContent = modal.querySelector('.modal-tab__content.active');
                            if(activeTabContent){
                                const slidesContainer = activeTabContent.querySelector('.modal-tab__slides');
                                navigateSlides(slidesContainer, -1, activeTabContent);
                            }
                        });
                        nextBtn.addEventListener('click', () => {
                            const activeTabContent = modal.querySelector('.modal-tab__content.active');
                            if(activeTabContent){
                                const slidesContainer = activeTabContent.querySelector('.modal-tab__slides');
                                navigateSlides(slidesContainer, 1, activeTabContent);
                            }
                        });
                    }
                });
            }

            function navigateSlides(container, direction, tabContent){
                const slides = container.querySelectorAll('.modal-slide');
                let activeIndex = Array.from(slides).findIndex(s => s.classList.contains('active'));
                let newIndex = activeIndex + direction;

                if(newIndex < 0) newIndex = slides.length - 1;
                if(newIndex >= slides.length) newIndex = 0;

                slides.forEach(s => s.classList.remove('active'));
                slides[newIndex].classList.add('active');
                updateSlideCounter(tabContent);
            }

            function updateSlideCounter(tabContent){
                const activeSlides = tabContent.querySelectorAll('.modal-slide.active');
                if(activeSlides.length > 0){
                    const slides = tabContent.querySelector('.modal-tab__slides');
                    const allSlides = slides.querySelectorAll('.modal-slide');
                    const currentIndex = Array.from(allSlides).indexOf(activeSlides[0]) + 1;
                    const total = allSlides.length;
                    
                    const counter = tabContent.querySelector('.modal-slide__counter');
                    if(counter){
                        counter.querySelector('.current').textContent = currentIndex;
                        counter.querySelector('.total').textContent = total;
                    }
                }
            }

            function getModalForCard(card){
                const container = card.closest('.service-container');
                if(!container) return null;
                return container.querySelector('.feature-modal[data-feature-modal]');
            }

            function openFeatureModal(card){
                const featureModal = getModalForCard(card);
                if(!featureModal) return;

                featureModal.setAttribute('aria-hidden', 'false');
                document.body.classList.add('no-scroll');

                // Animación de apertura
                gsap.fromTo(featureModal, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
                gsap.fromTo(featureModal.querySelector('.feature-modal__panel'), 
                    { transform: 'scale(0.95)', opacity: 0 }, 
                    { transform: 'scale(1)', opacity: 1, duration: 0.6, ease: 'back.out(1.2)' }
                );

                // Reset to first tab
                const firstTabBtn = featureModal.querySelector('.modal-tab__btn');
                if(firstTabBtn) firstTabBtn.click();
            }

            function closeFeatureModal(featureModal){
                if(!featureModal) return;

                gsap.to(featureModal, { opacity: 0, duration: 0.3, ease: 'power2.in' });
                gsap.to(featureModal.querySelector('.feature-modal__panel'), 
                    { transform: 'scale(0.95)', opacity: 0, duration: 0.4, ease: 'back.in(1.2)', 
                      onComplete: () => {
                        featureModal.setAttribute('aria-hidden', 'true');
                        document.body.classList.remove('no-scroll');
                      }
                    }
                );
            }

            // Listeners para feature cards
            function attachFeatureCardListeners(){
                const cards = document.querySelectorAll('.feature-card');
                cards.forEach(card => {
                    if(card.__feature_listener_attached) return;
                    card.addEventListener('click', (e) => {
                        openFeatureModal(card);
                    });
                    card.__feature_listener_attached = true;
                });
            }

            // Cerrar modal con botones y tecla Escape
            document.addEventListener('click', (e) => {
                if(e.target.closest('[data-close]') || e.target.closest('.feature-modal__close')){
                    const modal = e.target.closest('.feature-modal');
                    if(modal) closeFeatureModal(modal);
                }
            });

            document.addEventListener('keydown', (e) => {
                if(e.key === 'Escape'){
                    const openModal = document.querySelector('.feature-modal[aria-hidden="false"]');
                    if(openModal) closeFeatureModal(openModal);
                }
            });

            // Inicializar todo en DOM ready
            document.addEventListener('DOMContentLoaded', () => {
                initializeModalTabs();
                attachFeatureCardListeners();
            });

// ============================================
// ANIMACIONES DE SLIDES CON GSAP
// ============================================
        function addParallaxDrift(slide){
            if(!slide) return;
            const targets = [
                slide.querySelector('.title-area'),
                slide.querySelector('.disc'),
                slide.querySelector('.creative-btn--wrap'),
                slide.querySelector('img')
            ].filter(Boolean);

            targets.forEach((el, i) => {
                if(el.__parallaxTween){
                    try{ el.__parallaxTween.kill(); }catch(e){}
                }
                const driftX = gsap.utils.random(-12, 12, 1, true);
                const driftY = gsap.utils.random(-14, 14, 1, true);
                const duration = gsap.utils.random(4, 7, 0.1, true) + i * 0.4;
                el.__parallaxTween = gsap.to(el, {
                    x: driftX,
                    y: driftY,
                    duration,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                });
            });
        }

        function clearParallaxDrift(slide){
            if(!slide) return;
            const targets = [
                slide.querySelector('.title-area'),
                slide.querySelector('.disc'),
                slide.querySelector('.creative-btn--wrap'),
                slide.querySelector('img')
            ].filter(Boolean);
            targets.forEach(el => {
                if(el.__parallaxTween){
                    try{ el.__parallaxTween.kill(); }catch(e){}
                    el.__parallaxTween = null;
                }
                gsap.set(el, { x: 0, y: 0 });
            });
        }

        function animateSlideIn(index) {
            const slide = document.querySelectorAll('.swiper-slide')[index];

            if (slide) {
                const titleArea = slide.querySelector('.title-area');
                const disc = slide.querySelector('.disc');
                const btnWrap = slide.querySelector('.creative-btn--wrap');
                const img = slide.querySelector('img');

                // Animar tÃ­tulo - aparece primero
                if (titleArea) {
                    gsap.fromTo(titleArea,
                        { opacity: 0, y: 24 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.9,
                            ease: 'power3.out',
                            onStart: () => {
                                animateTitleTypewriter(index);
                            }
                        }
                    );
                }

                // Animar texto - aparece despuÃ©s con delay
                if (disc) {
                    gsap.fromTo(disc,
                        { opacity: 0, y: 30 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 1.1,
                            ease: 'power3.out',
                            delay: 0.25
                        }
                    );
                }

                // Animar botÃ³n - aparece Ãºltimo con mayor delay
                if (btnWrap) {
                    gsap.fromTo(btnWrap,
                        { opacity: 0, y: 34 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 1.2,
                            ease: 'power3.out',
                            delay: 0.45
                        }
                    );
                }

                if (img) {
                    gsap.fromTo(img,
                        { opacity: 0, scale: 1.04 },
                        {
                            opacity: 1,
                            scale: 1,
                            duration: 1.4,
                            ease: 'power2.out',
                            delay: 0.15
                        }
                    );
                }

                // Parallax drift
                addParallaxDrift(slide);
            }
        }

        function animateSlideOut(index) {
            const slide = document.querySelectorAll('.swiper-slide')[index];

            if (slide) {
                const titleArea = slide.querySelector('.title-area');
                const disc = slide.querySelector('.disc');
                const btnWrap = slide.querySelector('.creative-btn--wrap');

                clearParallaxDrift(slide);

                // Animar salida del botÃ³n - sale primero
                if (btnWrap) {
                    gsap.to(btnWrap, {
                        opacity: 0,
                        y: -10,
                        duration: 0.7,
                        ease: 'power3.in'
                    });
                }

                // Animar salida del texto - sale despuÃ©s con delay
                if (disc) {
                    gsap.to(disc, {
                        opacity: 0,
                        y: -10,
                        duration: 0.7,
                        ease: 'power3.in',
                        delay: 0.05
                    });
                }

                // Animar salida del tÃ­tulo - sale Ãºltimo con mayor delay
                if (titleArea) {
                    gsap.to(titleArea, {
                        opacity: 0,
                        y: -8,
                        duration: 0.7,
                        ease: 'power3.in',
                        delay: 0.1
                    });
                }
            }
        }

// ============================================
// BOTONES "DESCUBRIR"
// ============================================
document.addEventListener('click', (e) => {
    const discoverBtn = e.target.closest('.discover-btn');
    if (discoverBtn) {
        const targetId = discoverBtn.getAttribute('data-target');
        enableScrollAndNavigate(targetId);
    }

    // NAVEGACIÃ“N CROSS-SERVICE
    const navCard = e.target.closest('.service-nav-card');
    if (navCard && !navCard.classList.contains('active')) {
        const targetId = navCard.getAttribute('data-goto');
        if (targetId) {
            navigateToService(targetId);
        }
    }
});

function enableScrollAndNavigate(targetId) {
    // Habilitar scroll vertical
    document.body.classList.add('scroll-enabled');
    try{ if(window.ScrollTrigger){ ScrollTrigger.refresh(true); } }catch(e){}

    // Detener autoplay del swiper
    if (swiper && swiper.autoplay) {
        swiper.autoplay.stop();
    }

    // Determinar el contenedor correcto basado en el servicio
    let containerId;
    if (targetId === 'service1') containerId = 'service-container-1';
    else if (targetId === 'service2') containerId = 'service-container-2';
    else if (targetId === 'service3') containerId = 'service-container-3';
    else if (targetId === 'service4') containerId = 'service-container-4';

    // Scroll suave hacia el contenedor
    gsap.to(window, {
        duration: 1.5,
        scrollTo: {
            y: `#${containerId}`,
            offsetY: 0
        },
        ease: 'power3.inOut',
        onComplete: () => {
            const sectionId = targetId;
            const section = sectionId ? document.getElementById(sectionId) : null;
            if(section && section.__entryTl){
                section.__entryTl.play(0);
            }
        }
    });
}

function navigateToService(containerId) {
    gsap.to(window, {
        duration: 1.2,
        scrollTo: {
            y: `#${containerId}`,
            offsetY: 0
        },
        ease: 'power3.inOut'
    });
}

// ============================================
// ANIMACIONES DE ENTRADA PARA SERVICE DETAILS
// ============================================
// âš ï¸ Esto requiere ScrollTrigger. Si no lo incluyes, darÃ¡ error.
// Si decides activarlo, descomenta el script CDN de ScrollTrigger.
// gsap.registerPlugin(ScrollTrigger);

// document.querySelectorAll('.service-detail').forEach((section) => {
//     gsap.from(section.querySelector('.service-detail-content'), {
//         scrollTrigger: {
//             trigger: section,
//             start: 'top 80%',
//             end: 'bottom 20%',
//             toggleActions: 'play none none reverse'
//         },
//         opacity: 0,
//         y: 60,
//         duration: 1,
//         ease: 'power3.out'
//     });

//     gsap.from(section.querySelectorAll('.feature-card'), {
//         scrollTrigger: {
//             trigger: section,
//             start: 'top 70%',
//         },
//         opacity: 0,
//         y: 40,
//         stagger: 0.2,
//         duration: 0.8,
//         ease: 'power2.out'
//     });

// });

// ============================================
// COMMERCIAL CARD BUTTONS
// ============================================
(function(){
    // WhatsApp button
    const whatsappBtn = document.querySelector('.commercial-card__btn-whatsapp');
    if(whatsappBtn){
        whatsappBtn.addEventListener('click', function(){
            const phone = this.getAttribute('data-whatsapp');
            if(phone){
                const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=Hola%2C%20me%20interesa%20conocer%20sobre%20los%20servicios%20de%20PersonalSoft`;
                window.open(url, '_blank');
            }
        });
    }

    // Email button
    const emailBtn = document.querySelector('.commercial-card__btn-email');
    if(emailBtn){
        emailBtn.addEventListener('click', function(){
            const email = this.getAttribute('data-email');
            const subject = encodeURIComponent('InformaciÃ³n sobre servicios PersonalSoft');
            const body = encodeURIComponent('Hola,\n\nMe interesa conocer mÃ¡s sobre los servicios de PersonalSoft.\n\nQuedo atento a sus comentarios.\n\nSaludos');
            if(email){
                window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
            }
        });
    }
})();
