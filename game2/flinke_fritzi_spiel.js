// game2/flinke_fritzi_spiel.js

import { CONFIG } from './config.js';
import { initGameInput, getPlayerMovementIntent, cleanupGameInput, setInputMode  } from './input.js';
import {
    drawPlayer, 
    drawObstacles,
    drawCollectibles,
    drawScore,
    drawGameOverSummaryScreen,
    drawBackground,
    drawInfoOverlayElements,
    drawFinishLine,
    drawGameMenu,
    drawGameInstructions,
    drawLocalHighscores,
    drawOnlineHighscores,
    drawNameInputScreen
} from './drawing.js';
import { LEVELS } from './level.js';
import { loadAllGameAssets , ASSETS } from './assets.js';
import audioManager from './audioManager.js';
import { decideActionForCar, getLaneIndexFromY, findCarAhead } from './carAI.js';
import deathSequenceManager from './deathSequenceManager.js';
import { getHighscores, isHighscore, saveHighscore } from './highscoreManager.js'; 

let canvas, ctx;
let player, obstacles, collectibles, isGameOver, isGameWon, score, lastTime;
let animationFrameId = null; 
let currentGameState = 'playing'; // Mögliche Zustände: 'playing', 'levelTransitionDisplay', 'gameOver'
let obstaclesPassedCount = 0;
let isInEndlessMode = false; 
let laneDefinitions = [];
let backgroundX = 0;
let distanceTraveled = 0;
let isPaused = false;
let playerLives;
let isNewHighscore = false;
let isLevelingUp = false;
let finishLine = {
    isActive: false,
    x: 0,
    y: 0,
    width: 190, // So breit wie der Bildschirm
    height: 640, // Höhe des Banners
    speed: 5,
    text: ""
};
let highscorePlayerName = "";
let highscoreData = [];
let highscoreCurrentPage = 0;
let collisionDelayTimer = 0;    
const COLLISION_DELAY = 1000;      // Delay Sound Unfall
let finalScoreForDisplay = 0;
let gameOverDetailState = null; // Mögliche Werte: 'pending_check', 'no_highscore', 'highscore_on_canvas', 'name_input_done'
let backgroundTileDrawnWidth = 0;
let hasCheckedHighScoreThisGameOver = false;
let currentActualRoadScrollSpeed = 0; 
let roadAreaTopY_pixel = 0;           // Oberste Y-Grenze der Straße für Fritzi
let roadAreaBottomY_pixel = 0;        // Unterste Y-Grenze der Straße für Fritzi
let audioSystemReady = false;
let soundCooldowns = {};            
const SOUND_COOLDOWN_MS = 2000;    // (200ms Cooldown)
const menuItems = [ 
    { id: 'start_game', text: 'Spiel starten' },
    { id: 'show_highscores', text: 'Highscores' },
    { id: 'show_instructions', text: 'Anleitung' }
];
let currentMenuItemIndex = 0;
const LEVEL_TRANSITION_DURATION = 2500;

export async function initFlinkeFritzi(canvasRef, ctxRef, options) {
    // NEU: Wert aus dem Launcher direkt am Anfang setzen, genau wie bei Spiel 1
    if (options && options.storageMode) {
        CONFIG.highscore.storageMode = options.storageMode;
    }

    console.log("Flinke Fritzi: initFlinkeFritzi wird aufgerufen.");
    canvas = canvasRef;
    ctx = ctxRef;
    try {
        audioSystemReady = await audioManager.init(); 
        if (!audioSystemReady) {
            console.warn("Flinke Fritzi init: AudioManager konnte nicht initialisiert werden. Spiel läuft ohne Sound.");
        }
        await loadAllGameAssets(); 
        initGameInput();
    } catch (e) {
        console.error("Flinke Fritzi SPIEL: FEHLER bei der Initialisierung:", e);
        return;
    }

    player = {
        x: CONFIG.player.minX + 50, 
        y: CONFIG.canvasHeight / 2 - CONFIG.player.height / 2, 
        width: CONFIG.player.width,
        height: CONFIG.player.height
    };
    console.log("Flinke Fritzi init: Spielerobjekt initialisiert:", player);
    
    if (typeof deathSequenceManager.init === 'function') {
        deathSequenceManager.init(CONFIG, ASSETS.loadedImages, player); 
    } else {
        console.error("deathSequenceManager oder dessen init-Funktion nicht gefunden!");
    }

    const bgImage = ASSETS.loadedImages.street;
    if (bgImage && bgImage.height > 0) {
        const originalTileWidth = bgImage.width;
        const originalTileHeight = bgImage.height;
        const tileDrawnHeight = CONFIG.canvasHeight;
        const scaleRatio = tileDrawnHeight / originalTileHeight;
        backgroundTileDrawnWidth = originalTileWidth * scaleRatio;
    } else {
        backgroundTileDrawnWidth = CONFIG.canvasWidth;
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    CONFIG.currentLevelIndex = 0; 
    backgroundX = 0;
    lastTime = 0;
    isGameOver = false;
    score = 0;          
    hasCheckedHighScoreThisGameOver = false; 
    gameOverDetailState = null;
    isPaused = false; 
    playerLives = CONFIG.playerStartLives;
   
    switchToStartScreen();

    // GameLoop nur starten, falls nicht schon durch einen vorherigen Aufruf aktiv
    if (!animationFrameId) { 
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    console.log("Flinke Fritzi: Initialisiert, Startbildschirm ist jetzt aktiv.");
}

function resetGame() {
    initGameInput();
    const levelData = LEVELS[CONFIG.currentLevelIndex]; 
    console.log(`Flinke Fritzi: resetGame wird aufgerufen für Level ${CONFIG.currentLevelIndex + 1} (${levelData.name}).`);

    CONFIG.carSpeedRelMin = levelData.carSpeedRelMin !== undefined ? levelData.carSpeedRelMin : 1.0;
    CONFIG.carSpeedRelMax = levelData.carSpeedRelMax !== undefined ? levelData.carSpeedRelMax : 2.0;
    if (CONFIG.carSpeedRelMin > CONFIG.carSpeedRelMax) { 
        CONFIG.carSpeedRelMin = Math.max(0.1, CONFIG.carSpeedRelMax - 0.5); 
    }
    CONFIG.spawnInterval = levelData.spawnInterval;

    // Spieler initialisieren für direkte Steuerung
    player = {
        x: CONFIG.player.minX + 10,
        y: CONFIG.canvasHeight / 2 - CONFIG.player.height / 2, 
        width: CONFIG.player.width,
        height: CONFIG.player.height
    };

    roadAreaTopY_pixel = CONFIG.roadTopMargin;
    let calculatedRoadHeight = 0;
    for (let i = 0; i < CONFIG.numberOfLanes; i++) {
        calculatedRoadHeight += CONFIG.laneClearHeights[i];
        if (i < CONFIG.numberOfLanes - 1) {
            calculatedRoadHeight += CONFIG.roadLineThickness;
        }
    }
    roadAreaBottomY_pixel = CONFIG.roadTopMargin + calculatedRoadHeight;

    setupLanes(); 

    // Spielobjekte und diverse Zustände zurücksetzen
    obstacles = [];
    collectibles = [];
    isGameOver = false; 
    isLevelingUp = false; 
    obstaclesPassedCount = 0;  
    isInEndlessMode = false; 
    hasCheckedHighScoreThisGameOver = false;
    gameOverDetailState = null;     
    currentGameState = 'playing'; 
    currentActualRoadScrollSpeed = CONFIG.road.baseScrollSpeed;

    // Autospawn-Timer und erste Objekte spawnen
    CONFIG.spawnTimer = 0; 
    if (CONFIG.debugLaneSetup) {
        spawnTestCars();
    } else {
        // Normales Verhalten, wenn der Test-Modus aus ist
        spawnObstacleInRoad();
    if (levelData.collectibleSpawning && typeof attemptToSpawnCollectibles === 'function') { 
        attemptToSpawnCollectibles(); 
    }
    }
    if (audioSystemReady) {
    if (audioManager.isMusicCurrentlyPausedByGame() && audioManager.getCurrentPlayingMusicName() === 'musik_spiel') {
        console.log("FLINKE FRITZI DEBUG: resetGame - Setze 'musik_spiel' fort.");
        audioManager.handleGamePauseState(false); 
        audioManager.setMusicVolume(CONFIG.music.ingame.volume); 
    } else {
        console.log("FLINKE FRITZI DEBUG: resetGame - Starte 'musik_spiel' neu.");
        audioManager.stopMusic(); 
        audioManager.playMusic(CONFIG.music.ingame.soundName, true, CONFIG.music.ingame.volume); 
    }
}
console.log(`Flinke Fritzi: Level ${CONFIG.currentLevelIndex + 1} gestartet.`);
}

function setupLanes() {
    laneDefinitions = []; 
    let currentY = CONFIG.roadTopMargin; 

    if (!CONFIG.laneClearHeights || CONFIG.laneClearHeights.length !== CONFIG.numberOfLanes) {
        console.error("Fehler in der Konfiguration: CONFIG.laneClearHeights ist nicht korrekt definiert oder passt nicht zu CONFIG.numberOfLanes!");
        return; 
    }

    for (let i = 0; i < CONFIG.numberOfLanes; i++) {
        const laneTopClear = currentY;
        const laneBottomClear = currentY + CONFIG.laneClearHeights[i];
        
        laneDefinitions.push({
            id: i,     
            topClear: laneTopClear,   
            bottomClear: laneBottomClear  
        });

        if (i < CONFIG.numberOfLanes - 1) { 
            currentY = laneBottomClear + CONFIG.roadLineThickness;
        }
    }
}

function spawnObstacleInRoad() {
    const currentLevelData = LEVELS[CONFIG.currentLevelIndex];
    if (!currentLevelData || !currentLevelData.carDistribution || currentLevelData.carDistribution.length === 0) return;

    // --- (Die Auswahl des Autotyps bleibt komplett gleich) ---
    let totalWeight = 0;
    currentLevelData.carDistribution.forEach(car => totalWeight += car.weight);
    let randomWeight = Math.random() * totalWeight;
    let chosenCarTypeKey = currentLevelData.carDistribution[0].typeKey;
    for (const car of currentLevelData.carDistribution) {
        if (randomWeight < car.weight) {
            chosenCarTypeKey = car.typeKey;
            break;
        }
        randomWeight -= car.weight;
    }
    const carTypeData = CONFIG.obstacleTypes[chosenCarTypeKey];
    if (!carTypeData) return;

    // --- NEUE LOGIK ZUR GRÖSSENBERECHNUNG ---
    const image = ASSETS.loadedImages[carTypeData.imageAssetKey];
    if (!image) {
        console.warn(`Bild für Autotyp ${chosenCarTypeKey} nicht gefunden!`);
        return;
    }
    // Berechne die neue Größe basierend auf dem scale-Wert
    const obsWidth = image.naturalWidth * carTypeData.scale;
    const obsHeight = image.naturalHeight * carTypeData.scale;

    // --- (Die Berechnung der Auto-Position bleibt gleich, nutzt aber obsHeight) ---
    const minSpeed = carTypeData.speedRelMin;
    const maxSpeed = carTypeData.speedRelMax;
    const randomSpeed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
    const chosenLaneIndex = Math.floor(Math.random() * CONFIG.numberOfLanes);
    const selectedLane = laneDefinitions[chosenLaneIndex];
    const minYForCarTopEdge = selectedLane.topClear + CONFIG.laneVariationBuffer;
    const maxYForCarTopEdge = selectedLane.bottomClear - obsHeight - CONFIG.laneVariationBuffer;
    let carY = (minYForCarTopEdge >= maxYForCarTopEdge) ?
               selectedLane.topClear + ((selectedLane.bottomClear - selectedLane.topClear) - obsHeight) / 2 :
               Math.random() * (maxYForCarTopEdge - minYForCarTopEdge) + minYForCarTopEdge;

    // Das Auto-Objekt wird mit der neu berechneten Größe erstellt
    const newCar = {
        x: CONFIG.canvasWidth,
        y: Math.round(carY),
        width: obsWidth,   // <-- Neue berechnete Breite
        height: obsHeight, // <-- Neue berechnete Höhe
        type: carTypeData.imageAssetKey,
        speed: randomSpeed,
        id: Math.floor(Math.random() * 10000),
        aiAction: { action: 'CONTINUE_STRAIGHT' },
        laneIndex: chosenLaneIndex,
        isChangingLanes: false,
        targetY: Math.round(carY),
        laneChangeSpeed: CONFIG.ai.laneChangeSpeed,
        aiReactionCooldown: Math.random() * 200 + 100,
        aiUpdateTimer: 0,
        audio: null
    };

    // --- (Die Sound-Logik bleibt komplett gleich) ---
    if (audioSystemReady && carTypeData.passingSoundName) {
        let soundNameToPlay = null;
        const soundProperty = carTypeData.passingSoundName;
        if (Array.isArray(soundProperty) && soundProperty.length > 0) {
            const randomIndex = Math.floor(Math.random() * soundProperty.length);
            soundNameToPlay = soundProperty[randomIndex];
        } else if (typeof soundProperty === 'string') {
            soundNameToPlay = soundProperty;
        }
        if (soundNameToPlay) {
            const now = Date.now();
            if (!soundCooldowns[chosenCarTypeKey] || (now - soundCooldowns[chosenCarTypeKey] > SOUND_COOLDOWN_MS)) {
                soundCooldowns[chosenCarTypeKey] = now;
                newCar.audio = audioManager.createPositionalSound(soundNameToPlay, false);
            }
        }
    }
    
    obstacles.push(newCar);
}

function spawnTestCars() {
    console.log("TEST-MODUS: Platziere ein Auto in jeder Spur.");
    obstacles = []; // Leere die Liste, um nur die Test-Autos zu haben

    const carTypeData = CONFIG.obstacleTypes['car1']; // Wir nehmen einfach car1 als Testobjekt

    // Gehe durch jede Spur von 0 bis zur letzten
    for (let i = 0; i < CONFIG.numberOfLanes; i++) {
        const lane = laneDefinitions[i];
        
        // Berechne die Y-Position, um das Auto in der Spur zu zentrieren
        const carY = lane.topClear + (lane.bottomClear - lane.topClear) / 2 - (carTypeData.height / 2);

        obstacles.push({
            x: CONFIG.canvasWidth / 2 - carTypeData.width / 2, // Platziere es in der Mitte des Bildschirms
            y: carY,
            width: carTypeData.width,
            height: carTypeData.height,
            type: carTypeData.imageAssetKey,
            speed: 0 // Geschwindigkeit auf 0, damit es stillsteht
        });
    }
}

function spawnSingleCollectible(typeToSpawn) {
    console.log(`spawnSingleCollectible AUFGERUFEN für Typ: ${typeToSpawn}`); // << Dieser Log ist wichtig
    // Hole die Eigenschaften dieses Sammelobjekt-Typs aus CONFIG
    const collectibleProps = CONFIG.collectibleTypes[typeToSpawn];
    if (!collectibleProps) {
        console.warn(`Unbekannter Sammelobjekt-Typ angefordert: ${typeToSpawn}`);
        return;
    }

    const itemWidth = collectibleProps.size.width;
    const itemHeight = collectibleProps.size.height;

    if (!laneDefinitions || laneDefinitions.length === 0) {
        console.warn("Fahrspuren nicht definiert, Sammelobjekt kann nicht platziert werden.");
        return;
    }

    // Bestimme den gesamten Straßenbereich für Sammelobjekte
    const overallRoadTopY = laneDefinitions[0].topClear;
    const overallRoadBottomY = laneDefinitions[CONFIG.numberOfLanes - 1].bottomClear;

    const minYForItemTopEdge = overallRoadTopY;
    const maxYForItemTopEdge = overallRoadBottomY - itemHeight; // Stelle sicher, dass das ganze Objekt reinpasst

    if (minYForItemTopEdge >= maxYForItemTopEdge) {
        console.warn(`Sammelobjekt-Typ '${typeToSpawn}' (Größe: ${itemWidth}x${itemHeight}) zu groß für den Straßenbereich.`);
        return;
    }

    let itemY;
    let attempts = 0;
    const maxPlacementAttempts = 20; // Max Versuche, eine freie Stelle zu finden

    // X-Position ist immer am rechten Rand, wenn gespawnt wird
    const itemX = CONFIG.canvasWidth; 

    do {
        itemY = Math.random() * (maxYForItemTopEdge - minYForItemTopEdge) + minYForItemTopEdge;
        itemY = Math.round(itemY);
        attempts++;
    } while (isOverlappingWithObstacleOrOtherCollectible(itemX, itemY, itemWidth, itemHeight) && attempts < maxPlacementAttempts);

    if (attempts >= maxPlacementAttempts && isOverlappingWithObstacleOrOtherCollectible(itemX, itemY, itemWidth, itemHeight)) {
        // console.log(`Konnte für '${typeToSpawn}' nach ${maxPlacementAttempts} Versuchen keine freie Position finden.`);
        return; // Nicht spawnen, um Überlappung zu vermeiden
    }

    collectibles.push({
        x: itemX,
        y: itemY,
        type: typeToSpawn,            // Typ des Sammelobjekts
        width: itemWidth,             // Individuelle Breite
        height: itemHeight,           // Individuelle Höhe
        imageAssetKey: collectibleProps.imageAssetKey // NEU: Den Bild-Schlüssel hier speichern
    });
    console.log(`Sammelobjekt '${typeToSpawn}' gespawnt bei Y: ${itemY}`);
}

function isOverlappingWithObstacleOrOtherCollectible(itemX, itemY, itemWidth, itemHeight) {
    const itemRect = { x: itemX - itemWidth, y: itemY, width: itemWidth, height: itemHeight }; // itemX ist rechte Kante beim Spawnen
                                                                                             // oder itemX ist linke Kante, wenn es sich bewegt.
                                                                                             // Für Spawning bei CONFIG.canvasWidth ist es besser, die linke Kante zu nehmen.
                                                                                             // Also itemX = CONFIG.canvasWidth (linke Kante des neuen Objekts)
    const checkRect = { x: itemX, y: itemY, width: itemWidth, height: itemHeight };


    // Prüfung gegen Hindernisse (Autos)
    // Wir prüfen nur Hindernisse, die sich im rechten Teil des Bildschirms befinden könnten,
    // wo das neue Objekt spawnen soll (also x > canvasWidth / 2 oder ähnlich).
    for (let obs of obstacles) {
        if (obs.x > CONFIG.canvasWidth / 2) { // Nur relevante Hindernisse prüfen
            if (checkRect.x < obs.x + obs.width &&
                checkRect.x + checkRect.width > obs.x &&
                checkRect.y < obs.y + obs.height &&
                checkRect.y + checkRect.height > obs.y) {
                // console.log("Überlappt mit Hindernis");
                return true; // Überlappt mit einem Hindernis
            }
        }
    }

    // Prüfung gegen andere Sammelobjekte (um zu dichte Platzierung zu vermeiden)
    // Ähnliche Logik wie oben, nur mit dem `collectibles`-Array
    for (let col of collectibles) {
         if (col.x > CONFIG.canvasWidth / 2) { // Nur relevante Sammelobjekte prüfen
            if (checkRect.x < col.x + col.width &&
                checkRect.x + checkRect.width > col.x &&
                checkRect.y < col.y + col.height &&
                checkRect.y + checkRect.height > col.y) {
                // console.log("Überlappt mit anderem Sammelobjekt");
                return true; // Überlappt mit einem anderen Sammelobjekt
            }
        }
    }
    return false; // Keine Überlappung gefunden
}

function attemptToSpawnCollectibles() {
    const currentLevelData = LEVELS[CONFIG.currentLevelIndex];
    if (!currentLevelData || !currentLevelData.collectibleSpawning) { // Zusätzliche Prüfung für currentLevelData
        // console.log("Keine Level-Daten oder collectibleSpawning-Definition für dieses Level gefunden.");
        return; 
    }

    let possibleTypesToSpawn = [];
    // Sammle alle Typen, deren individuelle Spawn-Chance erfolgreich war
    for (const type in currentLevelData.collectibleSpawning) {
        // Sicherstellen, dass der Typ auch in CONFIG.collectibleTypes definiert ist (hat Bild, Punkte etc.)
        if (CONFIG.collectibleTypes.hasOwnProperty(type)) {
            const chance = currentLevelData.collectibleSpawning[type];
            if (Math.random() < chance) {
                possibleTypesToSpawn.push(type);
            }
        }
    }

    // Wenn mindestens ein Typ die Chance bestanden hat, wähle zufällig einen davon aus
    if (possibleTypesToSpawn.length > 0) {
        const chosenType = possibleTypesToSpawn[Math.floor(Math.random() * possibleTypesToSpawn.length)];
        // console.log(`---> Aus ${possibleTypesToSpawn.length} möglichen Typen (${possibleTypesToSpawn.join(', ')}) wurde Typ '${chosenType}' zum Spawnen ausgewählt.`);
        spawnSingleCollectible(chosenType); // Ruft die Funktion auf, die versucht, dieses eine Objekt zu platzieren
    }
}

function switchToStartScreen() {
    console.log("FLINKE FRITZI DEBUG: switchToStartScreen() wird ausgeführt.");
    currentGameState = 'gameMenu';
    isPaused = false;

    // NEU: Stoppe alle aktiven Auto-Sounds, bevor zum Menü gewechselt wird
    if (obstacles && obstacles.length > 0) {
        for (const car of obstacles) {
            if (car.audio) {
                car.audio.stop();
            }
        }
        obstacles = []; // Leere auch direkt die Liste
    }

    // Wichtige Variablen für einen sauberen Startbildschirm-Zustand zurücksetzen:
    isGameOver = false;
    gameOverDetailState = null;
    hasCheckedHighScoreThisGameOver = false;
    playerLives = CONFIG.playerStartLives;
    score = 0;
    CONFIG.currentLevelIndex = 0; 

    if (audioSystemReady) {
        if (audioManager.getCurrentPlayingMusicName() !== 'musik_start') {
            audioManager.stopMusic();
            audioManager.playMusic(CONFIG.music.menu.soundName, true, CONFIG.music.menu.volume);
        }
    }
}

async function updateGameOver(input) {
    if (!hasCheckedHighScoreThisGameOver) {
        hasCheckedHighScoreThisGameOver = true;

        const kilometers = (distanceTraveled * CONFIG.distanceToMetersFactor) / 1000;
        const distanceBonus = Math.floor(score * kilometers);
        finalScoreForDisplay = score + distanceBonus;

        isNewHighscore = await isHighscore(finalScoreForDisplay); // Prüfen und Ergebnis merken

        currentGameState = 'gameOverSummary'; // Immer zu diesem neuen Zustand wechseln
        isGameOver = false;
        setInputMode('game'); // Eingabemodus zurücksetzen
    }
}

function updateGameOverSummary(input) {
    if (input.isEnterJustPressed) {
        if (isNewHighscore) {
            // Bei Highscore: Zur Namenseingabe
            highscorePlayerName = "";
            currentGameState = 'enteringHighscoreName';
            setInputMode('text');
        } else {
            // Sonst: Zurück zum Hauptmenü
            switchToStartScreen();
        }
    }
}

function updateStartScreen(input, dtFactor) {
    if (input.isEnterJustPressed) {
        CONFIG.currentLevelIndex = 0; 
        console.log("DEBUG update/startScreen: Enter erkannt. audioSystemReady ist:", audioSystemReady);
        if (audioSystemReady) {
            console.log("DEBUG update/startScreen: Rufe audioManager.stopMusic() auf...");
            audioManager.stopMusic(); 
            console.log("DEBUG update/startScreen: audioManager.stopMusic() wurde aufgerufen.");
        } else {
            console.log("DEBUG update/startScreen: audioSystemReady ist false, stopMusic NICHT aufgerufen.");
        }
        currentGameState = 'infoOverlayScreen'; 
        console.log("Flinke Fritzi: Erster Enter auf 'startScreen', wechsle zu 'infoOverlayScreen'.");
    }
}

function updateInfoOverlayScreen(input, dtFactor) { // Dein Info-Overlay Screen
    if (input.isEnterJustPressed) {
        distanceTraveled = 0;
        resetGame(); 
        console.log("Flinke Fritzi: Zweiter Enter auf 'infoOverlayScreen', starte Spiel via resetGame().");
    }
}

function updateObstacles(dtFactor, deltaTime) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const car = obstacles[i];

        // --- 1. "Denk"-Phase: Trifft nur alle paar Momente eine NEUE Entscheidung ---
        if (!car.isChangingLanes) {
            car.aiUpdateTimer += deltaTime;
            if (car.aiUpdateTimer >= car.aiReactionCooldown) {
                car.aiUpdateTimer = 0;
                
                // Triff eine neue Entscheidung
                const newAction = decideActionForCar(car, obstacles, player, LEVELS[CONFIG.currentLevelIndex], laneDefinitions);

                // NEUE LOGIK: Prüfe, ob das Auto GERADE JETZT anfängt zu bremsen (zu folgen)
                if (newAction.action === 'FOLLOW' && car.aiAction.action !== 'FOLLOW') {
                    // Spiele den Hup-Sound nur bei diesem Zustandswechsel ab
                    if (audioSystemReady) {
                        audioManager.playSoundEffect(CONFIG.uiSounds.honk.soundName, CONFIG.uiSounds.honk.volume);
                    }
                }
                
                // Speichere die neue Aktion für den nächsten Frame
                car.aiAction = newAction;
            }
        }

        // --- 2. "Handlungs"-Phase: Führt die GESPEICHERTE Aktion in JEDEM Frame aus ---
        
        // Aktion für Spurwechsel vorbereiten
        if (car.aiAction && car.aiAction.action === 'CHANGE_LANE' && !car.isChangingLanes) {
            car.isChangingLanes = true;
            const targetLane = laneDefinitions[car.aiAction.targetLaneIndex];
            car.targetY = targetLane.topClear + ((targetLane.bottomClear - targetLane.topClear) / 2) - (car.height / 2);
        }
        
        // Physische Bewegung für den Spurwechsel
        if (car.isChangingLanes) {
            const yDifference = car.targetY - car.y;
            const distanceToMove = car.laneChangeSpeed * dtFactor;
            if (Math.abs(yDifference) <= distanceToMove) {
                car.y = car.targetY;
                car.isChangingLanes = false;
                const newLaneIndex = getLaneIndexFromY(car.y, car.height, laneDefinitions);
                if (newLaneIndex !== null) car.laneIndex = newLaneIndex;
                // Nach dem Wechsel ist die Aktion wieder "geradeaus"
                car.aiAction = { action: 'CONTINUE_STRAIGHT' }; 
            } else {
                car.y += Math.sign(yDifference) * distanceToMove;
            }
        }

        // --- 3. Geschwindigkeits-Berechnung basierend auf der GESPEICHERTEN Aktion ---
        let currentSpeed = car.speed; // Standard: Eigene Geschwindigkeit
        if (car.aiAction && car.aiAction.action === 'FOLLOW') {
           // Wenn der Befehl "Folgen" lautet, nimm die Geschwindigkeit des Ziels.
           // Füge eine Sicherheitsprüfung hinzu, falls das Ziel-Auto nicht mehr existiert.
           if (car.aiAction.target && obstacles.includes(car.aiAction.target)) {
               currentSpeed = car.aiAction.target.speed;
           }
        }

        // --- 4. Finale Bewegung nach vorne ---
        let effectiveCarSpeed = currentActualRoadScrollSpeed + currentSpeed;
        car.x -= effectiveCarSpeed * dtFactor;

        // NEUER BLOCK: Sound-Update mit korrekter Start-Logik
        if (car.audio) {
            const carTypeData = CONFIG.obstacleTypes[car.type];
            
            const distanceX = Math.abs(car.x - player.x);
            const distanceY = Math.abs(car.y - player.y);
            const lossX = Math.min(1, distanceX / CONFIG.carSound.hearingDistanceX);
            const lossY = Math.min(1, distanceY / CONFIG.carSound.hearingDistanceY);
            const maxLoss = Math.max(lossX, lossY);
            const volumeFactor = 1 - maxLoss;
            const currentVolume = carTypeData.baseVolume * volumeFactor;

            // NEUE PRÜFUNG: Sound nur starten, wenn er hörbar ist UND noch nicht läuft
            if (currentVolume > 0 && !car.audio.isPlaying()) {
                car.audio.play();
            }
            
            car.audio.setGain(currentVolume);
        }

    // Auto vom Bildschirm entfernen
    if (car.x + car.width < 0) {
        if (car.audio) car.audio.stop(); // WICHTIG: Sound stoppen
        obstacles.splice(i, 1);
        if (!isInEndlessMode) obstaclesPassedCount++;
    }
}
}

function updatePlaying(input, dtFactor, deltaTime) {
    // 1. Gesamtdistanz und Welt-Bewegung berechnen
    distanceTraveled += currentActualRoadScrollSpeed * dtFactor;
    backgroundX -= currentActualRoadScrollSpeed * dtFactor;
    if (backgroundTileDrawnWidth > 0 && backgroundX <= -backgroundTileDrawnWidth) {
        backgroundX += backgroundTileDrawnWidth;
    }

    // 2. Spielerbewegung und Geschwindigkeitsanpassung
    let horizontalInputActive = false;
    if (input.isUpPressed) {
        player.y -= CONFIG.player.verticalSpeed * dtFactor;
    } else if (input.isDownPressed) {
        player.y += CONFIG.player.verticalSpeed * dtFactor;
    }
    if (input.isLeftPressed) {
        player.x -= CONFIG.player.horizontalSpeed * dtFactor;
        currentActualRoadScrollSpeed = Math.max(CONFIG.road.minScrollSpeed, currentActualRoadScrollSpeed - CONFIG.road.speedAdjustRate * dtFactor);
        horizontalInputActive = true;
    } else if (input.isRightPressed) {
        player.x += CONFIG.player.horizontalSpeed * dtFactor;
        currentActualRoadScrollSpeed = Math.min(CONFIG.road.maxScrollSpeed, currentActualRoadScrollSpeed + CONFIG.road.speedAdjustRate * dtFactor);
        horizontalInputActive = true;
    }

    // 3. Automatische Anpassungen, wenn keine Taste gedrückt wird
    if (!horizontalInputActive) {
        // Geschwindigkeit normalisiert sich langsam zur Basis-Geschwindigkeit
        if (currentActualRoadScrollSpeed > CONFIG.road.baseScrollSpeed) {
        currentActualRoadScrollSpeed = Math.max(CONFIG.road.baseScrollSpeed, currentActualRoadScrollSpeed - CONFIG.road.idleDecelerationRate * dtFactor);
    } else if (currentActualRoadScrollSpeed < CONFIG.road.baseScrollSpeed) {
        currentActualRoadScrollSpeed = Math.min(CONFIG.road.baseScrollSpeed, currentActualRoadScrollSpeed + CONFIG.road.idleDecelerationRate * dtFactor);
    }
        // Spieler driftet langsam nach links
        if (player.x > CONFIG.player.minX) {
            player.x -= CONFIG.player.horizontalDriftSpeed * dtFactor;
        }
    }

    // 4. Spielerposition innerhalb der erlaubten Grenzen halten
    player.x = Math.max(CONFIG.player.minX, Math.min(player.x, CONFIG.player.maxX));
    player.y = Math.max(roadAreaTopY_pixel, Math.min(player.y, roadAreaBottomY_pixel - player.height));

    // 5. Spiel-Logik (nur ausführen, wenn der Lane-Setup-Testmodus AUS ist)
    if (!CONFIG.debugLaneSetup) {
        
        // Objekt-Spawning
        CONFIG.spawnTimer += deltaTime;
        if (CONFIG.spawnTimer > CONFIG.spawnInterval) {
            spawnObstacleInRoad();
            attemptToSpawnCollectibles();
            CONFIG.spawnTimer = 0;
        }

        // Bewegung der Objekte
        updateObstacles(dtFactor, deltaTime);
        collectibles.forEach(col => col.x -= currentActualRoadScrollSpeed * dtFactor);
        collectibles = collectibles.filter(col => col.x + col.width > 0);

        // Kollisionen mit Sammelobjekten
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const item = collectibles[i];
            if (player.x < item.x + item.width && player.x + player.width > item.x &&
                player.y < item.y + item.height && player.y + player.height > item.y) {
                const itemProps = CONFIG.collectibleTypes[item.type];
                if (itemProps) {
                    score += itemProps.points;
                    if (score < 0) score = 0;
                    if (audioSystemReady && itemProps.soundName) {
                     audioManager.playSoundEffect(itemProps.soundName, itemProps.volume);
                  }
                }
                collectibles.splice(i, 1);
            }
        }

        // Kollisionen mit Hindernissen
        for (let obs of obstacles) {
            const playerHitbox = {
                x: player.x + CONFIG.player.hitboxPadding,
                y: player.y + CONFIG.player.hitboxPadding,
                width: player.width - (CONFIG.player.hitboxPadding * 2),
                height: player.height - (CONFIG.player.hitboxPadding * 2)
            };
            const carTypeData = CONFIG.obstacleTypes[obs.type];
            const carHitbox = {
                x: obs.x + carTypeData.hitbox.paddingX,
                y: obs.y + carTypeData.hitbox.paddingY,
                width: obs.width - (carTypeData.hitbox.paddingX * 2),
                height: obs.height - (carTypeData.hitbox.paddingY * 2)
            };

            if (playerHitbox.x < carHitbox.x + carHitbox.width && playerHitbox.x + playerHitbox.width > carHitbox.x &&
                playerHitbox.y < carHitbox.y + carHitbox.height && playerHitbox.y + playerHitbox.height > carHitbox.y) {
                if (audioSystemReady) audioManager.playSoundEffect(CONFIG.uiSounds.collision.soundName, CONFIG.uiSounds.collision.volume);
                playerLives--;
                audioManager.stopMusic();
                // NEU: Stoppe sofort alle Auto-Sounds
                for (const car of obstacles) {
                 if (car.audio) {
                    car.audio.stop();
                 }
                 }
                collisionDelayTimer = COLLISION_DELAY; // Starte den Timer
                currentGameState = 'collisionDelay';
                return; 
            }
        }
    }

    // 6. Logik für nahtlosen Level-Aufstieg (läuft unabhängig vom Test-Modus)
    const metersTraveled = Math.floor(distanceTraveled * CONFIG.distanceToMetersFactor);

    if (!isLevelingUp) {
        const currentLevelData = LEVELS[CONFIG.currentLevelIndex];
        if (currentLevelData.distanceToReach && metersTraveled >= currentLevelData.distanceToReach) {
            const nextLevelIndex = CONFIG.currentLevelIndex + 1;
            if (LEVELS[nextLevelIndex]) {
                isLevelingUp = true;
                finishLine.isActive = true;
                finishLine.x = CONFIG.canvasWidth;
                finishLine.y = CONFIG.canvasHeight / 2 - finishLine.height / 2;
                finishLine.text = `Etappe ${nextLevelIndex + 1}`;
            } else {
                isInEndlessMode = true;
            }
        }
    }

    // 7. Ziellinien-Animation
    if (finishLine.isActive) {
        finishLine.x -= finishLine.speed * dtFactor;
        if (finishLine.x + finishLine.width < 0) {
            finishLine.isActive = false;
            CONFIG.currentLevelIndex++;
            const newLevelData = LEVELS[CONFIG.currentLevelIndex];
            CONFIG.spawnInterval = newLevelData.spawnInterval;
            CONFIG.carDistribution = newLevelData.carDistribution;
            console.log(`SPIEL LÄUFT WEITER: Wechsle zu Level ${CONFIG.currentLevelIndex + 1}`);
            isLevelingUp = false;
        }
    }
}

function update(deltaTime, input) {
    const targetFrameTime = 1000 / 60;
    const dtFactor = deltaTime / targetFrameTime;

    // Game Over hat Vorrang
    if (isGameOver) {
        updateGameOver(input);
        return;
    }

    // Die Pause-Logik (wird in gameLoop behandelt, aber zur Sicherheit hier stoppen)
    if (isPaused) {
        return;
    }

    // Logik für die laufende Todessequenz
    if (deathSequenceManager.isActive()) {
        const sequenceFinished = deathSequenceManager.update(input, dtFactor, deltaTime);
        if (sequenceFinished) {
            resetGame();
        }
        return; // Während der Sequenz nichts anderes tun
    }

    // Zustandsbasierte Updates für alle anderen Fälle
    switch (currentGameState) {
        case 'gameMenu':
            updateGameMenu(input);
            break;

        case 'showingInstructions':
            updateShowingInstructions(input);
            break;

        case 'showingHighscores':
            updateShowingHighscores(input); // Diese Funktion wird jetzt korrekt aufgerufen
            break;

        case 'gameOverSummary': // <-- NEUER CASE
            updateGameOverSummary(input);
            break;

        case 'enteringHighscoreName':
            updateEnteringHighscoreName(input);
            break;

        case 'infoOverlayScreen':
            updateInfoOverlayScreen(input, dtFactor);
            break;

        case 'playing':
            if (player) {
                updatePlaying(input, dtFactor, deltaTime);
            }
            break;

            case 'collisionDelay': // <-- NEUER BLOCK
            collisionDelayTimer -= deltaTime;
            if (collisionDelayTimer <= 0) {
            if (playerLives > 0) {
                currentGameState = 'deathSequence';
                deathSequenceManager.start(player.x, player.y, laneDefinitions);
                obstacles = [];
                collectibles = [];
            } else {
                isGameOver = true;
            }
        }
        break;
            
        default:
            // Fängt unbekannte Zustände ab
            console.warn("Unbekannter Spielzustand in update():", currentGameState);
    }
}

function updateGameMenu(input) {
    const previousMenuItemIndex = currentMenuItemIndex; // Merkt sich die alte Position

    // --- NEUE, intuitive Navigation für das Spalten-Layout ---
    if (input.isRightJustPressed) {
        // Springe von "Spiel starten" (links) zu "Highscore" (rechts)
        if (currentMenuItemIndex === 0) {
            currentMenuItemIndex = 1;
        }
    } else if (input.isLeftJustPressed) {
        // Springe von der rechten Spalte zurück zu "Spiel starten"
        if (currentMenuItemIndex === 1 || currentMenuItemIndex === 2) {
            currentMenuItemIndex = 0;
        }
    } else if (input.isDownJustPressed) {
        // Gehe nur in der rechten Spalte nach unten (von Highscore zu Anleitung)
        if (currentMenuItemIndex === 1) {
            currentMenuItemIndex = 2;
        }
    } else if (input.isUpJustPressed) {
        // Gehe nur in der rechten Spalte nach oben (von Anleitung zu Highscore)
        if (currentMenuItemIndex === 2) {
            currentMenuItemIndex = 1;
        }
    }

    // Spiele den Sound nur, wenn sich die Auswahl wirklich geändert hat
    if (previousMenuItemIndex !== currentMenuItemIndex) {
        if (audioSystemReady) audioManager.playSoundEffect(CONFIG.uiSounds.menuSelect.soundName, CONFIG.uiSounds.menuSelect.volume);
    }


    // --- Auswahl mit Enter (Dieser Teil ist von dir übernommen und unverändert) ---
    if (input.isEnterJustPressed) {
        const selectedItem = menuItems[currentMenuItemIndex];
        console.log(`Menü-Auswahl: ${selectedItem.id}`);

        switch (selectedItem.id) {
            case 'start_game':
                if (audioSystemReady) {
                    audioManager.stopMusic();
                }
                currentGameState = 'infoOverlayScreen';
                break;
            case 'show_highscores':
                highscoreCurrentPage = 0;
                getHighscores().then(scores => {
                    highscoreData = scores;
                    currentGameState = 'showingHighscores';
                });
                break;
            case 'show_instructions':
                currentGameState = 'showingInstructions';
                break;
        }
    }
}

function updateShowingInstructions(input) {
    if (input.isEnterJustPressed) {
        switchToStartScreen();
    }
}

function updateShowingHighscores(input) {
    // Mit Enter kommt man immer zurück zum Menü
    if (input.isEnterJustPressed) {
        switchToStartScreen();
        return; // Wichtig: Funktion hier beenden
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(highscoreData.length / itemsPerPage);

    // Mit Pfeiltasten blättern
    if (input.isLeftJustPressed) { // Annahme: Du hast isLeftJustPressed in input.js
        if (highscoreCurrentPage > 0) {
            highscoreCurrentPage--;
        }
    } else if (input.isRightJustPressed) { // Annahme: Du hast isRightJustPressed
        if (highscoreCurrentPage < totalPages - 1) {
            highscoreCurrentPage++;
        }
    }
}

async function updateEnteringHighscoreName(input) {
    if (input.lastKeyEvent) {
        const key = input.lastKeyEvent;
        if (key === 'Backspace') {
            highscorePlayerName = highscorePlayerName.slice(0, -1);
        } else if (key.length === 1 && highscorePlayerName.length < 15) {
            highscorePlayerName += key;
        }
    }

    if (input.isEnterJustPressed) {
        const nameToSave = highscorePlayerName.trim() === "" ? "FRITZI" : highscorePlayerName;

        const kilometers = ((distanceTraveled * CONFIG.distanceToMetersFactor) / 1000);
        const distanceBonus = Math.floor(score * kilometers);
        const finalScore = score + distanceBonus;
        
        // 1. Speichere den neuen Score
        await saveHighscore(nameToSave, finalScore, score, kilometers.toFixed(1));
        
        // 2. LADE DIE LISTE NEU, um deinen neuen Eintrag zu sehen
        highscoreData = await getHighscores();
        
        // 3. Wechsle zum Highscore-Bildschirm
        currentGameState = 'showingHighscores';
        setInputMode('game');
    }
}

function processLevelCompletion() {
    console.log("Verarbeite Levelabschluss. Aktueller Level Index (0-basiert):", CONFIG.currentLevelIndex);

    if (CONFIG.currentLevelIndex === LEVELS.length - 1) {
        // Wir waren bereits im letzten definierten Level und haben dessen Ziel (obstaclesToPass) erreicht.
        // Die Einblendung ist vorbei. Jetzt beginnt der "Endlosmodus" für dieses Level.
        isInEndlessMode = true;
        console.log("Endlosmodus für Level", CONFIG.currentLevelIndex + 1, "aktiviert.");
        // resetGame() wird aufgerufen, um das letzte Level "frisch" für den Endloslauf zu starten
        // (Spielerposition zurücksetzen, Zähler für interne Zwecke zurücksetzen, aber keine neuen Übergänge mehr).
        resetGame(); 
    } else {
        // Es gibt ein nächstes definiertes Level.
        CONFIG.currentLevelIndex++;
        console.log("Wechsle zu nächstem Level. Neuer Index:", CONFIG.currentLevelIndex);
        resetGame(); // Lädt das neue Level und setzt alles dafür zurück.
    }
    currentGameState = 'playing'; // Zurück zum Spielzustand
    levelTransitionMessage = "";    // Meldung zurücksetzen
}

function draw() {
    if (!ctx) return;

    // 1. Canvas bei jedem Frame leeren
    ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // 2. Zeichne den Bildschirm basierend auf dem aktuellen Spielzustand
    // Die Menü-Zustände nutzen alle den statischen Menü-Hintergrund
    if (currentGameState === 'gameMenu' || 
        currentGameState === 'showingInstructions' || 
        currentGameState === 'showingHighscores' || 
        currentGameState === 'enteringHighscoreName') {
        
        const menuBg = ASSETS.loadedImages.menuBackground;
        if (menuBg) {
            ctx.drawImage(menuBg, 0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        } else {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        }

        // Zeichne den spezifischen Menü-Inhalt
        switch (currentGameState) {
            case 'gameMenu':
                drawGameMenu(ctx, menuItems, currentMenuItemIndex);
                break;
            case 'showingInstructions':
                drawGameInstructions(ctx);
                break;
            case 'showingHighscores':
            if (CONFIG.highscore.storageMode === 'local') {
                drawLocalHighscores(ctx, highscoreData);
            } else {
                drawOnlineHighscores(ctx, highscoreData, highscoreCurrentPage);
            }
            break;
            case 'enteringHighscoreName':
               // drawNameInputScreen(ctx, highscorePlayerName, score, distanceTraveled, finalScoreForDisplay);
                drawNameInputScreen(ctx, highscorePlayerName, finalScoreForDisplay);
            break;
        }

    } else {
        // Alle anderen Zustände (Spiel, Game Over etc.) nutzen den scrollenden Hintergrund
        drawBackground(ctx, backgroundX);

        switch (currentGameState) {
            case 'infoOverlayScreen':
            drawInfoOverlayElements(ctx, CONFIG.currentLevelIndex + 1);
            break;

            case 'collisionDelay': 

            case 'playing':
                if (player) {
                    drawPlayer(ctx, player);
                }
                drawObstacles(ctx, obstacles);
                drawCollectibles(ctx, collectibles);
                if (finishLine.isActive) {
                    drawFinishLine(ctx, finishLine);
                }
                drawScore(ctx, score, playerLives, distanceTraveled);
                break;

            case 'deathSequence':
                deathSequenceManager.draw(ctx, playerLives, LEVELS[CONFIG.currentLevelIndex].name);
                break;

                case 'gameOverSummary': 
                drawGameOverSummaryScreen(ctx, score, distanceTraveled, finalScoreForDisplay, isNewHighscore);
                break;

            case 'enteringHighscoreName': 
                drawNameInputScreen(ctx, highscorePlayerName, finalScoreForDisplay);
                break;

            case 'finalGameOverScreen':
                drawGameOverScreen(ctx, score, distanceTraveled, finalScoreForDisplay, gameOverDetailState);
            break;
        }
    }

    // 3. Pause-Overlay wird ganz am Ende über alles gezeichnet (falls aktiv)
    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "48px Kalam";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Pause", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);
        ctx.textAlign = "left";
    }
}

function gameLoop(timestamp) {
    if (!animationFrameId) return;

    const input = getPlayerMovementIntent();

    // Die Abfragen für Pause (P) und Neustart (N) werden jetzt immer geprüft,
    // solange das Spiel im "playing"-Zustand ist (auch wenn es pausiert ist).
    if (currentGameState === 'playing') {
        if (input.isPJustPressed) {
            togglePause();
        }
        if (input.isNJustPressed) {
            switchToStartScreen();
        }
    }

    if (isPaused) {
        draw(); 
        lastTime = timestamp;
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    // Wenn nicht pausiert (normale Ausführung):
    if (lastTime === 0) { 
        lastTime = timestamp;
    }
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime, input);
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}

export function cleanup() {
    if (obstacles && obstacles.length > 0) {
        obstacles.forEach(car => {
            if (car.audio) car.audio.stop();
        });
    }
    cleanupGameInput(); // Deine bestehende Zeile zum Aufräumen der Inputs

    // Stelle sicher, dass audioSystemReady hier bekannt ist (globale Variable im Modul)
    // oder prüfe, ob audioManager und seine Funktionen existieren.
    if (typeof audioSystemReady !== 'undefined' && audioSystemReady) { 
        audioManager.stopMusic(); // << MUSIK HIER STOPPEN!
    } else if (typeof audioManager !== 'undefined' && audioManager && typeof audioManager.stopMusic === 'function') {
        // Fallback, falls audioSystemReady nicht global gesetzt wurde, aber der Manager existiert
        audioManager.stopMusic();
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("Flinke Fritzi: Game loop via animationFrameId gestoppt und Spiel aufgeräumt.");
    } else {
        console.log("Flinke Fritzi: Cleanup gerufen, aber keine aktive Animation Frame ID zum Stoppen gefunden.");
    }
}

export function togglePause() {
    isPaused = !isPaused; // Zustand umschalten

    // 1. Hintergrundmusik pausieren/fortsetzen (das war schon da)
    if (audioSystemReady) {
        audioManager.handleGamePauseState(isPaused); 
    }
    
    // 2. NEU: Alle Auto-Sounds bei Pause stummschalten
    for (const car of obstacles) {
        if (car.audio) {
            if (isPaused) {
                car.audio.setGain(0); // Setze Lautstärke auf 0
            } else {
                // Beim Fortsetzen müssen wir nichts tun. Der 'updateObstacles'-Loop
                // berechnet in der nächsten Sekunde automatisch wieder die korrekte Lautstärke.
            }
        }
    }
    
    if (isPaused) {
        console.log("Flinke Fritzi: Spiel pausiert.");
    } else {
        console.log("Flinke Fritzi: Spiel fortgesetzt.");
    }
}