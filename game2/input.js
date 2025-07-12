// In game2/input.js

let keyStates = {};
let enterJustPressed = false; 
let pJustPressed = false;
let nJustPressed = false;
let upJustPressed = false;
let downJustPressed = false;
let leftJustPressed = false;
let rightJustPressed = false;
let lastPressedKey = null; 
let currentInputMode = 'game'; 

function resetAllKeys() {
    keyStates = { up: false, down: false, left: false, right: false, enter: false, p: false, n: false };
    console.log("Alle Tasten-Zustände zurückgesetzt.");
}

function handleKeyDown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Fast alle Tasten im Spielmodus abfangen, um Browser-Aktionen zu verhindern
    if (currentInputMode === 'game' && e.key.length === 1 && !e.repeat) {
        e.preventDefault();
    }
    
    // Texteingabe-Modus (bleibt gleich)
    if (currentInputMode === 'text') {
        if (e.key.length === 1 || e.key === 'Backspace') {
            lastPressedKey = e.key;
        }
        if (e.code === "Enter") {
            if (!keyStates.enter) enterJustPressed = true;
            keyStates.enter = true;
        }
        return; 
    }
    
    // Normale Spielsteuerung
    if (e.code === "ArrowUp" || e.code === "KeyW") {
        if (!keyStates.up) upJustPressed = true;
        keyStates.up = true;
    } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        if (!keyStates.down) downJustPressed = true;
        keyStates.down = true;
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        if (!keyStates.left) leftJustPressed = true;
        keyStates.left = true;
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        if (!keyStates.right) rightJustPressed = true;
        keyStates.right = true;
    }

    if (e.code === "Enter") {
        if (!keyStates.enter) enterJustPressed = true;
        keyStates.enter = true; 
    }
    
    if (e.code === "KeyP") {
        if (!keyStates.p) pJustPressed = true;
        keyStates.p = true;
    }

    if (e.code === "KeyN") {
        if (!keyStates.n) nJustPressed = true;
        keyStates.n = true;
    }
}

function handleKeyUp(e) {
    if (e.code === "ArrowUp" || e.code === "KeyW") keyStates.up = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keyStates.down = false;
    if (e.code === "ArrowLeft" || e.code === "KeyA") keyStates.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keyStates.right = false;
    if (e.code === "Enter") keyStates.enter = false;
    if (e.code === "KeyP") keyStates.p = false;
    if (e.code === "KeyN") keyStates.n = false;
}

// NEUE Funktion, die auf den Fokus des Fensters reagiert
function handleWindowBlur() {
    console.log("Fenster hat Fokus verloren. Setze alle Tasten zurück.");
    resetAllKeys();
}

export function setInputMode(mode) {
    if (mode === 'game' || mode === 'text') {
        currentInputMode = mode;
        resetAllKeys(); // Tasten auch bei Modus-Wechsel zurücksetzen
    }
}

export function initGameInput() {
    resetAllKeys();
    enterJustPressed = false;
    upJustPressed = false;
    downJustPressed = false;
    leftJustPressed = false;
    rightJustPressed = false;
    lastPressedKey = null;
    
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur); // NEU: Listener für Fokusverlust
}

export function cleanupGameInput() {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("blur", handleWindowBlur); // NEU: Listener wieder entfernen
    resetAllKeys();
}

export function getPlayerMovementIntent() {
    const intent = {
        isUpPressed: keyStates.up,
        isDownPressed: keyStates.down,
        isLeftPressed: keyStates.left,
        isRightPressed: keyStates.right,
        isEnterJustPressed: enterJustPressed, 
        isPJustPressed: pJustPressed,
        isUpJustPressed: upJustPressed,
        isDownJustPressed: downJustPressed,
        isLeftJustPressed: leftJustPressed,
        isRightJustPressed: rightJustPressed,
        isNJustPressed: nJustPressed,
        lastKeyEvent: lastPressedKey 
    };

    // Flags nach dem Auslesen sofort zurücksetzen
    if (enterJustPressed) enterJustPressed = false; 
    if (pJustPressed) pJustPressed = false;
    if (upJustPressed) upJustPressed = false;
    if (downJustPressed) downJustPressed = false;
    if (nJustPressed) nJustPressed = false;
    if (leftJustPressed) leftJustPressed = false;
    if (rightJustPressed) rightJustPressed = false;
    if (lastPressedKey) lastPressedKey = null;
    
    return intent;
}