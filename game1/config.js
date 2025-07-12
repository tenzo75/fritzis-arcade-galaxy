// game1/config.js

import { gameLevels, TOTAL_LEVELS } from './levelData.js';

// Zentrale Schriftart-Definition
export const FONT_FAMILY_MAIN = "GameFont"; 
export const FONT_FAMILY_TEXT = "Arial";  
export const FONT_FAMILY_MONO = "'Courier New', Courier, monospace"; 

// Level-Konstanten & Einstellungen
export const obstacleColor = '#888888';
export const obstacleImageWidth = 85;
export const obstacleImageHeight = 40;
// Mindestabstand zwischen Hindernismittelpunkten (quadriert, für Effizienz)
export const minObstacleDistSq = (obstacleImageWidth + 40) * (obstacleImageWidth + 40);

// Safe Zones für das Spawnen von Entitäten (Schlüssel, Hindernisse)
// Werte in Pixeln, bezogen auf die Canvas-Dimensionen (z.B. 1056x640)
export const SAFE_SPAWN_MARGIN_TOP = 20;    // Z.B. 60px vom oberen Rand freilassen für HUD
export const SAFE_SPAWN_MARGIN_BOTTOM = 18; // Z.B. 50px vom unteren Rand freilassen für Zielanzeige
export const SAFE_SPAWN_MARGIN_LEFT = 15;   // Z.B. 40px vom linken Rand freilassen (wegen Maskenkrümmung)
export const SAFE_SPAWN_MARGIN_RIGHT = 15;  // Z.B. 40px vom rechten Rand freilassen

// Spiel-Variablen & Konstanten (allgemein)
export const keySize = 40;
export const playerSpeed = 4;
export const keySpawnMargin = 50; // Mindestabstand neuer Schlüssel zu bestehenden
export const timeBonusMultiplier = 10; // Punkte pro Sekunde Restzeit
export const keyLimit = 5; // Maximale Anzahl zufälliger Schlüssel auf einmal (Level 1 & 2)

// Gegner Setup Konstanten
export const enemyWidth = 40;
export const enemyHeight = 40;
export const enemyBaseSpeedMultiplier = 0.5; // Basisgeschwindigkeit relativ zum Spieler
export const enemySpeedIncrease = 0.15; // Geschwindigkeitssteigerung pro "Speed-Level"
export const enemyDirectionChangeInterval = 3000; // Millisekunden
export const playerHitCooldown = 1000; // Millisekunden Unverwundbarkeit nach Treffer

// NEU: Highscore-System Einstellungen
export const HIGHSCORE_CONFIG = {
    // Trage hier deine Supabase-Daten ein. Du kannst dieselben wie
    // vom letzten Spiel verwenden, da sie für das ganze Projekt gelten.
    supabaseUrl: 'https://fmdttzfnowlfvyyyfwpl.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZHR0emZub3dsZnZ5eXlmd3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzM4ODUsImV4cCI6MjA2NzEwOTg4NX0.24bCcC0QgecEC30dWGJcbyQVkbSJ1HOQpcyg6zipfU8',
};

// === HILFSFUNKTION für Level-Parameter ===
export function getLevelParameters(levelNum) {
    const levelIndex = levelNum - 1;
    const globalDefaultPlayerSpeed = 4;

    if (levelIndex >= 0 && levelIndex < gameLevels.length) {
        const levelData = gameLevels[levelIndex];

        let goalStringSummary = "Ziel nicht definiert";
        if (levelData.goalStringTemplate && typeof levelData.goalStringTemplate.replace === 'function') {
            goalStringSummary = levelData.goalStringTemplate.replace('${keyTarget}', levelData.keyTarget);
        } else {
            console.warn(`getLevelParameters: goalStringTemplate für Level ${levelNum} fehlt oder ist ungültig.`);
        }

        return {
            time: levelData.time !== undefined ? levelData.time : 30,
            keyTarget: levelData.keyTarget !== undefined ? levelData.keyTarget : 5,
            enemyCount: levelData.enemyCount !== undefined ? levelData.enemyCount : 0,
            obstacleCount: levelData.obstacleCount !== undefined ? levelData.obstacleCount : 0,
            goalStringTemplate: levelData.goalStringTemplate !== undefined ? levelData.goalStringTemplate : "Vorlage fehlt",
            levelType: levelData.levelType !== undefined ? levelData.levelType : 'randomKeys',
            enemySpeedMultiplierLevel: levelData.enemySpeedMultiplierLevel !== undefined ? levelData.enemySpeedMultiplierLevel : 0,
            hudGoalTemplateActive: levelData.hudGoalTemplateActive !== undefined ? levelData.hudGoalTemplateActive : "Sammle: ${collected}/${keyTarget}",            
            enemyDirectionChangeIntervalMs: levelData.enemyDirectionChangeIntervalMs !== undefined ? levelData.enemyDirectionChangeIntervalMs : 3000,
            playerSpeedLevel: levelData.playerSpeedLevel !== undefined ? levelData.playerSpeedLevel : globalDefaultPlayerSpeed,
            stages: levelData.stages,
            goalString: goalStringSummary,
            levelNumber: levelNum
        };

    } else {
        console.error(`getLevelParameters: Ungültige LevelNummer angefordert: ${levelNum}. Verfügbare Level: 1-${TOTAL_LEVELS}`);
        return {
            time: 30,
            keyTarget: 5,
            enemyCount: 1,
            obstacleCount: 0,
            goalStringTemplate: "Fehler: Leveldaten nicht gefunden!",
            levelType: 'randomKeys',
            enemySpeedMultiplierLevel: 0,
            hudGoalTemplateActive: "Fehler!",
            enemyDirectionChangeIntervalMs: 3000,
            goalString: "Fehler: Leveldaten nicht gefunden!",
            levelNumber: levelNum,
            playerSpeedLevel: globalDefaultPlayerSpeed,
            error: true
        };
    }
    
}

export { TOTAL_LEVELS };