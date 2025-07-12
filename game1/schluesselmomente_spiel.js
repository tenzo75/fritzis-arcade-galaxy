// game1/schluesselmomente_spiel.js 

import {
  playerSpeed as globalDefaultPlayerSpeed,
  timeBonusMultiplier,
  keyLimit,
  playerHitCooldown,
  keySize,
  enemyDirectionChangeInterval,
  enemyBaseSpeedMultiplier,
  enemySpeedIncrease,
  getLevelParameters, 
  TOTAL_LEVELS,
} from "./config.js";
import {
  titleImage,
  titleImageLoaded,
  gameBackgroundImage,
  gameBackgroundImageLoaded,
  gameStartBackgroundImage, 
  gameStartBackgroundImageLoaded,
  fritziStartImage, 
  fritziStartImageLoaded,
  hamsterStartImage, 
  hamsterStartImageLoaded  
} from "./assets.js";

import * as audioManager from "./audioManager.js";

import {
  checkRectCollision,
  drawRoundedRect,
} from "./utils.js";

import {
  processKeyDown,
  processKeyUp,
  updatePlayerMovement as updatePlayerMovementLogic,
  resetInputState,
} from "./input.js";

import { drawPlayer, drawKey, drawObstacles, drawEnemies, drawScore, drawTime, drawLevel, drawGoal } from "./drawing.js";

import {
  drawGameStartScreen,
  drawLevelSummaryScreen,
  drawGameOverScreen,
  drawWinScreen,
  drawPauseScreen,
  drawEnterHighscoreScreen
} from "./screens.js";

import { initHighscoreSystem, getHighScores, isNewHighScore, saveScoreEntry } from "./highscore.js";

import {
  createPlayer,
  generateObstacles,
  spawnRandomKey,
  spawnNumberedKeys,
  createInitialEnemies,
} from "./entities.js";

import {
  movePlayer,
  checkCollisions,
  moveEnemies,
  checkPlayerEnemyCollision,
  setAggressiveDirection as setEnemyRandomDirectionFromLogic,
} from "./gameLogic.js";

// Spielbereich holen, HTML-Elemente, Bilder, Sound
let canvas;
let ctx;

// VARIABLEN FÜR DAS MENÜ
let startScreenState = 'menu'; // Mögliche Werte: 'menu', 'anleitung_zeigen', 'highscore_zeigen'
let selectedMenuItemIndex = 0; // 0 = Spiel starten, 1 = Anleitung, 2 = Highscore
let menuAnimationState = 'idle'; // Mögliche Zustände: 'idle', 'running', 'finished'
let menuAnimationStartTime = 0;
const MENU_ANIM_DURATION = 1500; // Dauer der Hereinflug-Animation in ms (1.5 Sekunden)

// Spiel-Zustände & Level-Tracking
let gameState = "ready";
let currentLevel = 1;
let obstacles = [];
let keys = [];
let audioUnlocked = true;
let scoreAtLevelStart = 0;
let levelKeysCollected = 0;
let allowInputAfter = 0;

// Globale Variablen für Endergebnis-Anzeige
let finalScoreForDisplay = 0;
let finalLevelForDisplay = 1;
let previousLevelSummaryText = null;
let animationFrameId = null;
let newHighscoreValue = 0;
let currentHighscoreName = "";
let highscoreData = [];
let highscoreScrollIndex = 0;
let isNewHighscoreAchieved = false;
let highscorePage = 0;
let highscoreSubmitted = false;

// Spiel-Variablen
let score = 0;
let timeLeft = 0; 
let timerInterval;
let nextKeyNumber = 1;
let levelStartMessage = "";
let levelGoalMessage = "";
let isPaused = false; 

// Spieler-Objekt (mit 50x50)
let player = null;

// Gegner Setup
let playerCanBeHit = true;
let enemies = [];

const gameContext = {
    state: {
        get gameState() { return gameState; },
        set gameState(newState) { gameState = newState; },
        get startScreenState() { return startScreenState; },
        set startScreenState(val) { startScreenState = val; },
        get selectedMenuItemIndex() { return selectedMenuItemIndex; },
        set selectedMenuItemIndex(val) { selectedMenuItemIndex = val; },
        get currentLevel() { return currentLevel; },
        setCurrentLevel: (newLevel) => { currentLevel = newLevel; }, 
        get audioUnlocked() { return audioUnlocked; },
        set audioUnlocked(val) { audioUnlocked = val; },
        get allowInputAfter() { return allowInputAfter; },
        set allowInputAfter(val) { allowInputAfter = val; },
        get finalLevelForDisplay() { return finalLevelForDisplay; },
        set finalLevelForDisplay(val) { finalLevelForDisplay = val; },
        get playerCanBeHit() { return playerCanBeHit; },
        set playerCanBeHit(val) { playerCanBeHit = val; },
        get timeLeft() { return timeLeft; },
        set timeLeft(val) { timeLeft = val; },
        stopTimer: () => stopGameTimer(),
        get score() { return score; },
        set score(val) { score = val; },
        get nextKeyNumber() { return nextKeyNumber; },
        set nextKeyNumber(val) { nextKeyNumber = val; },
        get levelKeysCollected() { return levelKeysCollected; },
        set levelKeysCollected(val) { levelKeysCollected = val; },
        get levelGoalMessage() { return levelGoalMessage; },
        set levelGoalMessage(msg) { levelGoalMessage = msg; },
        get newHighscoreValue() { return newHighscoreValue; },
        set newHighscoreValue(val) { newHighscoreValue = val; },
        get currentHighscoreName() { return currentHighscoreName; },
        set currentHighscoreName(val) { currentHighscoreName = val; },
        get highscoreScrollIndex() { return highscoreScrollIndex; },
        set highscoreScrollIndex(val) { highscoreScrollIndex = val; },
        get highscorePage() { return highscorePage; }, 
        set highscorePage(val) { highscorePage = val; }, 
        get highscoreSubmitted() { return highscoreSubmitted; },
        set highscoreSubmitted(val) { highscoreSubmitted = val; },
        storageMode: 'local',
        get isPaused() { return isPaused; },
        set isPaused(value) { isPaused = value; }
        
      },

    getHighScores: getHighScores, 
    get highscoreData() { return highscoreData; },
    set highscoreData(data) { highscoreData = data; },
    saveScoreEntry: saveScoreEntry,
    audio: audioManager,
   
    // Direkter Zugriff auf Kernobjekte über Getter (für Arrays/Objekte, die neu zugewiesen werden könnten)
    get player() { return player; },
    get canvas() { return canvas; },
    get keys() { return keys; },
    get obstacles() { return obstacles; },
    get enemies() { return enemies; },

    ui: { // Für UI-Nachrichten-Strings (Getter/Setter greifen auf globale Variablen zu)
        get levelStartMessage() { return levelStartMessage; },
        set levelStartMessage(msg) { levelStartMessage = msg; },
        get previousLevelSummaryText() { return previousLevelSummaryText; },
        set previousLevelSummaryText(txt) { previousLevelSummaryText = txt; }
    },

    config: { // Importierte Konfigurationen
        playerSpeed: globalDefaultPlayerSpeed,
        enemyBaseSpeedMultiplier: enemyBaseSpeedMultiplier,
        enemySpeedIncrease: enemySpeedIncrease,
        playerHitCooldown: playerHitCooldown,
        keySize: keySize,
        enemyDirectionChangeInterval: enemyDirectionChangeInterval,
        getLevelParameters: getLevelParameters,
        TOTAL_LEVELS: TOTAL_LEVELS 
    },
    assets: {
    titleImage: titleImage,
    titleImageLoaded: () => titleImageLoaded, 
    gameBackgroundImage: gameBackgroundImage,
    gameBackgroundImageLoaded: () => gameBackgroundImageLoaded,
    gameStartBackgroundImage: gameStartBackgroundImage,
    gameStartBackgroundImageLoaded: () => gameStartBackgroundImageLoaded,
    fritziStartImage: fritziStartImage,
    fritziStartImageLoaded: () => fritziStartImageLoaded,
    hamsterStartImage: hamsterStartImage,
    hamsterStartImageLoaded: () => hamsterStartImageLoaded
  },
    utils: { // Importierte Utilities
       checkRectCollision: checkRectCollision,
    },
    entities: { // Importierte Entity-Funktionen
       spawnRandomKey: spawnRandomKey
    },

    // Kern-Spielfunktionen aus main.js, die von Modulen aufgerufen werden könnten
    startGame: () => startGame(),
    resetToReady: () => resetToReady(),
    endGame: () => endGame(),
    saveScoreEntry: saveScoreEntry,
    handleEndScreenContinue: handleEndScreenContinue,
    
};
console.log(">>>> schluesselmomente_spiel.js: GLOBALE VARIABLEN UND gameContext DEFINIERT (scheinbar) <<<<");
// Wrapper-Funktionen für Event-Handler, damit wir sie entfernen können
let boundProcessKeyDown;
let boundProcessKeyUp;

function initializeEventHandlers() {
    boundProcessKeyDown = (e) => processKeyDown(e, gameContext); // processKeyDown aus input.js
    boundProcessKeyUp = (e) => processKeyUp(e, gameContext);     // processKeyUp aus input.js
}

function stopGameTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null; // Wichtig für einen sauberen Neustart
    }
}

function resetToReady() {
    console.log("resetToReady: Setze Spiel in den 'ready'-Zustand (zeigt jetzt Level 1 Zusammenfassung).");
    highscoreSubmitted = false;

    if (timerInterval) clearInterval(timerInterval);

    if (!canvas || !ctx) {
        console.error("resetToReady: FEHLER - Canvas oder Context ist nicht verfügbar!");
        return;
    }
    if (!player) {
        player = createPlayer(canvas); // createPlayer ist aus entities.js importiert
        console.log("resetToReady: Player-Objekt initial erstellt.");
    }

    gameContext.config.playerSpeed = globalDefaultPlayerSpeed; 
    gameState = 'level_summary'; // Direkt zur Level-Zusammenfassung
    currentLevel = 1;

    if (typeof getLevelParameters === 'function') {
    const params = getLevelParameters(currentLevel);
    timeLeft = params.time;
    levelStartMessage = `Level ${currentLevel} von ${TOTAL_LEVELS}`;

    // NEU: Baut die detaillierte Liste, genau wie in endGame()
    let goalInfo = `Ziel: ${params.goalString}\n`;
goalInfo += `Zeit: ${params.time}s\n`;
goalInfo += `Hamster: ${params.enemyCount}\n`;
goalInfo += `Vans: ${params.obstacleCount}`;
levelGoalMessage = goalInfo;
} else {
        console.warn("resetToReady: getLevelParameters nicht verfügbar, setze timeLeft und Nachrichten auf Standardwerte.");
        timeLeft = 30;
        levelStartMessage = "Level 1";
        levelGoalMessage = "Sammle die Schlüssel!";
    }
    score = 0; // Globale Variable
    levelKeysCollected = 0;
    nextKeyNumber = 1;
    previousLevelSummaryText = null; // Globale Variable
    allowInputAfter = Date.now() + 500; // Globale Variable

    resetInputState(); // Aus input.js importiert

    player.dx = 0;
    player.dy = 0;
    playerCanBeHit = true; // Globale Variable

    console.log("Spiel zurückgesetzt und bereit für Level 1 Zusammenfassung (gameState='level_summary').");
}

async function endGame() {
    if (gameState !== "running") {
        return;
    }

    console.log(`endGame: Wird für Level ${currentLevel} ausgeführt.`);

    const endedLevel = currentLevel;
    const remainingTime = timeLeft;
    
    clearInterval(timerInterval);
    resetInputState();
    updatePlayerMovementLogic(gameContext);

    const endedLevelParams = getLevelParameters(endedLevel);
    let pointsThisLevel = score - scoreAtLevelStart;
    let levelTimeBonus = Math.max(0, remainingTime) * timeBonusMultiplier;
    let playerWonThisLevel = false;

    if (endedLevelParams.error) {
        playerWonThisLevel = false;
        console.error("endGame: Konnte Level-Parameter nicht laden.");
    } else if (endedLevelParams.levelType === 'numberedKeys') {
        if (nextKeyNumber > endedLevelParams.keyTarget) {
            playerWonThisLevel = true;
        }
    } else if (endedLevelParams.levelType === 'randomKeys') {
        if (levelKeysCollected >= endedLevelParams.keyTarget) {
            playerWonThisLevel = true;
        }
    } else {
        console.error(`endGame: Unbekannter levelType "${endedLevelParams.levelType}"`);
        playerWonThisLevel = false;
    }

    if (remainingTime <= 0 && !playerWonThisLevel) {
        playerWonThisLevel = false;
    }

    if (playerWonThisLevel) {
        // Level erfolgreich abgeschlossen
        console.log(`endGame: Level ${endedLevel} erfolgreich.`);
        score += levelTimeBonus;

        if (endedLevel === TOTAL_LEVELS) {
            // ALLERLETZTES LEVEL GESCHAFFT -> SPIELENDE
            console.log(`endGame: Alle ${TOTAL_LEVELS} Level geschafft! SPIEL GEWONNEN!`);
            
            gameContext.audio.playSound('schluesselmoment');

            finalScoreForDisplay = score;
            isNewHighscoreAchieved = await isNewHighScore(finalScoreForDisplay);
            finalLevelForDisplay = endedLevel;
            gameState = 'won';
            
        } else {
            // Normales Levelende, nächstes Level vorbereiten
            const nextLevelNum = endedLevel + 1;
            const nextLevelParams = getLevelParameters(nextLevelNum);

            // Der Haupttitel bleibt, wie er ist.
            levelStartMessage = `Level ${endedLevel} Geschafft!`;
            // Der Bonus-Text bleibt auch, wie er ist.
            previousLevelSummaryText = `Deine Punkte: ${pointsThisLevel} + ${levelTimeBonus} Zeitbonus = ${pointsThisLevel + levelTimeBonus}`;
            
            // NEUE LOGIK: Wir bauen die levelGoalMessage neu auf.
            // Die "Es folgt"-Zeile kommt jetzt als EIGENE Zeile in die levelGoalMessage.
            let nextLevelInfo = `Es folgt: Level ${nextLevelNum} von ${TOTAL_LEVELS}\n\n`; // <-- Wichtig: \n\n für eine Leerzeile als Abstand
            
            if (nextLevelParams.error) {
                nextLevelInfo += "Fehler beim Laden der Leveldaten!";
            } else {
                nextLevelInfo += `Ziel: ${nextLevelParams.goalString}\n`;
                nextLevelInfo += `Zeit: ${nextLevelParams.time}s\n`;
                nextLevelInfo += `Hamster: ${nextLevelParams.enemyCount}\n`;
                nextLevelInfo += `Vans: ${nextLevelParams.obstacleCount}`;
            }
            // Die komplette Info ist jetzt in EINER Variable, die wir intelligent zeichnen können.
            levelGoalMessage = nextLevelInfo;

            currentLevel = nextLevelNum;
            gameState = "level_summary";
            allowInputAfter = Date.now() + 750;
        }
    } else {
        // LEVEL NICHT GESCHAFFT -> SPIELENDE
        if (gameState !== "won" && gameState !== "over") {
            gameState = "over";
            console.log(`endGame: gameState auf "over" gesetzt.`);
        }

        gameContext.audio.playSound('schluesselmoment');

        finalScoreForDisplay = score;
        isNewHighscoreAchieved = await isNewHighScore(finalScoreForDisplay);
        finalLevelForDisplay = endedLevel;
        console.log(`Game Over! Score: ${finalScoreForDisplay}, Level: ${finalLevelForDisplay}`);
        
        previousLevelSummaryText = null;
    }
}

async function handleEndScreenContinue() {
    // PRÜFE: Ist es ein Highscore UND wurde für diese Runde noch kein Highscore eingetragen?
    // NEU: "await" vor dem Funktionsaufruf
    if (await isNewHighScore(finalScoreForDisplay) && !highscoreSubmitted) {
        // Wenn beides zutrifft, gehe zum Eingabebildschirm
        newHighscoreValue = finalScoreForDisplay;
        currentHighscoreName = "";
        gameState = 'entering_highscore';
    } else {
        // Sonst gehe normal zum Startmenü des Spiels.
        gameState = 'game_start_screen';
    }
}

function startGame() {
  if (!canvas) {
    console.error("Fehler bei startGame: Canvas-Element nicht initialisiert!");
    return;
  }
  // Log entfernt, da currentLevelParams unten geholt wird und dort geloggt werden kann
  // console.log(`startGame: Level ${currentLevel} wird gestartet.`);

  if (!player) {
    player = createPlayer(canvas); // createPlayer aus entities.js
  }
  // Spielerposition und -status zurücksetzen
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height / 2 - player.height / 2;
  player.dx = 0;
  player.dy = 0;
  playerCanBeHit = true;

  // Parameter für das aktuelle Level holen
  const params = getLevelParameters(currentLevel); // getLevelParameters aus config.js
  if (params.error) {
    console.error("startGame: Konnte Level-Parameter nicht laden für Level " + currentLevel + ". Kehre zum Menü zurück.");
    if (typeof resetToReady === 'function') { // resetToReady ist global in dieser Datei
        resetToReady(); // Zurück zum Level 1 Summary als sicherer Zustand
    } else {
        console.error("startGame: resetToReady ist nicht definiert! Kann Fehler nicht sicher behandeln.");
        // In einem ernsten Fall könnte hier window.onExitToMenuFromGame() aufgerufen werden,
        // um die Kontrolle an die Hauptkonsole zurückzugeben.
    }
    return;
  }

  // Level-spezifische Werte setzen
  timeLeft = params.time;
  let enemyCount = params.enemyCount;
  let obstacleCount = params.obstacleCount;

  // Spielergeschwindigkeit für dieses Level im gameContext aktualisieren
  // gameContext.config.playerSpeed wird von input.js für die Spielerbewegung verwendet.
  if (typeof params.playerSpeedLevel === 'number') {
    gameContext.config.playerSpeed = params.playerSpeedLevel;
  } else {
    gameContext.config.playerSpeed = globalDefaultPlayerSpeed; // Fallback auf den globalen Standardwert
    console.warn(`Kein playerSpeedLevel für Level ${currentLevel} definiert, verwende globalen Standard: ${globalDefaultPlayerSpeed}`);
  }
  console.log(`Spielergeschwindigkeit für Level ${currentLevel} im gameContext: ${gameContext.config.playerSpeed}`);


  // Gegnergeschwindigkeit berechnen
  // Nutzt den importierten globalDefaultPlayerSpeed als Basis, und den Multiplikator aus den Level-Parametern.
  let currentEnemySpeed;
  if (typeof params.enemySpeedMultiplierLevel === 'number' && typeof enemyBaseSpeedMultiplier === 'number' && typeof enemySpeedIncrease === 'number') {
    currentEnemySpeed = globalDefaultPlayerSpeed * (enemyBaseSpeedMultiplier + params.enemySpeedMultiplierLevel * enemySpeedIncrease);
  } else {
    console.warn(`startGame: Parameter für Gegnergeschwindigkeit fehlen für Level ${currentLevel}. Verwende Fallback.`);
    currentEnemySpeed = globalDefaultPlayerSpeed * (enemyBaseSpeedMultiplier || 0.5); // Fallback-Berechnung
  }


  // Zähler und Nachrichten für das Level initialisieren
  scoreAtLevelStart = score;    // Wichtig für Punkteberechnung in endGame
  levelKeysCollected = 0;     // Für 'randomKeys'-Level
  nextKeyNumber = 1;          // Für 'numberedKeys'-Level

  // levelGoalMessage (für In-Game HUD) basierend auf dem HUD-Template formatieren
  if (params.hudGoalTemplateActive && typeof params.hudGoalTemplateActive.replace === 'function') {
    let message = params.hudGoalTemplateActive;
    message = message.replace('${keyTarget}', params.keyTarget);

    if (params.levelType === 'randomKeys') {
      message = message.replace('${collected}', levelKeysCollected);
    } else if (params.levelType === 'numberedKeys') {
      message = message.replace('${nextKeyNumber}', nextKeyNumber);
    }
    levelGoalMessage = message;
  } else {
    levelGoalMessage = "HUD Zieltext nicht konfiguriert!";
    console.warn(`hudGoalTemplateActive für Level ${currentLevel} fehlt oder ist ungültig.`);
  }
  
  console.log(`Starte Level ${currentLevel} (Typ: ${params.levelType}). Ziel-HUD: "${levelGoalMessage}". Spieler-Speed: ${gameContext.config.playerSpeed}, Gegner-Basis-Speed-Faktor: ${params.enemySpeedMultiplierLevel}`);

  gameState = 'running'; // Spielzustand setzen
  resetInputState();     // Tastatureingaben zurücksetzen (aus input.js)

  if (timerInterval) clearInterval(timerInterval); // Alten Timer löschen, falls vorhanden

  // Entitäten erstellen
  // createInitialEnemies erwartet player und gameContext.config
  // setEnemyRandomDirectionFromLogic ist der Alias für setAggressiveDirection
  enemies = createInitialEnemies(enemyCount, canvas, currentEnemySpeed, setEnemyRandomDirectionFromLogic, player, gameContext.config);

  obstacles.length = 0; // Hindernis-Array leeren
  if (obstacleCount > 0) {
    generateObstacles(obstacles, obstacleCount, canvas, enemies, player); // generateObstacles aus entities.js
  }

  keys.length = 0; // Schlüssel-Array leeren
  // Schlüsselerzeugung basiert auf params.levelType
  if (params.levelType === 'numberedKeys') {
    spawnNumberedKeys(keys, params.keyTarget, canvas, obstacles, enemies); // aus entities.js
  } else if (params.levelType === 'randomKeys') {
    // keyLimit wird aus config.js importiert
    for (let i = 0; i < keyLimit; i++) {
      spawnRandomKey(keys, canvas, obstacles, enemies); // aus entities.js
    }
  } else {
    console.error(`Unbekannter levelType "${params.levelType}" in Level ${currentLevel} für Schlüsselerzeugung.`);
  }
  // console.log("startGame: Inhalt des 'keys'-Arrays nach dem Spawnen:", JSON.stringify(keys));

  // Spiel-Timer starten
  timerInterval = setInterval(() => {
    if (gameState !== 'running') {
      clearInterval(timerInterval);
      return;
    }
    if (isPaused) {
      return;
    }
    timeLeft--;
    
    if (timeLeft <= 10 && timeLeft > 0) { // Nur in den letzten 10 Sekunden (aber nicht bei 0)
      gameContext.audio.playSound('tick');
    }
  
    if (timeLeft <= 0) {
      console.log("Zeit abgelaufen in Level", currentLevel);
      if (typeof endGame === 'function') { // endGame ist global in dieser Datei
        endGame();
      } else {
        console.error("endGame ist nicht definiert!");
      }
    }
  }, 1000);

  console.log(`Level ${currentLevel} vollständig initialisiert und läuft.`);
}

function gameLoop() {
    if (!ctx || !canvas) {
        console.error("gameLoop: Canvas oder Context fehlt!");
        return;
    }

    // --- HINTERGRUNDLOGIK (Ihre Version) ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let bgImageToDraw = null;
    let bgImageIsLoaded = false;

    if (gameState === 'game_start_screen') {
        if (gameContext.assets.gameStartBackgroundImage && gameContext.assets.gameStartBackgroundImageLoaded && gameContext.assets.gameStartBackgroundImageLoaded()) {
            bgImageToDraw = gameContext.assets.gameStartBackgroundImage;
            bgImageIsLoaded = true;
        }
    } else if (gameState === 'running' || gameState === 'level_summary' || gameState === 'over' || gameState === 'won' || gameState === 'entering_highscore') {
        if (gameContext.assets.gameBackgroundImage && gameContext.assets.gameBackgroundImageLoaded && gameContext.assets.gameBackgroundImageLoaded()) {
            bgImageToDraw = gameContext.assets.gameBackgroundImage;
            bgImageIsLoaded = true;
        }
    }

    if (bgImageToDraw && bgImageIsLoaded) {
        ctx.drawImage(bgImageToDraw, 0, 0, canvas.width, canvas.height);
    } else {
        if (gameState === 'running') {
            ctx.fillStyle = "#000000";
        } else {
            ctx.fillStyle = "rgb(30, 30, 30)";
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- OVERLAY-LOGIK (Ihre Version) ---
    if (gameState === 'game_start_screen' || gameState === 'level_summary' || gameState === 'over' || gameState === 'won' || gameState === 'entering_highscore') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (gameState === 'running') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- SPEZIFISCHE INHALTE ZEICHNEN ---
    if (gameState === 'game_start_screen') {
    
    // Standardwerte für die Endpositionen definieren
    let animationValues = {
        fritziX: 560,
        hamsterY: 450,
        titleHover: 0,
        titleY: canvas.height / 2, // Startposition (wird animiert)
        titleOpacity: 1, // Standard-Deckkraft
        menuPulseSize: 0 // NEU: Standardwert für den Menü-Puls
    };

    if (menuAnimationState === 'running') {
        const elapsedTime = Date.now() - menuAnimationStartTime;
        const progress = Math.min(1, elapsedTime / MENU_ANIM_DURATION);
        
        // Positionen für Fritzi & Hamster (wie bisher)
        animationValues.fritziX = canvas.width + (560 - canvas.width) * progress;
        animationValues.hamsterY = canvas.height + (450 - canvas.height) * progress;

        // NEU: Position und Deckkraft für den Titel animieren
        const titleStartY = canvas.height / 2 - 200; // Startet 30px über der Endposition
        const titleEndY = canvas.height / 2;
        animationValues.titleY = titleStartY + (titleEndY - titleStartY) * progress;
        animationValues.titleOpacity = progress; // Deckkraft geht von 0 auf 1

        if (progress >= 1) {
            menuAnimationState = 'finished';
        }
    }

    if (menuAnimationState === 'finished') {
        // Dauerhafte Animationen, wenn alles an seinem Platz ist
        animationValues.titleHover = Math.sin(Date.now() / 600) * 4;
        
        // NEU: Berechnung für den Puls-Effekt der Schriftgröße
        // (Math.sin(...) + 1) / 2 ergibt einen weichen Wert zwischen 0 und 1
        // Multipliziert mit 3 ergibt das eine Größenänderung von 0 bis 3 Pixel.
        animationValues.menuPulseSize = ((Math.sin(Date.now() / 350) + 1) / 2) * 3;
    }
        // Rufe die Zeichenfunktion mit den berechneten Werten auf
        drawGameStartScreen(ctx, canvas, gameContext, startScreenState, selectedMenuItemIndex, animationValues);

    } else if (gameState === 'level_summary') {
        drawLevelSummaryScreen(ctx, canvas, levelStartMessage, previousLevelSummaryText, levelGoalMessage);
    } else if (gameState === 'running') {
        if (!isPaused) {
            updatePlayerMovementLogic(gameContext);
            movePlayer(gameContext);
            moveEnemies(gameContext);
            checkCollisions(gameContext);
            checkPlayerEnemyCollision(gameContext);
        }
        if (typeof drawObstacles === 'function') drawObstacles(ctx, obstacles);
        if (typeof drawPlayer === 'function') drawPlayer(ctx, player);
        if (typeof drawEnemies === 'function') drawEnemies(ctx, enemies);
        if (typeof drawKey === 'function' && keys) {
            keys.forEach(key => {
                if (!key.collected) {
                    const params = getLevelParameters(currentLevel);
                    drawKey(ctx, key, params.levelType || 'randomKeys');
                }
            });
        }
        if (typeof drawScore === 'function') drawScore(ctx, score);
        if (typeof drawTime === 'function') drawTime(ctx, timeLeft);
        if (typeof drawLevel === 'function') drawLevel(ctx, currentLevel);
        if (levelGoalMessage && levelGoalMessage.trim() !== "") drawGoal(ctx, levelGoalMessage);
        if (isPaused && typeof drawPauseScreen === 'function') drawPauseScreen(ctx, canvas);
    } else if (gameState === 'over') {
        drawGameOverScreen(ctx, canvas, finalScoreForDisplay, finalLevelForDisplay, isNewHighscoreAchieved);
    } else if (gameState === 'won') {
        drawWinScreen(ctx, canvas, finalScoreForDisplay, isNewHighscoreAchieved);
    } else if (gameState === 'entering_highscore') {
        drawEnterHighscoreScreen(ctx, canvas, newHighscoreValue, currentHighscoreName);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

export function cleanup() {
  console.log("Schlüsselmomente: Cleanup wird ausgeführt...");
  menuAnimationState = 'idle';

  // 1. Game Loop stoppen
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null; // Wichtig für einen sauberen Neustart
    console.log("Schlüsselmomente: GameLoop gestoppt.");
  }

  // 2. Timer-Intervall stoppen (falls es einen gibt)
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null; // Wichtig für einen sauberen Neustart
    console.log("Schlüsselmomente: TimerInterval gestoppt.");
  }

  // 3. Event-Listener entfernen (KORRIGIERTER TEIL)
  //    Diese Listener wurden in initSchluesselmomente() mit den gebundenen Funktionen hinzugefügt.
  if (typeof boundProcessKeyDown === 'function') {
    window.removeEventListener('keydown', boundProcessKeyDown);
    console.log("Schlüsselmomente: Keydown-Listener (bound) entfernt.");
  } else {
    // Dieser Fall sollte nicht eintreten, wenn initSchluesselmomente korrekt gelaufen ist
    // und initializeEventHandlers() aufgerufen hat.
    console.warn("Schlüsselmomente: boundProcessKeyDown war nicht definiert beim Versuch, Keydown-Listener zu entfernen.");
  }

  if (typeof boundProcessKeyUp === 'function') {
    window.removeEventListener('keyup', boundProcessKeyUp);
    console.log("Schlüsselmomente: Keyup-Listener (bound) entfernt.");
  } else {
    // Dieser Fall sollte nicht eintreten.
    console.warn("Schlüsselmomente: boundProcessKeyUp war nicht definiert beim Versuch, Keyup-Listener zu entfernen.");
  }
  // Der alte Code zum Entfernen von Maus-Listenern (boundHandleCanvasMouseMove, boundHandleCanvasClick) wurde hier komplett entfernt.

  // 4. Wichtige Spielzustände zurücksetzen, um Seiteneffekte zu vermeiden
  gameState = 'cleaned_up'; // Setze einen eindeutigen Zustand
  keys.length = 0;
  obstacles.length = 0;
  enemies.length = 0;
  if (player) {
    player.dx = 0;
    player.dy = 0;
  }
  resetInputState(); // Tastaturstatus in input.js zurücksetzen (wird aus input.js importiert)
  console.log("Schlüsselmomente: Spielzustände zurückgesetzt.");

  // 5. Canvas leeren (optional, aber oft gewünscht, um alte Grafiken zu entfernen)
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("Schlüsselmomente: Canvas geleert.");
  }

  // Referenzen auf gebundene Handler zurücksetzen (optional, schadet aber nicht)
  // Diese Zeilen machen nur Sinn, wenn initializeEventHandlers() die Variablen neu setzt,
  // was bei jedem Aufruf von initSchluesselmomente() geschieht.
  boundProcessKeyDown = null;
  boundProcessKeyUp = null;

  console.log("Schlüsselmomente: Cleanup abgeschlossen. Spiel ist bereit zum Verlassen oder Neustart durch die Konsole.");
}
 
export function initSchluesselmomente(canvasParameter, ctxParameter, options) {
    cleanup();
    audioManager.initAudioManager(); 
    initHighscoreSystem(options);
   
    gameContext.state.storageMode = options.storageMode || 'local';

    canvas = canvasParameter;
    ctx = ctxParameter;

    if (!canvas || !ctx) {
        console.error("Schlüsselmomente FEHLER: Canvas oder Context wurde nicht korrekt übergeben oder ist null!");
        alert("Kritischer Fehler bei Spielstart: Canvas/Context fehlt.");
        return;
    }
    console.log(`Schlüsselmomente: Canvas (${canvas.width}x${canvas.height}) und Context erhalten.`);

    // Spielerobjekt erstellen, falls es noch nicht existiert
    if (!player) {
        player = createPlayer(canvas); // createPlayer aus entities.js
    }

    initializeEventHandlers(); 

    window.addEventListener('keydown', boundProcessKeyDown);
    window.addEventListener('keyup', boundProcessKeyUp);   

    // HIER starten wir die Animation
    gameState = 'game_start_screen';
    menuAnimationState = 'running'; // Animation auf "läuft" setzen
    menuAnimationStartTime = Date.now(); // Aktuelle Zeit als Startzeitpunkt merken

    //gameState = 'game_start_screen';
    
    // Diese Werte werden erst relevant, wenn das Spiel von Level 1 startet (durch resetToReady).
    // Wir können sie hier schon mal auf Standardwerte für einen "frischen" Spielstart setzen,
    // aber resetToReady() wird sie dann für Level 1 korrekt initialisieren.
    currentLevel = 1; 
    score = 0;
    levelKeysCollected = 0; 
    nextKeyNumber = 1;   
    
    // Spielobjekt-Arrays leeren (bleibt wichtig)
    keys.length = 0;
    obstacles.length = 0;
    enemies.length = 0;

    resetInputState(); 
    playerCanBeHit = true;
    if (player) { 
        player.dx = 0;
        player.dy = 0;
    }

    console.log(">>>> schluesselmomente_spiel.js: initSchluesselmomente() BEENDET, ruft gameLoop() für gameState 'game_start_screen' <<<<"); // Angepasster Log
    gameLoop(); 
}