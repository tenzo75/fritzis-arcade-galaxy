// game1/input.js

let keyState = {};
const controlKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];

export async function processKeyDown(event, game) {
    if (!game || !game.state) {
        return;
    }
    event.preventDefault();
    const key = event.key;
    const keyLower = key.toLowerCase();

    // Globale Tasten (Pause, Neustart)
    if (game.state.gameState !== 'entering_highscore' && game.state.gameState !== 'game_start_screen') {
        if (keyLower === 'p' && game.state.gameState === 'running') {
            game.state.isPaused = !game.state.isPaused;
            return;
        }
        if (keyLower === 'n') {
            if (game.stopTimer) {
                game.stopTimer();
            }
            game.state.gameState = 'game_start_screen';
            game.state.startScreenState = 'menu';
            return;
        }
    }

    // Steuerung für den Startbildschirm (Menü, Anleitung, Highscore)
    if (game.state.gameState === 'game_start_screen') {

        // Fall 1: Wir sind in der Anleitung
        if (game.state.startScreenState === 'anleitung_zeigen') {
            if (key === 'Enter') {
                game.state.startScreenState = 'menu';
                game.audio.playSound('menuSelect');
            }
        }
        // Fall 2: Wir sind in der Highscore-Liste
        else if (game.state.startScreenState === 'highscore_zeigen') {
            const ITEMS_PER_PAGE = 10;
            const totalScores = game.highscoreData.length;
            const maxPage = totalScores > 0 ? Math.ceil(totalScores / ITEMS_PER_PAGE) - 1 : 0;
            let pageChanged = false;

            if (key === 'Enter') {
                game.state.startScreenState = 'menu';
                game.audio.playSound('menuSelect');
            } else if (key === 'ArrowRight') {
                if (game.state.highscorePage < maxPage) {
                    game.state.highscorePage++;
                    pageChanged = true;
                }
            } else if (key === 'ArrowLeft') {
                if (game.state.highscorePage > 0) {
                    game.state.highscorePage--;
                    pageChanged = true;
                }
            }

            if (pageChanged) {
                game.audio.playSound('menuMove');
            }
        }
        // Fall 3: Wir sind im Hauptmenü
        else if (game.state.startScreenState === 'menu') {
            switch (key) {
                case 'ArrowUp':
                case 'w':
                    game.state.selectedMenuItemIndex = (game.state.selectedMenuItemIndex - 1 + 3) % 3;
                    game.audio.playSound('menuMove');
                    break;
                case 'ArrowDown':
                case 's':
                    game.state.selectedMenuItemIndex = (game.state.selectedMenuItemIndex + 1) % 3;
                    game.audio.playSound('menuMove');
                    break;
                case 'Enter':
                    game.audio.playSound('menuSelect');
                    const selected = game.state.selectedMenuItemIndex;
                    if (selected === 0) {
                        game.resetToReady();
                    } else if (selected === 1) {
                        game.state.highscoreScrollIndex = 0;
                        game.state.highscorePage = 0; // Setzt Seite bei jedem Öffnen zurück
                        game.highscoreData = [];
                        game.state.startScreenState = 'highscore_zeigen';
                        const scores = await game.getHighScores();
                        game.highscoreData = scores;
                    } else if (selected === 2) {
                        game.state.startScreenState = 'anleitung_zeigen';
                    }
                    break;
            }
        }
        return;
    }

    // Steuerung für die Highscore-Namenseingabe
    if (game.state.gameState === 'entering_highscore') {
        let currentName = game.state.currentHighscoreName || "";
        if (key === "Backspace") {
            game.state.currentHighscoreName = currentName.slice(0, -1);
        } else if (key === "Enter") {
            const nameToSave = currentName.trim() === "" ? "FRITZI" : currentName;
            await game.saveScoreEntry(currentName, game.state.newHighscoreValue, game.state.finalLevelForDisplay);
            game.state.highscoreSubmitted = true;
            game.state.gameState = 'game_start_screen';
            game.state.startScreenState = 'highscore_zeigen';
            game.state.highscoreScrollIndex = 0;
            game.state.highscorePage = 0; 
            const scores = await game.getHighScores();
            game.highscoreData = scores;
        } else if (key.length === 1 && currentName.length < 15) {
            game.state.currentHighscoreName += key;
        }
        return;
    }

    // Steuerung für die End-Bildschirme und Level-Zusammenfassung
    if (key === 'Enter') {
        if (game.state.gameState === 'over' || game.state.gameState === 'won') {
            await game.handleEndScreenContinue();
            return;
        } else if (game.state.gameState === 'level_summary') {
            if (Date.now() >= game.state.allowInputAfter) {
                game.startGame();
            }
            return;
        }
    }
    // Spielerbewegung im laufenden Spiel
    if (game.state.gameState === 'running' && !game.state.isPaused) {
        if (controlKeys.includes(key) || controlKeys.includes(keyLower)) {
            keyState[keyLower] = true;
        }
    }
}

export function processKeyUp(event, game) { 
    if (game.state.gameState === 'running') {
        keyState[event.key.toLowerCase()] = false; 
        
    }
}

export function updatePlayerMovement(game) {
    if (!game.player) return;

    if (game.state.gameState !== 'running') {
        game.player.dx = 0;
        game.player.dy = 0;
        return;
    }

    // Setzt nur die Richtung (1, -1, oder 0)
    let moveX = 0;
    let moveY = 0;

    if (keyState['arrowleft'] || keyState['a']) moveX = -1;
    if (keyState['arrowright'] || keyState['d']) moveX = 1;
    if (keyState['arrowup'] || keyState['w']) moveY = -1;
    if (keyState['arrowdown'] || keyState['s']) moveY = 1;

    // Speichere die reine Richtung im Player-Objekt
    game.player.dx = moveX;
    game.player.dy = moveY;
}

export function resetInputState() {
    keyState = {};
    console.log("Input state (keyState) wurde zurückgesetzt.");
}
