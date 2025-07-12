/* In Hauptverzeichnis/input.js */

console.log("Input System (Konsole) geladen.");

let getGameState = () => 'loading';
let onRestartToIntro = null;
let onSkipIntro = null;
let onPowerOnHandler = null;

export function initializeInputSystem(
    gameStateGetter,
    restartToIntroHandler,
    skipIntroHandler,
    powerOnHandler
) {
    getGameState = gameStateGetter;
    onRestartToIntro = () => restartToIntroHandler(true);
    onSkipIntro = skipIntroHandler;
    onPowerOnHandler = powerOnHandler;

    document.removeEventListener("keydown", handleConsoleKeyDown); 
    document.addEventListener("keydown", handleConsoleKeyDown);
}

const handleConsoleKeyDown = (e) => {
    if (e.isComposing || e.keyCode === 229 || e.ctrlKey || e.altKey || e.metaKey) {
        return;
    }
    
    const aktuelleKonsolenGameState = getGameState();
    const keyOriginal = e.key;

    if (aktuelleKonsolenGameState === 'off' && keyOriginal === 'Enter') {
        e.preventDefault();
        if (onPowerOnHandler) onPowerOnHandler();
        return;
    }

    if (keyOriginal === 'Escape') {
    if (aktuelleKonsolenGameState === 'booting' || aktuelleKonsolenGameState.startsWith('gameActive_') || aktuelleKonsolenGameState === 'gameSelection') {
        if (onRestartToIntro) onRestartToIntro(); 
        e.preventDefault();
        return; 
    }
}

    if (keyOriginal === 'Enter') {
        if (aktuelleKonsolenGameState === 'intro') {
            if (onSkipIntro) onSkipIntro();
            e.preventDefault();
            return;
        }
    }
};