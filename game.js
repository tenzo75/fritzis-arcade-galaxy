/* In Hauptverzeichnis/game.js */

import { initIntroElements, startIntro, skipIntro, showGameSelectionMenu, hideFullIntroOverlay } from './introManager.js';
import { initializeInputSystem } from './input.js';
import { startBootSequence, stopBootSequence } from './boot.js';
import { initLauncherSounds, unlockAudio, playSound, stopSound, fadeOutSound, fadeInSound } from './launcherSound.js';
import { createPixelStorm, drawParticles, updateParticles } from './pixel-storm.js';
import { initBackground, drawAndAnimateBackground } from './background.js';
import { initLandingSequence, startLandingSequence, updateAndDrawLandingSequence, isLandingSequenceActive } from './landing-sequence.js';

let consoleGameState = 'off';
let activeGameId = null;
let activeGameModule = null;
let selectableMenuItems = [];
let currentFocusedMenuItemIndex = -1;
let boundHandleMenuKeyDown = null;
let stormParticles = [];
let stormAnimationId = null;
let launcherAnimationId = null;
let isMenuSelectionActive = false;
let isCrossfading = false;
let crossfadeAlpha = 0.0; // Steuert die Transparenz (0 = unsichtbar, 1 = voll sichtbar)

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const bootOverlayElements = document.getElementById('boot-overlay-elements');
const powerOnMessage = document.getElementById('power-on-message'); // Hinzugefügt für die HTML-Startnachricht
const BASE_ARCADE_WIDTH = 1558;
const BASE_ARCADE_HEIGHT = 890;

function loadGameCss(cssPath) {
    unloadGameCss();
    const head = document.head;
    const link = document.createElement('link');
    link.id = 'dynamic-game-style';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = cssPath;
    head.appendChild(link);
}

function unloadGameCss() {
    const gameStyle = document.getElementById('dynamic-game-style');
    if (gameStyle) {
        gameStyle.remove();
    }
}

function startStarWarsIntroPhase() {
    consoleGameState = 'intro';
    initIntroElements();
    startIntro(_onIntroFinished);
}

function transitionLoop(currentTime) { // <--- Parameter hier hinzufügen
    // 1. Zeichne immer den Hintergrund der Flugsequenz als unterste Ebene
    updateAndDrawLandingSequence(ctx, canvas);

    // 2. Wenn die Überblendung aktiv ist, zeichne den zweiten Hintergrund darüber
    if (isCrossfading) {
        if (crossfadeAlpha < 1.0) {
            crossfadeAlpha += 0.01; // Fade-Geschwindigkeit
        }
        crossfadeAlpha = Math.min(crossfadeAlpha, 1.0);

        ctx.globalAlpha = crossfadeAlpha;
        // HIER wird currentTime jetzt korrekt übergeben
        drawAndAnimateBackground(ctx, canvas, currentTime); 
        ctx.globalAlpha = 1.0;
    }

    // 3. Zeichne die Partikel der Explosion ganz oben drauf
    updateParticles(stormParticles);
    drawParticles(ctx, stormParticles);

    // 4. Prüfe, ob die Schleife weiterlaufen soll
    let particlesAreActive = false;
    for (const p of stormParticles) {
        if (p.x + p.size > 0 && p.x < canvas.width && p.y + p.size > 0 && p.y < canvas.height) {
            particlesAreActive = true;
            break;
        }
    }

    // 5. FINALE LOGIK: Stabübergabe
    if (particlesAreActive || isLandingSequenceActive() || crossfadeAlpha < 1.0) {
        requestAnimationFrame(transitionLoop);
    } else {
        // Dieser Block wird genau einmal ausgeführt, wenn die Überblendung fertig ist.
        // Jetzt starten wir das Intro!
        initConsole({ keepIntroMusic: true });
    }
}

function startPixelStormTransition() {
    // =======================================================================
    // --- 1. Timing-Konstanten zum einfachen Anpassen ---
    // =======================================================================
    // Kurze Pause, bevor die Musik-Überblendung startet.
    const CROSSFADE_START_DELAY = 1000;  // 0.5 Sekunden

    // Zeit, die die alte Musik zum Ausblenden braucht.
    const FADE_OUT_DURATION = 1500;

    // Zeit, die die neue Musik zum Einblenden braucht.
    const FADE_IN_DURATION = 2500;  
    
    // Zeit vom Start bis zur Explosion.
    const EXPLOSION_DELAY = 7000;  

    console.log("Übergang: Szene wird gezeichnet.");
    const win95ImageElement = document.getElementById('arcade-screen');

    if (win95ImageElement.complete) {
        initBackground(canvas);
        
        const offsetX = (canvas.width - win95ImageElement.naturalWidth) / 2;
        const offsetY = (canvas.height - win95ImageElement.naturalHeight) / 2;
        ctx.drawImage(win95ImageElement, offsetX, offsetY);
        
        win95ImageElement.style.display = 'none';

        // --- 3. Getrenntes Timing für Musik und Explosion ---

        // STARTET DIE MUSIK-ÜBERBLENDUNG
        setTimeout(() => {
            fadeOutSound('boot_sound', FADE_OUT_DURATION);
            fadeInSound('intro', FADE_IN_DURATION);
        }, CROSSFADE_START_DELAY);

        // STARTET DIE EXPLOSION (visuell und akustisch)
        setTimeout(() => {
    playSound('explosion');

    // Wir sagen der Sequenz, dass sie am Ende die Konsole initialisieren soll
    initLandingSequence(() => {
        isCrossfading = true; // Starte die Überblendung!
    });

    
    startLandingSequence();
    stormParticles = createPixelStorm(win95ImageElement, canvas);
    requestAnimationFrame(transitionLoop);
}, EXPLOSION_DELAY);

    } else {
        console.error("Win95-Bild war nicht geladen!");
        initConsole();
    }
}

function powerOn() {
    consoleGameState = 'off';
    hideFullIntroOverlay();
    if (bootOverlayElements) {
        bootOverlayElements.classList.add('hidden');
    }

    // Canvas leeren, für den Fall, dass noch etwas drauf ist
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // HTML-Startnachricht anzeigen
    if (powerOnMessage) {
        powerOnMessage.classList.remove('hidden');
    }
}

function handleBootSequenceEnd() {
    if (wasBootAborted()) {
        // FALL A: Die Sequenz wurde mit ESC abgebrochen
        console.log("Boot-Sequenz abgebrochen. Gehe direkt zum Menü.");
        
        // Stoppe den Boot-Sound schnell
        fadeOutSound('boot_sound', 500);
        
        // Erstelle die Sterne für den Hintergrund
        createBackgroundStars(canvas);
        
        // Gehe direkt in den Menü-Zustand
        consoleGameState = 'gameSelection';
        showGameSelection_menu();
        activateMenuKeyboardNav();
        
        // Starte die Animationsschleife für den Sternenhimmel
        launcherLoop();

    } else {
        // FALL B: Die Sequenz lief normal durch
        console.log("Boot-Sequenz erfolgreich beendet. Starte Pixel-Sturm.");
        startPixelStormTransition();
    }
}

function triggerBootSequence() {
    // Die beiden Elemente holen, die wir ausblenden müssen
    const powerOnMessage = document.getElementById('power-on-message');
    const statusHint = document.getElementById('storage-status-hint');

    // Beide Elemente sicher ausblenden
    if (powerOnMessage) {
        powerOnMessage.classList.add('hidden');
    }
    // DIESE ZEILE IST NEU UND BEHEBT DEN FEHLER
    if (statusHint) {
        statusHint.classList.add('hidden');
    }

    consoleGameState = 'booting';
    if (bootOverlayElements) bootOverlayElements.classList.remove('hidden');
    unlockAudio(); 
    playSound('boot_sound');
    startBootSequence(canvas, ctx, startPixelStormTransition); 
}

function initConsole(options = {}) { // `options` ist unser Anweisungs-Objekt
    console.log("Konsole wird initialisiert/zurückgesetzt...");

    const logoElement = document.getElementById('epalogo');
    if (logoElement) {
        logoElement.style.display = 'none';
    }

     initBackground(canvas);
    
    // --- Aufräumen ---
    stopBootSequence();
    stopSound('boot_sound');
    
    // Wenn wir NICHT nach der Explosion kommen, stoppen wir auch die Intro-Musik,
    // falls sie zufällig noch lief (z.B. schnelles ESC-Drücken).
    if (!options.keepIntroMusic) {
        stopSound('intro');
    }

    deactivateMenuKeyboardNav();
    unloadGameCss();
    if (activeGameModule && typeof activeGameModule.cleanup === 'function') {
        activeGameModule.cleanup();
    }
    activeGameModule = null;
    activeGameId = null;

    consoleGameState = 'loading';
    initIntroElements();

    setTimeout(() => {
        consoleGameState = 'intro';

        // --- Die Kernlogik für die zwei Szenarien ---
        // Wenn wir NICHT nach der Explosion kommen (z.B. nach ESC),
        // starten wir hier den Sound.
        if (!options.keepIntroMusic) {
            console.log("Starte Intro-Musik (Standard-Fall)...");
            fadeInSound('intro', 1500); 
        } else {
            console.log("Intro-Musik läuft bereits weiter...");
        }
        
        startIntro(_onIntroFinished);
        launcherLoop(); 
    }, 100);
}

function updateArcadeScale() {
    const arcadeMachineElement = document.querySelector('.canvas-column');
    if (!arcadeMachineElement) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scaleX = viewportWidth / BASE_ARCADE_WIDTH;
    const scaleY = viewportHeight / BASE_ARCADE_HEIGHT;
    const scaleFactor = Math.min(scaleX, scaleY);
    arcadeMachineElement.style.transform = `scale(${scaleFactor})`;
}

window.addEventListener('load', updateArcadeScale);
window.addEventListener('resize', updateArcadeScale);

function _onIntroFinished() {
    consoleGameState = 'gameSelection';
    showGameSelectionMenu();
    activateMenuKeyboardNav();
    isMenuSelectionActive = true; 
}

function updateMenuFocus(newIndex) {
    if (currentFocusedMenuItemIndex >= 0) {
        selectableMenuItems[currentFocusedMenuItemIndex]?.classList.remove('menu-item-focused');
    }
    currentFocusedMenuItemIndex = newIndex;
    if (currentFocusedMenuItemIndex >= 0) {
        selectableMenuItems[currentFocusedMenuItemIndex]?.classList.add('menu-item-focused');
    }
}

function handleMenuKeyDown(event) {
    if (consoleGameState !== 'gameSelection' || selectableMenuItems.length === 0 || currentFocusedMenuItemIndex < 0) return;
    
    const currentItem = selectableMenuItems[currentFocusedMenuItemIndex];
    const currentRow = parseInt(currentItem.dataset.row);
    let newFocusIndex = currentFocusedMenuItemIndex;
    event.preventDefault();

    switch (event.key) {
        case 'ArrowUp':
            newFocusIndex = findMenuItem(currentRow - 1, 0);
            if (newFocusIndex === -1) {
                const lastRow = selectableMenuItems.reduce((max, item) => Math.max(max, parseInt(item.dataset.row)), 0);
                newFocusIndex = findMenuItem(lastRow, 0);
            }
            break;
        case 'ArrowDown':
            newFocusIndex = findMenuItem(currentRow + 1, 0);
            if (newFocusIndex === -1) {
                newFocusIndex = findMenuItem(0, 0);
            }
            break;
        case 'Enter':
            if (!isMenuSelectionActive) return;

            isMenuSelectionActive = false; 
            const focusedItem = selectableMenuItems[currentFocusedMenuItemIndex];
            if (!focusedItem) return;
            deactivateMenuKeyboardNav();
            _handleGameChoice(focusedItem.dataset.gameId);
            return;
    }

    if (newFocusIndex !== -1 && newFocusIndex !== currentFocusedMenuItemIndex) {
        updateMenuFocus(newFocusIndex);
        playSound('select');
    }
}

function findMenuItem(targetRow, targetCol) {
    return selectableMenuItems.findIndex(item => parseInt(item.dataset.row) === targetRow && parseInt(item.dataset.col) === targetCol);
}

function activateMenuKeyboardNav() {
    selectableMenuItems = Array.from(document.querySelectorAll('#game-selection-menu .game-option'));
    if (selectableMenuItems.length > 0) {
        updateMenuFocus(0);
        if (!boundHandleMenuKeyDown) {
            boundHandleMenuKeyDown = handleMenuKeyDown.bind(this);
        }
        document.addEventListener('keydown', boundHandleMenuKeyDown);
    }
}

function deactivateMenuKeyboardNav() {
    if (currentFocusedMenuItemIndex >= 0) {
        selectableMenuItems[currentFocusedMenuItemIndex]?.classList.remove('menu-item-focused');
    }
    currentFocusedMenuItemIndex = -1;
    if (boundHandleMenuKeyDown) {
        document.removeEventListener('keydown', boundHandleMenuKeyDown);
    }
}

async function loadAndStartGame(gameId) {
    let gamePath = '',
        initFunctionName = '',
        cssPath = '';

    switch (gameId) {
        case "schluesselmomente":
            gamePath = './game1/schluesselmomente_spiel.js';
            initFunctionName = 'initSchluesselmomente';
            cssPath = './game1/style.css';
            break;
        case "flinkefritzi":
            gamePath = './game2/flinke_fritzi_spiel.js';
            initFunctionName = 'initFlinkeFritzi';
            cssPath = '';
            break;
        case "doodlefritzi": 
            gamePath = './abspann.js';
            initFunctionName = 'initAbspann';
            cssPath = '';
            break;
        default:
            alert(`Spiel "${gameId}" nicht verfügbar!`);
            initConsole()
            return;
    }

    if (cssPath) {
        loadGameCss(cssPath);
    }

    activeGameId = gameId;
    if (canvas) {
        canvas.focus();
    }
    
    try {
    const gameModule = await import(gamePath);
    if (gameModule && typeof gameModule[initFunctionName] === 'function') {
        activeGameModule = gameModule;
        
        // Der erste Aufruf wurde entfernt.

        const options = {
            storageMode: localStorage.getItem('globalStorageMode') || 'local'
        };

        // Nur dieser EINE Aufruf bleibt übrig.
        activeGameModule[initFunctionName](canvas, ctx, options);
        
        consoleGameState = `gameActive_${gameId}`;
    } else {
        throw new Error(`Init-Funktion "${initFunctionName}" fehlt.`);
    }
} catch (error) {
    console.error(`FEHLER beim Laden von Spiel "${gameId}":`, error);
    alert(`Spiel "${gameId}" konnte nicht geladen werden.`);
    initConsole();
}
}

function _handleGameChoice(gameId) {
    if (launcherAnimationId) {
        cancelAnimationFrame(launcherAnimationId);
        launcherAnimationId = null;
    }
    const FADE_OUT_DURATION = 1200;

    // Aktionen, die sofort passieren:
    deactivateMenuKeyboardNav();
    consoleGameState = 'gameLoading';
    hideFullIntroOverlay();
    renderConsole();

    // Der Spielstart wird als "Callback" direkt übergeben.
    // Kein setTimeout mehr nötig!
    fadeOutSound('intro', FADE_OUT_DURATION, () => {
        loadAndStartGame(gameId);
    });
}

function launcherLoop(currentTime) { // <--- Parameter hier hinzufügen
    renderConsole(currentTime);      // <--- und hier weitergeben
    launcherAnimationId = requestAnimationFrame(launcherLoop);
}

function handleUserRequestsSkipIntro() {
    if (consoleGameState === 'intro') {
        skipIntro();
    }
}

function renderConsole(currentTime) {
    if (!ctx || !canvas) return;

    const { width, height } = canvas;

    if (consoleGameState === 'off' || consoleGameState === 'booting') {
        return;
    }

    ctx.clearRect(0, 0, width, height);

    if (consoleGameState === 'gameLoading') { 
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#888';
        ctx.font = '24px Kalam';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(consoleGameState === 'loading' ? "Konsole lädt..." : "Spiel lädt...", width / 2, height / 2);
    } else if (consoleGameState === 'intro' || consoleGameState === 'gameSelection') {
        drawAndAnimateBackground(ctx, canvas, currentTime);
    }
}

function initializeConsentCheck() {
    const consentDialog = document.getElementById('einwilligungs-dialog');
    const powerOnScreen = document.getElementById('power-on-message');
    const consentButtonOnline = document.getElementById('button-online');
    const consentButtonLocal = document.getElementById('button-local');

    if (localStorage.getItem('consentChoiceMade') !== 'true') {
        powerOnScreen.classList.add('hidden');
        consentDialog.style.display = 'flex';

        function handleConsent(choice) {
            localStorage.setItem('globalStorageMode', choice);
            localStorage.setItem('consentChoiceMade', 'true');
            consentDialog.style.display = 'none';
            powerOnScreen.classList.remove('hidden');
        }

        consentButtonOnline.onclick = () => handleConsent('supabase');
        consentButtonLocal.onclick = () => handleConsent('local');
        
        return false; // Wichtig: Signalisiert, dass der Nutzer erst wählen muss
    }
    return true; // Nutzer hat bereits gewählt
}

function setupConsentAndStatus() {
    // === Elemente und Zustand ===
    const consentDialog = document.getElementById('einwilligungs-dialog');
    const statusHint = document.getElementById('storage-status-hint');
    const consentButtons = [
        document.getElementById('button-online'),
        document.getElementById('button-local')
    ];
    let selectedButtonIndex = 0;
    let isDialogActive = false;

    // === Hilfsfunktionen für den Dialog ===
    function updateButtonFocus() {
        consentButtons.forEach((button, index) => {
            button.classList.toggle('selected', index === selectedButtonIndex);
        });
    }

    function handleConsentKeyDown(e) {
        if (!isDialogActive) return;
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            selectedButtonIndex = (selectedButtonIndex + 1) % 2;
            updateButtonFocus();
        } else if (e.key === 'Enter') {
            const choice = (selectedButtonIndex === 0) ? 'supabase' : 'local';
            handleConsent(choice);
        }
    }

    function showConsentDialog() {
        isDialogActive = true;
        // Wichtig: Verstecke den powerOn-Text, falls er sichtbar sein sollte
        const powerOnScreen = document.getElementById('power-on-message');
        if (powerOnScreen) powerOnScreen.classList.add('hidden');
        
        statusHint.classList.add('hidden');
        consentDialog.style.display = 'flex';
        selectedButtonIndex = 0;
        updateButtonFocus();
        window.addEventListener('keydown', handleConsentKeyDown, true);
    }

    function hideConsentDialogAndShowPowerOn() {
        isDialogActive = false;
        consentDialog.style.display = 'none';
        updateStatusHint();
        window.removeEventListener('keydown', handleConsentKeyDown, true);
        
        // KORREKTUR: powerOn() wird jetzt HIER aufgerufen
        powerOn(); 
    }

    function handleConsent(choice) {
        localStorage.setItem('globalStorageMode', choice);
        localStorage.setItem('consentChoiceMade', 'true');
        hideConsentDialogAndShowPowerOn();
    }
    
    function updateStatusHint() {
        const currentMode = localStorage.getItem('globalStorageMode');
        if (currentMode === 'supabase') {
            statusHint.innerText = "Online-Highscore ist aktiviert | [H] zum Ändern";
        } else {
            statusHint.innerText = "Highscore wird nur lokal gespeichert | [H] zum Ändern";
        }
        statusHint.classList.remove('hidden');
    }

    // === Hauptlogik beim Laden der Seite ===
    if (localStorage.getItem('consentChoiceMade') !== 'true') {
        showConsentDialog();
    } else {
        // KORREKTUR: powerOn() wird HIER aufgerufen, wenn schon zugestimmt wurde
        updateStatusHint();
        powerOn();
    }

    // Listener für die H-Taste, um den Dialog erneut zu öffnen
    window.addEventListener('keydown', (e) => {
        if (consoleGameState === 'off' && !isDialogActive && e.key.toLowerCase() === 'h') {
            e.preventDefault();
            showConsentDialog();
        }
    });
}
if (canvas && ctx) {
    // 1. Alle Sounds initialisieren
    initLauncherSounds();
    
    // 2. Die komplette Logik für Einwilligung und Status-Anzeige ausführen
    // Diese Funktion zeigt entweder den Dialog oder den Status-Hinweis an
    // und lauscht auf die H-Taste.
    setupConsentAndStatus();

    // 3. Die Konsole in den "Ausgeschaltet"-Zustand versetzen
    // Dies zeigt die "Enter zum Einschalten"-Nachricht an.
   // powerOn();

    // 4. Das globale Input-System für ESC, Enter etc. starten
    initializeInputSystem(
        () => consoleGameState,
        initConsole,
        handleUserRequestsSkipIntro,
        triggerBootSequence
    );
    
    // 5. Die Skalierung der Arcade-Maschine anwenden
    updateArcadeScale();
}