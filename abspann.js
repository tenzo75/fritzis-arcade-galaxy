//abspann.js

import { fadeInSound, fadeOutSound, stopSound } from './launcherSound.js';

// === GLOBALE VARIABLEN ===
let videoWrapper = null;
let creditsContainer = null;
let starAnimationId = null;
let creditsAnimationId = null;
let stars = [];

// === HAUPTSTEUERUNG ===

export function initAbspann(canvas, ctx) {
    createSimpleStars(canvas);
    animateSimpleStars(ctx);

    const startVerzoegerung = 200;
    const musikFadeinDauer = 4000;
    const epischerMoment = 6000;

    setTimeout(() => {
        fadeInSound('credits_music', musikFadeinDauer);
        setTimeout(() => {
            // Starte die Kette mit dem ERSTEN Video
            playFirstVideo(canvas);
        }, epischerMoment);
    }, startVerzoegerung);
}

// === LOGIK-FUNKTIONEN ===

/**
 * Spielt das erste Video ab.AI background remover
 * @param {HTMLCanvasElement} canvas
 */
function playFirstVideo(canvas) {
    const videoOptions = {
        sideImage: 'images/rocket.png',
        sideImageTimer: 9000
    };

    playVideo('videos/abspann.mp4', canvas, () => {
        const flightDuration = 3000;
        const video1Element = videoWrapper.querySelector('video');
        const imageElement = videoWrapper.querySelector('img');

        if (!video1Element || !imageElement) {
            playSecondVideo(canvas);
            return;
        }

        imageElement.style.left = imageElement.offsetLeft + 'px';
        imageElement.style.right = 'auto';
        video1Element.style.transition = 'opacity 0.5s';
        video1Element.style.opacity = '0';
        imageElement.style.transition = `left ${flightDuration / 1000}s ease-in-out, transform ${flightDuration / 1000}s ease-in-out`;

        setTimeout(() => {
            imageElement.style.left = '50%';
            imageElement.style.transform = 'translate(-50%, -50%)';
        }, 50);

        const video2Element = document.createElement('video');
        video2Element.src = 'videos/rakete.mp4';
        video2Element.autoplay = false;
        video2Element.muted = false;
        video2Element.style.cssText = video1Element.style.cssText;
        video2Element.style.opacity = '0';
        video2Element.style.transition = 'opacity 5.5s ease-in-out';

        video2Element.onended = () => {
            const fadeDauer = 2500;
            const pauseDauer = 500;
            if (videoWrapper) {
                videoWrapper.style.opacity = '0';
            }
            setTimeout(() => {
                cleanupVideo();
                setTimeout(() => {
                    startCreditScroll(canvas);
                }, pauseDauer);
            }, fadeDauer);
        };

        // Warte, bis der Flug in die Mitte abgeschlossen ist
        setTimeout(() => {
            const zoomDuration = 3500; // Dauer für Zoom und Überblendung

            // VORBEREITUNG
            // 1. Altes Video entfernen und neues (noch unsichtbares) Video hinzufügen.
            videoWrapper.removeChild(video1Element);
            videoWrapper.appendChild(video2Element);

            // 2. Bild für die finale Animation vorbereiten.
            imageElement.style.transition = `
                transform ${zoomDuration / 1000}s ease-in-out,
                opacity ${zoomDuration / 1000}s ease-in-out
            `;

            // START DER ANIMATION
            // 3. Gib dem Browser einen winzigen Moment Zeit, die Vorbereitung zu verarbeiten.
            setTimeout(() => {
                // 4. Starte JETZT alle Animationen gleichzeitig:
                // a) Rakete zoomen und ausblenden
                imageElement.style.transform = 'translate(-50%, -50%) scale(1.6)';
                imageElement.style.opacity = '0';

                // b) Video 2 einblenden und abspielen
                video2Element.style.opacity = '1';
                video2Element.play();
            }, 50); // Diese 50ms sind der entscheidende Trick!

        }, flightDuration);

    }, videoOptions);
}


function playSecondVideo(canvas) {
    playVideo('videos/rakete.mp4', canvas, () => {
        // Diese Logik für den Übergang zum Lauftext bleibt unverändert
        const fadeDauer = 1500;
        const pauseDauer = 500;

        if (videoWrapper) {
            videoWrapper.style.opacity = '0';
        }
        setTimeout(() => {
            cleanupVideo();
            setTimeout(() => {
                startCreditScroll(canvas);
            }, pauseDauer);
        }, fadeDauer);
    }); // Keine Optionen mehr hier
}

/**
 * Eine allgemeine Funktion, um ein Video abzuspielen.
 * @param {string} src - Der Pfad zur Videodatei.
 * @param {HTMLCanvasElement} canvas - Das Canvas-Element.
 * @param {Function} onEndedCallback - Die Funktion, die am Ende aufgerufen wird.
 */
function playVideo(src, canvas, onEndedCallback, options) {
    cleanupVideo();
    const fadeDauer = 1500; // Dauer für Einblendungen in ms

    videoWrapper = document.createElement('div');
    // Wrapper hat keine Flexbox-Befehle mehr
    videoWrapper.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; z-index:100; opacity:0; transition:opacity ${fadeDauer / 1000}s ease-in-out;`;

    const videoElement = document.createElement('video');
    videoElement.src = src;
    videoElement.autoplay = false;
    videoElement.muted = false;
    // Video wird exakt in der Mitte positioniert
    videoElement.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); height:80%; width:auto;';

    if (onEndedCallback) {
        videoElement.onended = onEndedCallback;
    }

    videoWrapper.appendChild(videoElement);

    // Logik für das seitliche Bild
    if (options && options.sideImage) {
        const imageElement = document.createElement('img');
        imageElement.src = options.sideImage;
        // Bild wird rechts positioniert
        imageElement.style.cssText = 'position:absolute; top:50%; right:10%; transform:translateY(-50%); height:55%; opacity:0; transition: opacity 5.5s ease-in-out;';
        videoWrapper.appendChild(imageElement);

        // Timer, um das Bild nach der angegebenen Zeit einzublenden
        setTimeout(() => {
            imageElement.style.opacity = '1';
        }, options.sideImageTimer || 0);
    }

    canvas.parentElement.appendChild(videoWrapper);

    // Blende den Wrapper ein
    setTimeout(() => {
        if (videoWrapper) {
            videoWrapper.style.opacity = '1';
        }

        // Starte das Video erst, NACHDEM die Einblendung abgeschlossen ist
        setTimeout(() => {
            videoElement.play().catch(e => console.error("Video konnte nicht gestartet werden:", e));
        }, fadeDauer);

    }, 100);
}

/**
 * Erstellt den Lauftext und startet die manuelle Scroll-Animation.
 * @param {HTMLCanvasElement} canvas
 */
function startCreditScroll(canvas) {
    const screenContainer = canvas.parentElement;
    if (!screenContainer) return;

    creditsContainer = document.createElement('div');
    creditsContainer.id = 'credits-container';
    const creditsContent = document.createElement('div');
    creditsContent.id = 'credits-content';

    creditsContent.innerHTML = `
        <h2>Fritzi's Arcade Galaxy</h2><br>
        <p>Ein Projekt von</p><h3>Tenzo</h3><br><br>
        <p>Das Gehirn des Projekt</p><h3>Google Gemini 2.5 Pro</h3><h3>Dreamina Ai</h3><br><br>
        <p>Hilfsarbeiter der KI</p><h3>Tenzo</h3><br><br>
        <p>Besonderer Dank an</p>
        <h3>Panikfee für die vielen Stunden tolles GTA RP und die tollen Charaktere und deren Ausarbeitung.</h3><br><br>
        <p>Verwendete Musik</p><h3>Werld - Like a Rocket</h3><h3>Leila - Gun to my Heart</h3><h3>Michael Sembello - Maniac (Official Instrumental)</h3><h3>Computerjockeys - My Golden Boy</h3><h3>Klaudir Koks</h3><br><br>
        <p>Soundeffekt von</p><h3>Pixabay.com</h3><br><br>
        <p>Verwendete Open Source Platformen</p><h3>Github.com</h3><h3>supabase.com</h3><br><br>
        <p>Schrift-Lizenz</p><h3>SIL Open Font License</h3><br><br>
        <p>Benutze Technologien</p><h3>JavaScript</h3><h3>HTML5</h3><h3>CSS</h3><br><br>
        <h2>Danke fürs Spielen!</h2>
    `;
    
    creditsContainer.appendChild(creditsContent);
    screenContainer.appendChild(creditsContainer);
    
    // ======== NEUER TEIL START ========
    // Starte den Container unsichtbar und bereite die Animation vor
    creditsContainer.style.opacity = '0';
    creditsContainer.style.transition = 'opacity 1.5s ease-in-out';

    // Blende den Container nach einem kurzen Moment ein
    setTimeout(() => {
        creditsContainer.style.opacity = '1';
    }, 100);
    // ======== NEUER TEIL ENDE ========

    let positionY = canvas.height;
    const scrollSpeed = 1.0;
    const creditsHeight = creditsContent.offsetHeight;

    function scrollLoop() {
        positionY -= scrollSpeed;
        creditsContent.style.transform = `rotateX(12deg) translateY(${positionY}px)`;

        if ((positionY + creditsHeight) < 0) {
            handleCreditsEnd(canvas);
            return;
        }
        creditsAnimationId = requestAnimationFrame(scrollLoop);
    }
    scrollLoop();
}

function handleCreditsEnd(canvas) {
    console.log("Lauftext beendet. Starte Endsequenz...");

    const textFadeDauer = 1500;     // 1.5 Sekunden zum Ausblenden des Textes
    const musikFadeoutDauer = 4000; // 4 Sekunden zum Ausblenden der Musik
    const endPause = 2000;          // 2 Sekunden Pause nach der Musik

    // 1. Blende den Lauftext sanft aus.
    if (creditsContainer) {
        // Die 'transition'-Eigenschaft wurde schon beim Einblenden gesetzt,
        // wir müssen sie hier also nicht erneut deklarieren.
        creditsContainer.style.opacity = '0';

        // 2. Räume den Text-Container erst auf, nachdem er unsichtbar ist.
        setTimeout(cleanupCredits, textFadeDauer);
    }

    // 3. Starte das Ausblenden der Musik und danach den TV-Effekt.
    // Diese Logik läuft parallel zum Ausblenden des Textes.
    fadeOutSound('credits_music', musikFadeoutDauer, () => {
        console.log("Musik ausgeblendet. Starte 2s Pause...");
        setTimeout(() => {
            animateTVOff(canvas.getContext('2d'));
        }, endPause);
    });
}

/**
 * Erstellt die Sterne für den Hintergrund.
 * @param {HTMLCanvasElement} canvas
 */
function createSimpleStars(canvas) {
    const starCount = 200;
    stars = [];
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

/**
 * Animiert den durchgehenden Sternenhimmel.
 * @param {CanvasRenderingContext2D} ctx
 */
function animateSimpleStars(ctx) {
    const canvas = ctx.canvas;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    for (const star of stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    starAnimationId = requestAnimationFrame(() => animateSimpleStars(ctx));
}

/**
 * Animiert den TV-Abschalt-Effekt.
 * @param {CanvasRenderingContext2D} ctx
 */
function animateTVOff(ctx) {
    cancelAnimationFrame(starAnimationId);
    const canvas = ctx.canvas;
    let effectStrength = 1.0;
    const noiseData = ctx.createImageData(canvas.width, canvas.height);
    const buffer = new Uint32Array(noiseData.data.buffer);
    for (let i = 0; i < buffer.length; i++) {
        if (Math.random() > 0.8) {
            buffer[i] = 0xFFFFFFFF;
        }
    }

    function squeezeEffect() {
        effectStrength -= 0.02;
        if (effectStrength <= 0) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            resetGame();
            return;
        }
        ctx.putImageData(noiseData, 0, 0);
        const scaleY = effectStrength * effectStrength;
        const top = (canvas.height / 2) * (1 - scaleY);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, top);
        ctx.fillRect(0, canvas.height - top, canvas.width, top);
        requestAnimationFrame(squeezeEffect);
    }
    squeezeEffect();
}

/**
 * Startet den Neustart der Seite nach einer Pause.
 */
function resetGame() {
    console.log("Neustart in 2 Sekunden...");
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}

// === AUFRÄUM-FUNKTIONEN ===

function cleanupVideo() {
    if (videoWrapper && videoWrapper.parentNode) {
        videoWrapper.parentNode.removeChild(videoWrapper);
        videoWrapper = null;
    }
}

function cleanupCredits() {
    if (creditsContainer && creditsContainer.parentNode) {
        creditsContainer.parentNode.removeChild(creditsContainer);
        creditsContainer = null;
    }
}

/**
 * Räumt alle Elemente auf (wird z.B. bei ESC aufgerufen).
 */
export function cleanup() {
    if (starAnimationId) {
        cancelAnimationFrame(starAnimationId);
    }
    if (creditsAnimationId) {
        cancelAnimationFrame(creditsAnimationId);
    }
    cleanupVideo();
    cleanupCredits();
    stopSound('credits_music');
    console.log("Abspann-Elemente und Musik aufgeräumt.");
}