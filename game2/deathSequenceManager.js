// In game2/deathSequenceManager.js

import audioManager from './audioManager.js';
import { getLaneIndexFromY } from './carAI.js';

// Globale Referenzen, die in init() gesetzt werden
let CONFIG = null;
let ASSETS = null;
let playerRef = null;
let originalAmbulanceY = 0; 

const DEATH_PHASE = {
    INACTIVE: 0,
    FRITZI_FALLEN: 1,
    AMBULANCE_ARRIVING: 2,
    ALIGNING_VERTICAL: 3,
    AMBULANCE_TURNING: 4,      // <-- NEUER ZUSTAND
    AMBULANCE_WAITING: 5,      // <-- Nummer erhöht
    FRITZI_COLLECTED: 6,       // <-- Nummer erhöht
    RETURNING_TO_LANE: 7,      // <-- Nummer erhöht
    AMBULANCE_DEPARTING: 8,      // <-- Nummer erhöht
    SHOW_RESTART_INFO: 9       // <-- Nummer erhöht
};
let currentPhase = DEATH_PHASE.INACTIVE;

// Objekt für den Krankenwagen
let ambulance = {
    x: 0, y: 0,
    width: 0, height: 0, // Wird aus Config geladen
    speed: 4,
    verticalSpeed: 2, // Geschwindigkeit für die vertikale Anpassung
    imageAnfahrt: null,
    imageAbfahrt: null,
    currentImage: null,
    isVisible: false
};

// Objekt für den gestürzten Spieler
let fritziLiegend = {
    image: null,
    x: 0, y: 0,
    width: 0, height: 0, // Wird aus Config geladen
    isVisible: false
};

let sequenceTimer = 0;
const AMBULANCE_WAIT_DURATION = 1000;

let ambulanceDirection = 1; // 1 = von links kommend, -1 = von rechts kommend
let ambulanceTargetX = 0;

let sequenceIsActive = false;
let sequenceIsFinished = false;

// --- Initialisierungsfunktion ---
function init(gameConfig, gameAssetsLoaded, mainPlayerRef) {
    CONFIG = gameConfig;
    ASSETS = gameAssetsLoaded;
    playerRef = mainPlayerRef;

    // Assets und Dimensionen laden
    fritziLiegend.image = ASSETS.player_sturz;
    fritziLiegend.width = CONFIG.fritziLiegendDimensions.width;
    fritziLiegend.height = CONFIG.fritziLiegendDimensions.height;

    ambulance.imageAnfahrt = ASSETS.krankenwagen_anfahrt;
    ambulance.imageAbfahrt = ASSETS.krankenwagen_abfahrt;
    ambulance.width = CONFIG.ambulanceDimensions.width;
    ambulance.height = CONFIG.ambulanceDimensions.height;
}

// --- Start der Sequenz ---
function start(playerCurrentX, playerCurrentY, laneDefs) {
    sequenceIsActive = true;
    sequenceIsFinished = false;
    currentPhase = DEATH_PHASE.FRITZI_FALLEN;

    fritziLiegend.x = playerCurrentX;
    fritziLiegend.y = playerCurrentY;
    fritziLiegend.isVisible = true;

    // --- ANKUNFT AUF SPUR ODER BEIM SPIELER (mit Absicherung) ---
    const playerLaneIndex = getLaneIndexFromY(playerCurrentY, playerRef.height, laneDefs);

    if (playerLaneIndex !== null) {
        // Fall 1: Spieler war in einer Spur, Krankenwagen fährt auf dieser Spur.
        const targetLane = laneDefs[playerLaneIndex];
        const laneCenterY = targetLane.topClear + (targetLane.bottomClear - targetLane.topClear) / 2;
        ambulance.y = laneCenterY - ambulance.height / 2;
    } else {
        // Fall 2 (Fallback): Spieler war außerhalb, Krankenwagen richtet sich direkt nach ihm aus.
        ambulance.y = playerCurrentY + playerRef.height - ambulance.height;
    }
     originalAmbulanceY = ambulance.y;

    // --- RICHTUNG UND ZIEL BESTIMMEN ---
    if (playerCurrentX < CONFIG.canvasWidth / 2) {
        ambulanceDirection = -1; // Kommt von rechts, bewegt sich nach links
        ambulance.x = CONFIG.canvasWidth;
        ambulanceTargetX = fritziLiegend.x + 50;
    } else {
        ambulanceDirection = 1; // Kommt von links, bewegt sich nach rechts
        ambulance.x = -ambulance.width;
        ambulanceTargetX = fritziLiegend.x - 150;
    }
    
    ambulance.currentImage = ambulance.imageAnfahrt;
    ambulance.isVisible = true;
}

// --- Update-Logik für die Sequenz ---
function update(input, dtFactor, deltaTime) {
    if (!sequenceIsActive || sequenceIsFinished) return false;

    switch (currentPhase) {
    case DEATH_PHASE.FRITZI_FALLEN:
        audioManager.playMusic(CONFIG.uiSounds.siren.soundName, false, CONFIG.uiSounds.siren.volume);
        currentPhase = DEATH_PHASE.AMBULANCE_ARRIVING;
        break;

    case DEATH_PHASE.AMBULANCE_ARRIVING:
        ambulance.x += ambulance.speed * ambulanceDirection * dtFactor;
        const arrived = (ambulanceDirection === 1) ? (ambulance.x >= ambulanceTargetX) : (ambulance.x <= ambulanceTargetX);
        if (arrived) {
            ambulance.x = ambulanceTargetX;
            currentPhase = DEATH_PHASE.ALIGNING_VERTICAL;
        }
        break;

    case DEATH_PHASE.ALIGNING_VERTICAL:
        const finalY = fritziLiegend.y + playerRef.height - ambulance.height;
        const yDifference = finalY - ambulance.y;
        if (Math.abs(yDifference) < ambulance.verticalSpeed) {
            ambulance.y = finalY;
            currentPhase = DEATH_PHASE.AMBULANCE_TURNING;
        } else {
            ambulance.y += Math.sign(yDifference) * ambulance.verticalSpeed * dtFactor;
        }
        break;

    case DEATH_PHASE.AMBULANCE_TURNING:
        ambulance.currentImage = ambulance.imageAbfahrt;
        currentPhase = DEATH_PHASE.AMBULANCE_WAITING;
        sequenceTimer = AMBULANCE_WAIT_DURATION;
        audioManager.stopMusic();
        break;

    case DEATH_PHASE.AMBULANCE_WAITING:
        sequenceTimer -= deltaTime;
        if (sequenceTimer <= 0) {
            currentPhase = DEATH_PHASE.FRITZI_COLLECTED;
        }
        break;

    case DEATH_PHASE.FRITZI_COLLECTED:
        fritziLiegend.isVisible = false;
        audioManager.playMusic(CONFIG.uiSounds.siren.soundName, false, CONFIG.uiSounds.siren.volume);
        currentPhase = DEATH_PHASE.RETURNING_TO_LANE;
        break;

    case DEATH_PHASE.RETURNING_TO_LANE:
        const yDiffToLane = originalAmbulanceY - ambulance.y;
        if (Math.abs(yDiffToLane) < ambulance.verticalSpeed) {
            ambulance.y = originalAmbulanceY;
            currentPhase = DEATH_PHASE.AMBULANCE_DEPARTING;
        } else {
            ambulance.y += Math.sign(yDiffToLane) * ambulance.verticalSpeed * dtFactor;
        }
        break;

    case DEATH_PHASE.AMBULANCE_DEPARTING:
        // Wir nutzen die alte, korrekte Formel für die Abfahrt.
        // Sie kehrt die Richtung automatisch um.
        ambulance.x -= ambulance.speed * ambulanceDirection * dtFactor;
        const departed = (ambulanceDirection === 1) ? (ambulance.x + ambulance.width < 0) : (ambulance.x > CONFIG.canvasWidth);
        if (departed) {
            audioManager.stopMusic();
            currentPhase = DEATH_PHASE.SHOW_RESTART_INFO;
        }
        break;

    case DEATH_PHASE.SHOW_RESTART_INFO:
        if (input.isEnterJustPressed) {
            audioManager.stopMusic();
            sequenceIsActive = false;
            sequenceIsFinished = true;
            return true;
        }
        break;
}
    return false;
}

// --- Zeichenfunktion für die Sequenz ---
function draw(ctx, playerLivesLeft, currentLevelName) {
    if (!sequenceIsActive) return;

    if (fritziLiegend.isVisible) {
        ctx.drawImage(fritziLiegend.image, fritziLiegend.x, fritziLiegend.y, fritziLiegend.width, fritziLiegend.height);
    }

    if (ambulance.isVisible) {
        ctx.save();
        if (ambulanceDirection === 1) { // Spiegelt das Bild, wenn es von links kommt
            ctx.scale(-1, 1);
            ctx.drawImage(ambulance.currentImage, -ambulance.x - ambulance.width, ambulance.y, ambulance.width, ambulance.height);
        } else {
            ctx.drawImage(ambulance.currentImage, ambulance.x, ambulance.y, ambulance.width, ambulance.height);
        }
        ctx.restore();
    }

    if (currentPhase === DEATH_PHASE.SHOW_RESTART_INFO) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "30px Kalam";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let yPos = CONFIG.canvasHeight / 2 - 60;
        ctx.fillText(`Verbleibende Leben: ${playerLivesLeft}`, CONFIG.canvasWidth / 2, yPos);
        yPos += 40;
        ctx.fillText(`${currentLevelName} Neustart`, CONFIG.canvasWidth / 2, yPos);
        yPos += 60;
        ctx.font = "28px Kalam";
        ctx.fillStyle = "#90EE90";
        ctx.fillText("ENTER zum Weiterspielen", CONFIG.canvasWidth / 2, yPos);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
    }
}

// Exportiere die öffentlichen Funktionen
const deathSequenceManager = {
    init,
    start,
    update,
    draw,
    isActive: () => sequenceIsActive
};

export default deathSequenceManager;