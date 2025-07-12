// Kompletter Inhalt für: Hauptverzeichnis/introManager.js

let introContainer = null;
let introPerspectiveBox = null;
let introScrollContent = null;
let gameSelectionMenu = null;

let _onIntroFinishedOrSkippedCallback = null;
let transitionTimer = null; // Timer für den Übergang

/**
 * Findet die HTML-Elemente.
 */
export function initIntroElements() {
    introContainer = document.getElementById('intro-container');
    introPerspectiveBox = document.getElementById('intro-perspective-box');
    introScrollContent = document.getElementById('intro-scroll-content');
    gameSelectionMenu = document.getElementById('game-selection-menu');
}

/**
 * Startet das Intro.
 */
export function startIntro(onFinishedCallback) {
    _onIntroFinishedOrSkippedCallback = onFinishedCallback;

    if (!introContainer || !introScrollContent) return;

    // Timer zurücksetzen, falls er noch läuft.
    if (transitionTimer) clearTimeout(transitionTimer);

    // Klonen, um die Animation sauber neuzustarten.
    const oldElement = introScrollContent;
    const newElement = oldElement.cloneNode(true);
    oldElement.parentNode.replaceChild(newElement, oldElement);
    introScrollContent = newElement;

    // Elemente für den Start vorbereiten.
    introContainer.classList.remove('hidden');
    introPerspectiveBox.classList.remove('hidden');
    // NEU: Setzt die Deckkraft des Text-Containers wieder auf 100%.
    introPerspectiveBox.style.opacity = '1';

    gameSelectionMenu.classList.add('hidden');

    // =======================================================
    // ### HIER SIND IHRE STELLSCHRAUBEN ###
    // =======================================================
    // Stellschraube 1: Geschwindigkeit des Textes (in der CSS-Datei).
    const SCROLL_DURATION = "85s"; 

    // Stellschraube 2: Zeitpunkt, wann das Menü erscheint (in Millisekunden).
    const MENU_TRANSITION_DELAY = 40000; 
    // =======================================================

    // CSS-Animation für den Text starten.
    introScrollContent.style.animation = `starwars-crawl ${SCROLL_DURATION} linear forwards`;

    // Timer starten, der den Übergang zum Menü auslöst.
    transitionTimer = setTimeout(triggerMenuTransition, MENU_TRANSITION_DELAY);
}

/**
 * Überspringt das Intro.
 */
export function skipIntro() {
    console.log("introManager: Intro wird übersprungen.");

    // Laufenden Timer für den normalen Übergang stoppen.
    if (transitionTimer) clearTimeout(transitionTimer);

    // Text-Animation sofort stoppen und den Container hart ausblenden.
    introScrollContent.style.animation = 'none';
    introPerspectiveBox.classList.add('hidden');
    introPerspectiveBox.style.opacity = '1'; // Deckkraft für nächsten Durchlauf zurücksetzen

    // Menü sichtbar machen und seine Einblend-Animation starten.
    gameSelectionMenu.classList.remove('hidden');
    gameSelectionMenu.style.animation = `menu-slide-in 1.5s ease-out forwards`;

    // Nach Ende der Menü-Animation die Tastatur freigeben.
    setTimeout(() => {
        if (_onIntroFinishedOrSkippedCallback) {
            _onIntroFinishedOrSkippedCallback();
            _onIntroFinishedOrSkippedCallback = null;
        }
    }, 1500); // Muss zur Dauer der Menü-Animation passen
}

/**
 * Löst den Übergang zum Menü aus.
 */
function triggerMenuTransition() {
    if (!introPerspectiveBox || !gameSelectionMenu) return;

    introPerspectiveBox.style.opacity = '0';
    gameSelectionMenu.classList.remove('hidden');

    // HIER DIE GESCHWINDIGKEIT ÄNDERN:
    // Ein höherer Wert bedeutet eine langsamere Animation.
    const menuAnimationDuration = 6; // z.B. 5 Sekunden für eine sehr langsame Fahrt

    // Die Dauer hier eintragen (in Sekunden)
    gameSelectionMenu.style.animation = `menu-slide-in ${menuAnimationDuration}s ease-out forwards`;

    // Nach Ende der Animation die Tastatur freigeben.
    // Hier denselben Wert eintragen (in Millisekunden)
    setTimeout(() => {
        introPerspectiveBox.classList.add('hidden');
        
        if (_onIntroFinishedOrSkippedCallback) {
            _onIntroFinishedOrSkippedCallback();
            _onIntroFinishedOrSkippedCallback = null;
        }
    }, menuAnimationDuration * 1000); 
}

// Unveränderte Hilfsfunktionen
export function showGameSelectionMenu() {
    if (introContainer && gameSelectionMenu) {
        introContainer.classList.remove('hidden');
        gameSelectionMenu.classList.remove('hidden');
    }
}

export function hideFullIntroOverlay() {
    if (introContainer) {
        introContainer.classList.add('hidden');
    }
}