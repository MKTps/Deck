(function(){
    // Load floating menu include and initialize its behavior. Show menu only after slider-section.
    function getFSMItemsWithTarget(container){
        if(!container) return [];
        return Array.from(container.querySelectorAll('.fsm-item[data-target]'));
    }

    function getActiveFSMTarget(container){
        const navItems = getFSMItemsWithTarget(container).filter(item => !item.hasAttribute('data-download'));
        if(navItems.length === 0) return null;

        const viewportMarker = window.innerHeight * 0.35;
        let closest = null;

        navItems.forEach(item => {
            const targetId = item.getAttribute('data-target');
            const targetElement = targetId ? document.getElementById(targetId) : null;
            if(!targetElement) return;

            const rect = targetElement.getBoundingClientRect();
            const containsMarker = rect.top <= viewportMarker && rect.bottom > viewportMarker;

            if(containsMarker){
                closest = { id: targetId, distance: 0, inside: true };
                return;
            }

            if(closest && closest.inside) return;

            const distance = Math.abs(rect.top - viewportMarker);
            if(!closest || distance < closest.distance){
                closest = { id: targetId, distance, inside: false };
            }
        });

        return closest ? closest.id : null;
    }

    function setActiveFSMItem(container){
        if(!container) return;
        const activeTargetId = getActiveFSMTarget(container);
        const items = getFSMItemsWithTarget(container);

        items.forEach(item => {
            const isDownload = item.hasAttribute('data-download');
            const isActive = !isDownload && item.getAttribute('data-target') === activeTargetId;

            item.classList.toggle('fsm-item--active', isActive);
            item.setAttribute('aria-disabled', isActive ? 'true' : 'false');

            if(isActive){
                item.setAttribute('aria-current', 'page');
                item.setAttribute('tabindex', '-1');
            } else {
                item.removeAttribute('aria-current');
                item.setAttribute('tabindex', '0');
            }
        });
    }

    function initFSMListeners(container){
        const items = container.querySelectorAll('.fsm-item');
        items.forEach(item=>{
            item.addEventListener('click', ()=>{
                if(item.classList.contains('fsm-item--active') || item.getAttribute('aria-disabled') === 'true'){
                    return;
                }
                const target = item.getAttribute('data-target');
                const download = item.getAttribute('data-download');
                if(target){
                    smoothNavigateToElement(target);
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
            item.addEventListener('keydown', (e)=>{
                if(item.classList.contains('fsm-item--active') || item.getAttribute('aria-disabled') === 'true'){
                    return;
                }
                if(e.key === 'Enter' || e.key === ' '){
                    e.preventDefault();
                    item.click();
                }
            });
        });

        setActiveFSMItem(container);
    }

    let fsmLoaded = false;
    let fsmElement = null;

    function buildFSMHtml(){
        return `
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
        <li class="fsm-item fsm-item--download" tabindex="0" aria-label="Descargar Deck" id="fsm-download-btn" data-download="https://personalsoftsas-my.sharepoint.com/:b:/g/personal/analistamercadeo1_personalsoft_com/IQDS-yshZGMjSqvf9rFEpf7DAb7P4XqJXwogwHXNAhNIz6U?e=gKO718">
            <span class="fsm-icon"><i class="fa-solid fa-download"></i></span>
            <span class="fsm-tooltip">Descargar Deck</span>
        </li>
    </ul>
</nav>`;
    }

    function createFSMFromHtml(html){
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const nav = wrapper.querySelector('#floating-service-menu');
        if(!nav){
            throw new Error('Elemento #floating-service-menu no encontrado en HTML fallback.');
        }
        document.body.appendChild(nav);
        fsmLoaded = true;
        fsmElement = nav;
        initFSMListeners(nav);
        return nav;
    }

    function loadFSM(){
        if(fsmLoaded) return Promise.resolve(fsmElement);

        // Si la página se sirve vía file://, fetch no funciona en muchos navegadores.
        // En ese caso usamos un fallback inline para que funcione sin servidor.
        if(window.location.protocol === 'file:'){
            const html = buildFSMHtml();
            const nav = createFSMFromHtml(html);
            return Promise.resolve(nav);
        }

        return fetch('includes/floating-menu.html')
            .then(res => {
                if(!res.ok) throw new Error('No se pudo cargar el include: ' + res.status);
                return res.text();
            })
            .then(html => {
                return createFSMFromHtml(html);
            })
            .catch(err => {
                // Fallback inline when include path is missing or blocked (common on local servers).
                console.warn('Fallo al cargar include, usando fallback inline:', err);
                return createFSMFromHtml(buildFSMHtml());
            });
    }

    function checkScrollAndToggle(){
        // Show the floating menu only AFTER slider-section and when at first service section
        const sliderSection = document.getElementById('slider-section');
        const firstService = document.getElementById('service-container-1');
        
        if(!firstService || !sliderSection) return;
        
        const sliderRect = sliderSection.getBoundingClientRect();
        const serviceRect = firstService.getBoundingClientRect();
        
        // Show menu when slider is visible, after slider is passed, or when first service is visible
        const sliderInView = sliderRect.top < window.innerHeight && sliderRect.bottom > 0;
        const shouldShow = sliderInView ||
                  (sliderRect.bottom < 0) ||
                  (serviceRect.top < window.innerHeight * 0.7 && serviceRect.bottom > 0);
        
        if(shouldShow){
            // show
            if(!fsmLoaded){
                loadFSM().catch(()=>{}).then(nav=>{
                    if(nav){
                        nav.classList.remove('fsm-hidden');
                        nav.classList.add('fsm-visible');
                        setActiveFSMItem(nav);
                    }
                });
            } else if(fsmElement){
                fsmElement.classList.remove('fsm-hidden');
                fsmElement.classList.add('fsm-visible');
                setActiveFSMItem(fsmElement);
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

                // Lightweight opacity pulse for orbs (better performance)
                orbs.forEach((orb, idx) => {
                    if(!orb) return;
                    const durations = [2.8, 3.4, 3.9];
                    const delays = [0, 0.5, 1];
                    gsap.to(orb, {
                        opacity: 0,
                        duration: durations[idx],
                        delay: delays[idx],
                        ease: 'sine.inOut',
                        yoyo: true,
                        repeat: -1
                    });
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
                            scrollTrigger: {
                                trigger: el,
                                start: 'top 80%',
                                end: 'bottom 20%',
                                toggleActions: 'play reverse play reverse',
                                anticipatePin: 1,
                                invalidateOnRefresh: true
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
                            const isFeatureCard = el.classList.contains('feature-card');
                            // Parallax intensity: title moves less, buttons move more
                            const parallaxMultiplier = 1 + (index * 0.15);
                            
                            // Sequential reveal animation
                            gsap.fromTo(el,
                                { opacity: 0, y: 30 },
                                {
                                    opacity: 1,
                                    y: 0,
                                    duration: 2.6,
                                    delay: index * 0.85,
                                    ease: 'power2.out',
                                    scrollTrigger: {
                                        trigger: section,
                                        start: 'top 75%',
                                        end: 'bottom 25%',
                                        toggleActions: 'play reverse play reverse',
                                        anticipatePin: 1,
                                        invalidateOnRefresh: true
                                    }
                                }
                            );
                            
                            // Parallax scroll effect (omit for feature cards to keep hover/float smooth)
                            if(!isFeatureCard){
                                gsap.to(el, {
                                    y: () => 34 * parallaxMultiplier,
                                    ease: 'none',
                                    scrollTrigger: {
                                        trigger: section,
                                        start: 'top bottom',
                                        end: 'bottom top',
                                        scrub: 0.5
                                    }
                                });
                            }
                        });
                    }
                });

                // Background parallax for service and final sections
                document.querySelectorAll('.service-detail, .commercial-card-section').forEach(section => {
                    gsap.fromTo(section,
                        { backgroundPosition: '50% 42%' },
                        {
                            backgroundPosition: '50% 62%',
                            ease: 'none',
                            scrollTrigger: {
                                trigger: section,
                                start: 'top bottom',
                                end: 'bottom top',
                                scrub: 0.8,
                                anticipatePin: 1
                            }
                        }
                    );
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
                
                // Refresh inicial después de configurar todas las animaciones
                setTimeout(() => {
                    ScrollTrigger.refresh(true);
                }, 100);
                
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
        
        // Refresh final después de que todo el DOM esté inicializado
        setTimeout(() => {
            try{
                if(window.ScrollTrigger){
                    ScrollTrigger.refresh(true);
                }
            }catch(e){}
        }, 250);

    });

})();
// ============================================
// SCROLL AL TOP AL CARGAR LA PÃGINA
// ============================================
if (window.history.scrollRestoration) {
    window.history.scrollRestoration = 'manual';
}

// Si la página se carga con un hash (sección específica), no hacer scroll al top
if (!window.location.hash) {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
} else {
    // Si hay hash, hacer refresh adicional después de navegar
    setTimeout(() => {
        try{
            if(window.ScrollTrigger){
                ScrollTrigger.refresh(true);
                // Forzar trigger de animaciones para elementos visibles
                ScrollTrigger.getAll().forEach(st => st.refresh());
            }
        }catch(e){}
    }, 500);
}

// ============================================
// VARIABLES GLOBALES
// ============================================
let swiper;
let introCompleted = false;
let timerInterval;
let timeLeft = 30;
let isNavigatingFromButton = false;

// ============================================
// NAVEGACIÓN SUAVE UNIFICADA
// ============================================
function smoothNavigateToElement(targetId) {
    // Establecer bandera para desabilitar snap scroll
    isNavigatingFromButton = true;
    
    // Detener autoplay del swiper
    if (window.swiper && window.swiper.autoplay) {
        window.swiper.autoplay.stop();
    }

    // Obtener el elemento destino
    const targetElement = document.getElementById(targetId);
    
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
        
        // Refresh ScrollTrigger y forzar update de elementos visibles
        try{ 
            if(window.ScrollTrigger){ 
                ScrollTrigger.refresh(true);
                
                // Forzar un segundo refresh después de un breve delay para asegurar que todo esté listo
                setTimeout(() => {
                    ScrollTrigger.refresh(true);
                    // Forzar update de todos los ScrollTriggers para elementos ya visibles
                    ScrollTrigger.getAll().forEach(st => {
                        if(st.progress > 0) st.update();
                    });
                }, 100);
            }
        }catch(e){}
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
// VIDEO YOUTUBE / LOCAL API
// ============================================
let youtubePlayer;
let videoElement;
let isMuted = true;
let videoPlayAttempted = false;
let playOverlay;
let youtubePlayerReady = false;

function isYouTubeApiPlayer(player){
    return player && typeof player.playVideo === 'function';
}

function isHtml5Video(player){
    return player && typeof player.play === 'function';
}

function setMutedState(muted){
    isMuted = muted;
    if(isYouTubeApiPlayer(youtubePlayer)){
        if(muted){
            youtubePlayer.mute();
        }else{
            youtubePlayer.unMute();
            youtubePlayer.setVolume(100);
        }
        return;
    }
    if(isHtml5Video(videoElement)){
        videoElement.muted = muted;
    }
}

// Función para intentar reproducir el video
function attemptVideoPlay() {
    if (videoPlayAttempted) return;
    videoPlayAttempted = true;

    if (isYouTubeApiPlayer(youtubePlayer)){
        setMutedState(true);
        try{
            youtubePlayer.playVideo();
        }catch(e){}
        if (playOverlay) {
            playOverlay.style.display = 'none';
        }
        return;
    }

    if (!isHtml5Video(videoElement)) return;

    videoElement.muted = true; // Asegurar que esté muted
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('✓ Video reproduciendo correctamente');
            if (playOverlay) {
                playOverlay.style.display = 'none';
            }
        }).catch(err => {
            console.log('⚠ Autoplay bloqueado, mostrando overlay...', err);
            if (playOverlay) {
                playOverlay.style.display = 'flex';
            }
            setTimeout(() => {
                videoElement.play().catch(() => {
                    console.log('⚠ Requiere interacción del usuario');
                    if (playOverlay) {
                        playOverlay.style.display = 'flex';
                    }
                });
            }, 100);
        });
    }
}

function initYouTubePlayer(){
    const iframe = document.getElementById('intro-video');
    if(!iframe || !window.YT || !YT.Player) return;

    youtubePlayer = new YT.Player('intro-video', {
        playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            cc_load_policy: 0,
            color: 'white',
            origin: window.location.origin
        },
        events: {
            onReady: function(){
                youtubePlayerReady = true;
                setMutedState(true);
                attemptVideoPlay();
            },
            onStateChange: function(event){
                if(window.YT && event.data === YT.PlayerState.ENDED){
                    skipIntro();
                }
                if(window.YT && event.data === YT.PlayerState.PLAYING){
                    if (playOverlay) {
                        playOverlay.style.display = 'none';
                    }
                }
            },
            onError: function(e){
                console.error('❌ Error al cargar el video:', e);
            }
        }
    });
}

window.onYouTubeIframeAPIReady = function(){
    initYouTubePlayer();
};

// Esperar a que el DOM esté listo para acceder al video
document.addEventListener('DOMContentLoaded', function() {
    // En mobile, saltar intro automáticamente
    if (window.innerWidth <= 768) {
        skipIntro();
        return;
    }
    
    videoElement = document.getElementById('intro-video');
    playOverlay = document.getElementById('video-play-overlay');

    // ============================================
    // AUDIO TOGGLE
    // ============================================
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');

    if (audioToggleBtn && audioIcon) {
        audioToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que active el skip
            const nextMutedState = !isMuted;
            setMutedState(nextMutedState);

            if (!nextMutedState) {
                if (isYouTubeApiPlayer(youtubePlayer)) {
                    try{ youtubePlayer.playVideo(); }catch(e){}
                } else if (isHtml5Video(videoElement)) {
                    videoElement.play().catch(() => {});
                }
            }
            
            audioIcon.innerHTML = isMuted
                ? '<i class="fa-solid fa-volume-xmark"></i>'
                : '<i class="fa-solid fa-volume-high"></i>';
        });
    }

    // Si es un video HTML5, registramos eventos locales
    if (isHtml5Video(videoElement)) {
        videoElement.addEventListener('ended', skipIntro);
        videoElement.addEventListener('playing', function() {
            console.log('✓ Video playing event disparado');
            if (playOverlay) {
                playOverlay.style.display = 'none';
            }
        }, { once: true });
        videoElement.addEventListener('error', function(e) {
            console.error('❌ Error al cargar el video:', e);
        });
        videoElement.addEventListener('canplay', function() {
            console.log('✓ Video listo para reproducir');
            attemptVideoPlay();
        }, { once: true });
        attemptVideoPlay();
    }

    // Si el API ya está listo, inicializar YouTube inmediatamente
    if (window.YT && YT.Player && !youtubePlayerReady) {
        initYouTubePlayer();
    }

    // Click en el overlay para reproducir el video
    if (playOverlay) {
        playOverlay.addEventListener('click', function() {
            if (isYouTubeApiPlayer(youtubePlayer)){
                setMutedState(true);
                try{ youtubePlayer.playVideo(); }catch(e){}
                playOverlay.style.display = 'none';
                return;
            }
            if (isHtml5Video(videoElement)) {
                videoElement.muted = true;
                videoElement.play().then(() => {
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
        if (isHtml5Video(videoElement) && videoElement.paused) {
            console.log('⟳ Reintentando reproducción después del load...');
            attemptVideoPlay();
        }
    }, 600);
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
                // Detectar dirección del movimiento (invertida)
                const activeIndex = this.activeIndex;
                const previousIndex = this.previousIndex;
                const direction = activeIndex > previousIndex ? 'prev' : 'next';
                
                // Iniciar animación de entrada del nuevo slide inmediatamente
                setTimeout(() => {
                    animateSlideIn(activeIndex, direction);
                }, 100);
                // Animar salida del slide anterior
                animateSlideOut(previousIndex, direction);
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
    const scrollIndicator = document.querySelector('.slider-scroll-indicator');
    
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
    
    // Mobile scroll indicator (pasar al siguiente slide)
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            swiper.slideNext();
            pauseOnNavigation();
        });
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

            function animateModalActiveState(tabContent){
                if(!tabContent) return;

                tabContent.classList.remove('tab-enter');
                void tabContent.offsetWidth;
                tabContent.classList.add('tab-enter');

                const allSlides = tabContent.querySelectorAll('.modal-slide');
                const activeSlide = tabContent.querySelector('.modal-slide.active');

                allSlides.forEach(slide => {
                    slide.classList.remove('is-active-visual');
                });

                if(activeSlide){
                    void activeSlide.offsetWidth;
                    activeSlide.classList.add('is-active-visual');
                }

                if(!window.gsap) return;

                const leftColumn = tabContent.querySelector('.modal-content-left');
                const rightColumn = tabContent.querySelector('.modal-content-right');
                const heading = activeSlide ? activeSlide.querySelector('h4') : null;
                const text = activeSlide ? activeSlide.querySelector('p') : null;
                const image = tabContent.querySelector('.modal-graphic-image');
                const slideNav = tabContent.querySelector('.modal-slide__nav');
                const slideCounter = tabContent.querySelector('.modal-slide__counter');

                const slides = tabContent.querySelectorAll('.modal-slide');
                const slideIndex = activeSlide ? Array.from(slides).indexOf(activeSlide) : 0;
                const timingVariants = [
                    { baseDelay: 0.02, leftDur: 0.46, slideDur: 0.5, rightDur: 0.62, textDur: 0.48, imageDur: 0.66 },
                    { baseDelay: 0.06, leftDur: 0.54, slideDur: 0.58, rightDur: 0.7, textDur: 0.56, imageDur: 0.74 },
                    { baseDelay: 0.1, leftDur: 0.6, slideDur: 0.64, rightDur: 0.78, textDur: 0.62, imageDur: 0.82 }
                ];
                const timing = timingVariants[Math.abs(slideIndex) % timingVariants.length];

                const animTargets = [leftColumn, rightColumn, activeSlide, heading, text, image, slideNav, slideCounter].filter(Boolean);
                if(animTargets.length > 0){
                    gsap.killTweensOf(animTargets);
                }

                if(leftColumn){
                    gsap.fromTo(leftColumn,
                        { opacity: 0, x: -26 },
                        { opacity: 1, x: 0, duration: timing.leftDur, delay: timing.baseDelay, ease: 'power3.out' }
                    );
                }

                if(activeSlide){
                    gsap.fromTo(activeSlide,
                        { opacity: 0, y: 20, scale: 0.98 },
                        { opacity: 1, y: 0, scale: 1, duration: timing.slideDur, delay: timing.baseDelay + 0.06, ease: 'power2.out' }
                    );
                }

                if(heading){
                    gsap.fromTo(heading,
                        { opacity: 0, y: 10 },
                        { opacity: 1, y: 0, duration: 0.36, ease: 'power2.out', delay: timing.baseDelay + 0.14 }
                    );
                }

                if(text){
                    gsap.fromTo(text,
                        { opacity: 0, y: 14 },
                        { opacity: 1, y: 0, duration: timing.textDur, ease: 'power2.out', delay: timing.baseDelay + 0.2 }
                    );
                }

                if(slideNav){
                    gsap.fromTo(slideNav,
                        { opacity: 0, y: 12 },
                        { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', delay: timing.baseDelay + 0.28 }
                    );
                }

                if(slideCounter){
                    gsap.fromTo(slideCounter,
                        { opacity: 0, y: 8 },
                        { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out', delay: timing.baseDelay + 0.34 }
                    );
                }

                if(rightColumn){
                    gsap.fromTo(rightColumn,
                        { opacity: 0, x: 26, scale: 0.96 },
                        { opacity: 1, x: 0, scale: 1, duration: timing.rightDur, delay: timing.baseDelay + 0.12, ease: 'power3.out' }
                    );
                }

                if(image){
                    gsap.fromTo(image,
                        { opacity: 0, x: 18, scale: 0.95 },
                        { opacity: 1, x: 0, scale: 1, duration: timing.imageDur, ease: 'power3.out', delay: timing.baseDelay + 0.24 }
                    );
                }
            }

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
                                animateModalActiveState(activeContent);
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

                    const initialActive = modal.querySelector('.modal-tab__content.active');
                    if(initialActive){
                        updateSlideCounter(initialActive);
                        animateModalActiveState(initialActive);
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
                animateModalActiveState(tabContent);
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
                featureModal.removeAttribute('inert');
                document.body.classList.add('no-scroll');

                const panel = featureModal.querySelector('.feature-modal__panel');
                const backdrop = featureModal.querySelector('.feature-modal__backdrop');
                const tabs = featureModal.querySelector('.modal-tabs');

                // Animación de apertura estilo app iPhone
                if(window.gsap){
                    gsap.killTweensOf([featureModal, panel, backdrop, tabs]);

                    const tl = gsap.timeline();
                    tl.set(panel, {
                        transformOrigin: 'center center',
                        willChange: 'transform, opacity, filter, border-radius'
                    });
                    tl.set(tabs, { willChange: 'transform, opacity' });
                    tl.fromTo(backdrop,
                        { opacity: 0 },
                        { opacity: 1, duration: 0.28, ease: 'power2.out' },
                        0
                    );
                    tl.fromTo(panel,
                        {
                            opacity: 0,
                            scale: 0.82,
                            y: 34,
                            filter: 'blur(16px)',
                            borderRadius: '36px'
                        },
                        {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            borderRadius: '0px',
                            duration: 0.62,
                            ease: 'back.out(1.18)',
                            clearProps: 'willChange'
                        },
                        0
                    );
                    tl.fromTo(tabs,
                        { opacity: 0, y: 24, scale: 0.985 },
                        { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out', clearProps: 'willChange' },
                        0.16
                    );
                }

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

                const activeContent = featureModal.querySelector('.modal-tab__content.active');
                if(activeContent){
                    setTimeout(() => {
                        animateModalActiveState(activeContent);
                    }, 110);
                }
            }

            function closeFeatureModal(featureModal){
                if(!featureModal) return;

                // Desenfocar elementos dentro del modal antes de cerrarlo
                const focusedElement = featureModal.querySelector(':focus');
                if(focusedElement){
                    focusedElement.blur();
                }

                const panel = featureModal.querySelector('.feature-modal__panel');
                const backdrop = featureModal.querySelector('.feature-modal__backdrop');
                const tabs = featureModal.querySelector('.modal-tabs');

                if(window.gsap){
                    gsap.killTweensOf([featureModal, panel, backdrop, tabs]);

                    const tl = gsap.timeline({
                        onComplete: () => {
                            featureModal.setAttribute('aria-hidden', 'true');
                            featureModal.setAttribute('inert', '');
                            document.body.classList.remove('no-scroll');
                        }
                    });

                    tl.fromTo(tabs,
                        { opacity: 1, y: 0, scale: 1 },
                        { opacity: 0, y: 8, scale: 0.99, duration: 0.2, ease: 'power2.in' },
                        0
                    );
                    tl.fromTo(panel,
                        { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', borderRadius: '0px' },
                        {
                            opacity: 0,
                            scale: 0.86,
                            y: 30,
                            filter: 'blur(14px)',
                            borderRadius: '34px',
                            duration: 0.34,
                            ease: 'power3.in'
                        },
                        0.04
                    );
                    tl.fromTo(backdrop,
                        { opacity: 1 },
                        { opacity: 0, duration: 0.28, ease: 'power2.in' },
                        0.06
                    );
                } else {
                    featureModal.setAttribute('aria-hidden', 'true');
                    featureModal.setAttribute('inert', '');
                    document.body.classList.remove('no-scroll');
                }
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

        function animateSlideIn(index, direction = 'next') {
            const slide = document.querySelectorAll('.swiper-slide')[index];
            const fromX = direction === 'next' ? -30 : 30;  // Desde izquierda si es next, desde derecha si es prev

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
                            x: fromX,
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
                            x: direction === 'next' ? -25 : 25
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
                            x: direction === 'next' ? -20 : 20,
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

        function animateSlideOut(index, direction = 'next') {
            const slide = document.querySelectorAll('.swiper-slide')[index];
            const toX = direction === 'next' ? 20 : -20;  // Hacia derecha si es next, hacia izquierda si es prev

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
                        x: toX,
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
                        x: toX,
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
                        x: toX,
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
    // Determinar el contenedor correcto basado en el servicio
    let containerId;
    if (targetId === 'service1') containerId = 'service-container-1';
    else if (targetId === 'service2') containerId = 'service-container-2';
    else if (targetId === 'service3') containerId = 'service-container-3';
    else if (targetId === 'service4') containerId = 'service-container-4';

    if (!containerId) {
        return;
    }

    // Usar la función de navegación unificada
    smoothNavigateToElement(containerId);
}

function navigateToService(containerId) {
    if (!containerId) {
        return;
    }

    // Usar la función de navegación unificada
    smoothNavigateToElement(containerId);
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

    // Download Deck button
    const downloadBtn = document.querySelector('.commercial-card__btn-download');
    if(downloadBtn){
        downloadBtn.addEventListener('click', function(){
            const downloadUrl = this.getAttribute('data-download');
            if(downloadUrl){
                window.open(downloadUrl, '_blank');
            }
        });
    }

    // ============================================
    // BOTTOM APP NAV - NAVEGACIÓN MÓVIL
    // ============================================
    function initBottomAppNav() {
        const bottomNavItems = document.querySelectorAll('.bottom-app-nav__item');
        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                if(href && href.startsWith('#')){
                    let targetId = href.substring(1);
                    
                    // Mapear serviceX a service-container-X para consistencia
                    if (targetId === 'service1') targetId = 'service-container-1';
                    else if (targetId === 'service2') targetId = 'service-container-2';
                    else if (targetId === 'service3') targetId = 'service-container-3';
                    else if (targetId === 'service4') targetId = 'service-container-4';
                    
                    smoothNavigateToElement(targetId);
                }
            });
        });
    }
    
    // Inicializar bottom app nav
    initBottomAppNav();

    // Ensure LVL videos autoplay consistently
    function initLvlVideos() {
        document.querySelectorAll('video.lvl-gif').forEach(video => {
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.autoplay = true;

            const playPromise = video.play();
            if(playPromise && typeof playPromise.catch === 'function'){
                playPromise.catch(() => {});
            }
        });
    }

    window.addEventListener('load', initLvlVideos);
    document.addEventListener('visibilitychange', () => {
        if(document.visibilityState === 'visible'){
            initLvlVideos();
        }
    });
})();
