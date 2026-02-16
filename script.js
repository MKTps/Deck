(function(){
    // Load floating menu include and initialize its behavior. Show menu only after slider-section
    function initFSMListeners(container){
        const items = container.querySelectorAll('.fsm-item');
        items.forEach(item=>{
            item.addEventListener('click', ()=>{
                const target = item.getAttribute('data-target');
                const download = item.getAttribute('data-download');
                if(target){
                    // Matar cualquier animación previa
                    if(window.gsap && gsap.killTweensOf){
                        gsap.killTweensOf(window);
                    }
                    const el = document.getElementById(target);
                    if(el){
                        el.scrollIntoView({behavior: 'smooth', block: 'start'});
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
        <li class="fsm-item" data-target="slider-section" tabindex="0" aria-label="Home">
            <span class="fsm-icon"><i class="fa-solid fa-house"></i></span>
            <span class="fsm-tooltip">Home</span>
        </li>
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
        // Show the floating menu only AFTER slider-section and when at first service section
        const sliderSection = document.getElementById('slider-section');
        const firstService = document.getElementById('service-container-1');
        
        if(!firstService || !sliderSection) return;
        
        const sliderRect = sliderSection.getBoundingClientRect();
        const serviceRect = firstService.getBoundingClientRect();
        
        // Show menu only when we've scrolled past the slider section OR when the first service is at least 30% visible
        const shouldShow = (sliderRect.bottom < 0) || 
                          (serviceRect.top < window.innerHeight * 0.7 && serviceRect.bottom > 0);
        
        if(shouldShow){
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
        
        // Debounce resize event to prevent excessive recalculations
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(checkScrollAndToggle, 100);
        }, { passive: true });
        
        // Use GSAP + ScrollTrigger for section entry animations (desktop only)
        try{
            if(window.innerWidth > 768 && window.gsap && gsap.registerPlugin && window.ScrollTrigger){
                gsap.registerPlugin(ScrollTrigger);
                // Pre-fetch orbs and apply will-change for performance
                const orb1 = document.querySelector('.orb1');
                const orb2 = document.querySelector('.orb2');
                const orb3 = document.querySelector('.orb3');
                const orbs = [orb1, orb2, orb3];
                orbs.forEach(orb => {
                    if(orb) orb.style.willChange = 'transform';
                });
                
                if(orb1){
                    gsap.to(orb1, {
                        y: -120,
                        ease: 'none',
                        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1, anticipatePin: 1 }
                    });
                }
                if(orb2){
                    gsap.to(orb2, {
                        y: 140,
                        ease: 'none',
                        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1, anticipatePin: 1 }
                    });
                }
                if(orb3){
                    gsap.to(orb3, {
                        y: -80,
                        ease: 'none',
                        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1, anticipatePin: 1 }
                    });
                }

                // Autonomous floating motion for orbs
                orbs.forEach((orb, idx) => {
                    if(!orb) return;
                    const durations = [18, 22, 24];
                    const moves = [
                        { x: 18, y: -12 },
                        { x: -16, y: 18 },
                        { x: 14, y: 10 }
                    ];
                    gsap.to(orb, { ...moves[idx], duration: durations[idx], ease: 'sine.inOut', yoyo: true, repeat: -1 });
                });

                // Scroll-driven animations for elements with .animate-on-scroll
                const scrollElements = document.querySelectorAll('.animate-on-scroll');
                gsap.utils.toArray(scrollElements).forEach(el => {
                    gsap.fromTo(el,
                        { opacity: 0, y: 50 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.5,
                            ease: 'power2.out',
                            immediateRender: false,
                            scrollTrigger: {
                                trigger: el,
                                start: 'top 80%',
                                end: 'bottom 20%',
                                toggleActions: 'play reverse play reverse',
                                anticipatePin: 1
                            }
                        }
                    );
                });

                // Sequential animations for service elements (title, image, description, buttons)
                document.querySelectorAll('.service-detail, .commercial-card-section').forEach(section => {
                    const elements = Array.from(section.querySelectorAll('.service-element')).sort((a, b) => {
                        return parseInt(a.getAttribute('data-order') || 0) - parseInt(b.getAttribute('data-order') || 0);
                    });
                    
                    if(elements.length > 0) {
                        elements.forEach((el, index) => {
                            // Parallax intensity: title moves less, buttons move more
                            const parallaxMultiplier = 1 + (index * 0.15);
                            
                            // Sequential reveal animation
                            gsap.fromTo(el,
                                { opacity: 0, y: 30 },
                                {
                                    opacity: 1,
                                    y: 0,
                                    duration: 1.2,
                                    delay: index * 0.35,
                                    ease: 'power2.out',
                                    immediateRender: false,
                                    scrollTrigger: {
                                        trigger: section,
                                        start: 'top 75%',
                                        end: 'bottom 25%',
                                        toggleActions: 'play reverse play reverse',
                                        anticipatePin: 1
                                    }
                                }
                            );
                            
                            // Parallax scroll effect
                            gsap.to(el, {
                                y: (i) => {
                                    return (window.innerHeight - el.getBoundingClientRect().top) * 0.05 * parallaxMultiplier;
                                },
                                ease: 'none',
                                scrollTrigger: {
                                    trigger: section,
                                    start: 'top bottom',
                                    end: 'bottom top',
                                    scrub: 0.5,
                                    onUpdate: (self) => {
                                        gsap.to(el, {
                                            y: (self.getVelocity() * 0.02 * parallaxMultiplier),
                                            duration: 0.5,
                                            overwrite: 'auto',
                                            ease: 'power2'
                                        });
                                    }
                                }
                            });
                        });
                    }
                });

                // Parallax hover for LVL GIFs inside service sections with passive mouse listeners
                document.querySelectorAll('.service-container').forEach(section => {
                    const img = section.querySelector('.lvl-gif');
                    if(!img) return;
                    img.style.willChange = 'transform';
                    const moveX = gsap.quickTo(img, 'x', { duration: 0.4, ease: 'power2.out' });
                    const moveY = gsap.quickTo(img, 'y', { duration: 0.4, ease: 'power2.out' });
                    section.addEventListener('mousemove', (e) => {
                        const rect = section.getBoundingClientRect();
                        const relX = (e.clientX - rect.left) / rect.width - 0.5;
                        const relY = (e.clientY - rect.top) / rect.height - 0.5;
                        moveX(relX * 24);
                        moveY(relY * 24);
                    }, { passive: true });
                    section.addEventListener('mouseleave', () => {
                        moveX(0);
                        moveY(0);
                    }, { passive: true });
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
                document.querySelectorAll('.service-element').forEach(el => {
                    try{
                        el.style.opacity = 1;
                        el.style.transform = 'none';
                        el.style.transition = 'none';
                    }catch(e){}
                });
            }
        }catch(err){ console.warn('Error initializing ScrollTrigger animations', err); }

        // Snap scroll: force full-section navigation per wheel step with optimizations
        (function initScrollSnap(){
            let isSnapping = false;
            let wheelTimeout;
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
                if(isSnapping || isNavigatingFromButton) return;
                e.preventDefault();
                
                // Throttle wheel events to reduce processing
                clearTimeout(wheelTimeout);
                wheelTimeout = setTimeout(() => {
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
                        duration: 0.12,
                        scrollTo: { y: sections[nextIndex], offsetY: 0 },
                        ease: 'power2.inOut',
                        onComplete: () => { isSnapping = false; }
                    });
                }, 30);
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
let isNavigatingFromButton = false;

// ============================================
// OCULTAR LOADING
// ============================================
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
        // startSkipTimer(); // Comentado - ya no se usa el círculo de progreso
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
// TEMPORIZADOR DE SKIP INTRO (DESHABILITADO)
// ============================================
/*
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
*/

// ============================================
// VIDEO LOCAL API
// ============================================
let youtubePlayer;
let isMuted = true;
let videoPlayAttempted = false;
let playOverlay;

// Función para intentar reproducir el video
function attemptVideoPlay() {
    if (!youtubePlayer || videoPlayAttempted) return;
    
    videoPlayAttempted = true;
    youtubePlayer.muted = true; // Asegurar que esté muted
    
    const playPromise = youtubePlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('✓ Video reproduciendo correctamente');
            // Ocultar overlay si está visible
            if (playOverlay) {
                playOverlay.style.display = 'none';
            }
        }).catch(err => {
            console.log('⚠ Autoplay bloqueado, mostrando overlay...', err);
            // Mostrar overlay para que el usuario haga click
            if (playOverlay) {
                playOverlay.style.display = 'flex';
            }
            // Segundo intento después de un pequeño delay
            setTimeout(() => {
                youtubePlayer.play().catch(e => {
                    console.log('⚠ Requiere interacción del usuario');
                    if (playOverlay) {
                        playOverlay.style.display = 'flex';
                    }
                });
            }, 100);
        });
    }
}

// Esperar a que el DOM esté listo para acceder al video
document.addEventListener('DOMContentLoaded', function() {
    youtubePlayer = document.getElementById('intro-video');
    playOverlay = document.getElementById('video-play-overlay');
    
    if (youtubePlayer) {
        // Listener para detectar cuando termina el video
        youtubePlayer.addEventListener('ended', skipIntro);
        
        // Listener para cuando el video comienza a reproducirse
        youtubePlayer.addEventListener('playing', function() {
            console.log('✓ Video playing event disparado');
            // Ocultar overlay
            if (playOverlay) {
                playOverlay.style.display = 'none';
            }
            // El video se reproduce en muted por defecto
            // El usuario puede activar el sonido haciendo click en el botón de audio
        }, { once: true }); // Solo ejecutar una vez
        
        // Listener para errores de carga
        youtubePlayer.addEventListener('error', function(e) {
            console.error('❌ Error al cargar el video:', e);
        });
        
        // Listener para cuando el video puede reproducirse
        youtubePlayer.addEventListener('canplay', function() {
            console.log('✓ Video listo para reproducir');
            attemptVideoPlay();
        }, { once: true });
        
        // Primer intento inmediato
        attemptVideoPlay();
    }
    
    // Click en el overlay para reproducir el video
    if (playOverlay) {
        playOverlay.addEventListener('click', function() {
            if (youtubePlayer) {
                youtubePlayer.muted = true;
                youtubePlayer.play().then(() => {
                    playOverlay.style.display = 'none';
                }).catch(err => {
                    console.error('Error al reproducir por click:', err);
                });
            }
        });
    }
});

// Segundo intento después de que se oculta el loading
window.addEventListener('load', () => {
    setTimeout(() => {
        if (youtubePlayer && youtubePlayer.paused) {
            console.log('⟳ Reintentando reproducción después del load...');
            attemptVideoPlay();
        }
    }, 600);
});

// ============================================
// AUDIO TOGGLE
// ============================================
const audioToggleBtn = document.getElementById('audio-toggle-btn');
const audioIcon = document.getElementById('audio-icon');

audioToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evitar que active el skip
    isMuted = !isMuted;
    
    if (youtubePlayer) {
        youtubePlayer.muted = isMuted;
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
let isAutoplayPaused = false; // Variable global para el estado del autoplay

function initSwiper() {
    swiper = new Swiper('.services-swiper', {
        direction: 'horizontal',
        loop: true,
        speed: 900,
        effect: 'fade',
        fadeEffect: { 
            crossFade: true 
        },
        preloadImages: true,
        watchSlidesProgress: true,
        updateOnImagesReady: true,
        observer: true,
        observeParents: true,
        autoplay: {
            delay: 12000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
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
        allowTouchMove: true,
        touchRatio: 1,
        touchAngle: 45,
        grabCursor: true,
        on: {
            slideChangeTransitionStart: function() {
                // Iniciar animación de entrada del nuevo slide inmediatamente
                const activeIndex = this.activeIndex;
                setTimeout(() => {
                    animateSlideIn(activeIndex);
                }, 100);
                // Animar salida del slide anterior
                animateSlideOut(this.previousIndex);
            },
            touchStart: function() {
                // Pausar autoplay al tocar
                if (this.autoplay) this.autoplay.stop();
            },
            touchEnd: function() {
                // Solo reanudar si no estaba pausado manualmente
                if (this.autoplay && !isAutoplayPaused) {
                    setTimeout(() => {
                        this.autoplay.start();
                    }, 3000);
                } else if (isAutoplayPaused) {
                    // Mantener pausado y actualizar botón
                    const playPauseBtn = document.getElementById('slider-playpause');
                    if (playPauseBtn && !playPauseBtn.classList.contains('paused')) {
                        playPauseBtn.classList.add('paused');
                    }
                }
            }
        }
    });

    // Animar el primer slide
    setTimeout(() => animateSlideIn(0), 100);
    
    // ============================================
    // CONTROL DE PLAY/PAUSE
    // ============================================
    const playPauseBtn = document.getElementById('slider-playpause');
    
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (isAutoplayPaused) {
                // Reanudar autoplay
                if (swiper.autoplay) {
                    swiper.autoplay.start();
                }
                playPauseBtn.classList.remove('paused');
                playPauseBtn.setAttribute('aria-label', 'Pausar reproducción automática');
                isAutoplayPaused = false;
            } else {
                // Pausar autoplay
                if (swiper.autoplay) {
                    swiper.autoplay.stop();
                }
                playPauseBtn.classList.add('paused');
                playPauseBtn.setAttribute('aria-label', 'Reanudar reproducción automática');
                isAutoplayPaused = true;
            }
        });
    }
    
    // Pausar autoplay cuando se usan las flechas de navegación
    const prevBtn = document.querySelector('.swiper-button-prev');
    const nextBtn = document.querySelector('.swiper-button-next');
    
    const pauseOnNavigation = () => {
        if (swiper.autoplay && !isAutoplayPaused) {
            swiper.autoplay.stop();
            if (playPauseBtn) {
                playPauseBtn.classList.add('paused');
                playPauseBtn.setAttribute('aria-label', 'Reanudar reproducción automática');
            }
            isAutoplayPaused = true;
        }
    };
    
    if (prevBtn) {
        prevBtn.addEventListener('click', pauseOnNavigation);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', pauseOnNavigation);
    }
    
    // Control por teclado (tecla Espacio para play/pause) solo cuando el slider está visible
    document.addEventListener('keydown', (e) => {
        const sliderSection = document.getElementById('slider-section');
        
        // Solo funcionar si el slider está activo y visible
        if (sliderSection && sliderSection.classList.contains('active')) {
            // Tecla Espacio para play/pause
            if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
                e.preventDefault();
                if (playPauseBtn) {
                    playPauseBtn.click();
                }
            }
        }
    });
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

                // Abrir la pestaña correspondiente a la tarjeta seleccionada
                const container = card.closest('.service-features');
                if(container){
                    const allCards = container.querySelectorAll('.feature-card');
                    const cardIndex = Array.from(allCards).indexOf(card);
                    if(cardIndex >= 0){
                        const tabBtn = featureModal.querySelector(`.modal-tab__btn[data-tab="${cardIndex}"]`);
                        if(tabBtn) tabBtn.click();
                    }
                } else {
                    // Si no encuentra el contenedor, abre la primera pestaña
                    const firstTabBtn = featureModal.querySelector('.modal-tab__btn');
                    if(firstTabBtn) firstTabBtn.click();
                }
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
                { el: slide.querySelector('.title-area'), power: 0.7, speed: 1.2 },
                { el: slide.querySelector('.disc'), power: 0.9, speed: 1.5 },
                { el: slide.querySelector('.creative-btn--wrap'), power: 1.2, speed: 1.8 },
                { el: slide.querySelector('img'), power: 0.25, speed: 0.8 }
            ].filter(item => item.el);

            targets.forEach((item, i) => {
                const el = item.el;
                const power = item.power;
                const speed = item.speed;
                
                if(el.__parallaxTween){
                    try{ el.__parallaxTween.kill(); }catch(e){}
                }
                
                // Movimiento con velocidades diferentes para cada capa
                const driftX = gsap.utils.random(-8 * power, 8 * power, 0.5, true);
                const driftY = gsap.utils.random(-10 * power, 10 * power, 0.5, true);
                const duration = (gsap.utils.random(5, 8, 0.1, true) / speed) + i * 0.4;
                
                el.__parallaxTween = gsap.to(el, {
                    x: driftX,
                    y: driftY,
                    duration,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1
                });
            });
            
            // Agregar parallax del mouse para mayor interactividad
            addMouseParallax(slide);
        }

        function addMouseParallax(slide) {
            if (!slide || window.innerWidth < 769) return; // Solo en desktop/tablet
            
            const handleMouseMove = (e) => {
                const rect = slide.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                
                const titleArea = slide.querySelector('.title-area');
                const disc = slide.querySelector('.disc');
                const btnWrap = slide.querySelector('.creative-btn--wrap');
                const img = slide.querySelector('img');
                
                // Título - velocidad media
                if (titleArea) {
                    gsap.to(titleArea, {
                        x: x * 18,
                        y: y * 18,
                        duration: 1,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
                
                // Texto - velocidad más rápida (más cerca del usuario)
                if (disc) {
                    gsap.to(disc, {
                        x: x * 28,
                        y: y * 28,
                        duration: 0.9,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
                
                // Botón - velocidad muy rápida (elemento más frontal)
                if (btnWrap) {
                    gsap.to(btnWrap, {
                        x: x * 35,
                        y: y * 35,
                        duration: 0.8,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
                
                // Imagen - velocidad muy lenta (fondo, movimiento inverso)
                if (img) {
                    gsap.to(img, {
                        x: x * -8,
                        y: y * -8,
                        duration: 1.5,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                }
            };
            
            slide.__mouseParallaxHandler = handleMouseMove;
            slide.addEventListener('mousemove', handleMouseMove);
        }

        function clearParallaxDrift(slide){
            if(!slide) return;
            
            // Remover mouse parallax
            if (slide.__mouseParallaxHandler) {
                slide.removeEventListener('mousemove', slide.__mouseParallaxHandler);
                slide.__mouseParallaxHandler = null;
            }
            
            // Resetear elementos a diferentes velocidades para efecto en cascada
            const titleArea = slide.querySelector('.title-area');
            const disc = slide.querySelector('.disc');
            const btnWrap = slide.querySelector('.creative-btn--wrap');
            const img = slide.querySelector('img');
            
            // Botón - vuelve más rápido
            if (btnWrap) {
                if(btnWrap.__parallaxTween){
                    try{ btnWrap.__parallaxTween.kill(); }catch(e){}
                    btnWrap.__parallaxTween = null;
                }
                gsap.to(btnWrap, {
                    x: 0, 
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
            
            // Texto - velocidad media
            if (disc) {
                if(disc.__parallaxTween){
                    try{ disc.__parallaxTween.kill(); }catch(e){}
                    disc.__parallaxTween = null;
                }
                gsap.to(disc, {
                    x: 0, 
                    y: 0,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            }
            
            // Título - más lento
            if (titleArea) {
                if(titleArea.__parallaxTween){
                    try{ titleArea.__parallaxTween.kill(); }catch(e){}
                    titleArea.__parallaxTween = null;
                }
                gsap.to(titleArea, {
                    x: 0, 
                    y: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }
            
            // Imagen - muy lento (fondo)
            if (img) {
                if(img.__parallaxTween){
                    try{ img.__parallaxTween.kill(); }catch(e){}
                    img.__parallaxTween = null;
                }
                gsap.to(img, {
                    x: 0, 
                    y: 0,
                    duration: 0.7,
                    ease: 'power2.out'
                });
            }
        }

        function animateSlideIn(index) {
            const slide = document.querySelectorAll('.swiper-slide')[index];

            if (slide) {
                const titleArea = slide.querySelector('.title-area');
                const disc = slide.querySelector('.disc');
                const btnWrap = slide.querySelector('.creative-btn--wrap');
                const img = slide.querySelector('img');

                // Imagen - velocidad más lenta y sutil (capa de fondo)
                if (img) {
                    gsap.set(img, {
                        scale: 1.08,
                        filter: 'blur(0px)'
                    });
                    // Zoom muy lento y suave
                    gsap.to(img, {
                        scale: 1.02,
                        duration: 12,
                        ease: 'none'
                    });
                }

                // Título - velocidad media-rápida (capa frontal)
                if (titleArea) {
                    gsap.fromTo(titleArea,
                        { 
                            opacity: 0, 
                            y: 60,
                            x: -30,
                            scale: 0.92
                        },
                        {
                            opacity: 1,
                            y: 0,
                            x: 0,
                            scale: 1,
                            duration: 1.3,
                            ease: 'power4.out',
                            delay: 0.15,
                            onStart: () => {
                                animateTitleTypewriter(index);
                            }
                        }
                    );
                }

                // Texto - velocidad intermedia (capa media)
                if (disc) {
                    gsap.fromTo(disc,
                        { 
                            opacity: 0, 
                            y: 80,
                            x: -25
                        },
                        {
                            opacity: 1,
                            y: 0,
                            x: 0,
                            duration: 1.6,
                            ease: 'power3.out',
                            delay: 0.25
                        }
                    );
                }

                // Botón - velocidad más lenta con bounce (capa más frontal)
                if (btnWrap) {
                    gsap.fromTo(btnWrap,
                        { 
                            opacity: 0, 
                            y: 100,
                            x: -20,
                            scale: 0.85
                        },
                        {
                            opacity: 1,
                            y: 0,
                            x: 0,
                            scale: 1,
                            duration: 1.8,
                            ease: 'back.out(1.4)',
                            delay: 0.35
                        }
                    );
                }

                // Parallax drift mejorado
                addParallaxDrift(slide);
            }
        }

        function animateSlideOut(index) {
            const slide = document.querySelectorAll('.swiper-slide')[index];

            if (slide) {
                const titleArea = slide.querySelector('.title-area');
                const disc = slide.querySelector('.disc');
                const btnWrap = slide.querySelector('.creative-btn--wrap');
                const img = slide.querySelector('img');

                clearParallaxDrift(slide);

                // NO animar la imagen - dejar que el fade de Swiper maneje la transición
                if (img) {
                    gsap.killTweensOf(img);
                }

                // Botón - sale primero y muy rápido (velocidad alta)
                if (btnWrap) {
                    gsap.to(btnWrap, {
                        opacity: 0,
                        y: -35,
                        x: 15,
                        scale: 0.9,
                        duration: 0.3,
                        ease: 'power3.in'
                    });
                }

                // Texto - sale después con velocidad media
                if (disc) {
                    gsap.to(disc, {
                        opacity: 0,
                        y: -25,
                        x: 12,
                        duration: 0.45,
                        ease: 'power2.in',
                        delay: 0.05
                    });
                }

                // Título - sale último y más lento (velocidad baja, mayor dramatismo)
                if (titleArea) {
                    gsap.to(titleArea, {
                        opacity: 0,
                        y: -20,
                        x: 20,
                        scale: 0.96,
                        duration: 0.6,
                        ease: 'power2.in',
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
    // Establecer bandera para desabilitar snap scroll
    isNavigatingFromButton = true;
    
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

    if (!containerId) {
        isNavigatingFromButton = false;
        return;
    }

    // Obtener el elemento destino
    const targetElement = document.getElementById(containerId);
    
    if (!targetElement) {
        isNavigatingFromButton = false;
        return;
    }

    // Habilitar scroll vertical
    document.body.classList.add('scroll-enabled');

    // Matar cualquier animación GSAP previa
    if(window.gsap && gsap.killTweensOf){
        gsap.killTweensOf(window);
    }

    // Usar scrollIntoView con start para mostrar el elemento desde arriba
    targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Permitir snap scroll de nuevo después del scroll
    setTimeout(() => {
        isNavigatingFromButton = false;
    }, 700);
}

function navigateToService(containerId) {
    isNavigatingFromButton = true;
    
    if (!containerId) {
        isNavigatingFromButton = false;
        return;
    }

    // Obtener el elemento destino
    const targetElement = document.getElementById(containerId);
    
    if (!targetElement) {
        isNavigatingFromButton = false;
        return;
    }

    // Usar scrollIntoView con start para mostrar el elemento desde arriba
    targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    // Permitir snap scroll de nuevo después del scroll
    setTimeout(() => {
        isNavigatingFromButton = false;
    }, 700);
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
            const subject = encodeURIComponent('Información sobre servicios PersonalSoft');
            const body = encodeURIComponent('Hola,\n\nMe interesa conocer más sobre los servicios de PersonalSoft.\n\nQuedo atento a sus comentarios.\n\nSaludos');
            if(email){
                window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
            }
        });
    }

    // Force GIF animation on page load
    function playGifs() {
        document.querySelectorAll('.lvl-gif').forEach(gif => {
            // Force browser to reload the GIF by resetting src
            const src = gif.src;
            gif.src = '';
            gif.offsetHeight; // Trigger reflow
            gif.src = src;
        });
    }

    // Play GIFs on load
    window.addEventListener('load', playGifs);
    // Replay GIFs to ensure animation continues
    setInterval(playGifs, 4000);
})();
