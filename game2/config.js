// game2/config.js
export const CONFIG = {

    //DEBUG VARIABLE
    debugDrawHitboxes: false, // Setzen Sie dies auf 'false', um die Rahmen auszublenden
    debugLaneSetup: false,

    distanceToMetersFactor: 0.1, // NEU: Grober Startwert

    // --- Allgemeine Canvas-Einstellungen ---
    canvasWidth: 1056,
    canvasHeight: 640,

    // Definitionen für die Platzierung von Autos auf der Straße ---
    roadTopMargin: 35,       
    laneClearHeights: [93, 87, 87, 87, 87, 93], 
    roadLineThickness: 7,   
    numberOfLanes: 6,        
    laneVariationBuffer: 5,

    // Spielzustandsvariablen 
    currentLevelIndex: 0,   
    spawnTimer: 0,
    playerStartLives: 3,

    // Dimensionen für die Todesssequenz-Grafiken ---
    fritziLiegendDimensions: { width: 75, height: 55 }, // Beispielwerte, passe sie an deine Grafik an!
    ambulanceDimensions: { width: 178, height: 100 }, // Beispielwerte, passe sie an deine Grafik an!
    
    // Highscore-System Einstellungen ---
    highscore: {
        // Schalte hier zwischen 'local' und 'supabase' um. 'local' speichert im Browser, 'supabase' online.
        storageMode: 'local', // Standardmäßig auf lokal für die Entwicklung
        // Trage hier deine Supabase-Daten ein, sobald du sie hast. Diese werden nur verwendet, wenn storageMode auf 'supabase' steht.
        supabaseUrl: 'https://fmdttzfnowlfvyyyfwpl.supabase.co', // Beispiel: https://xyz.supabase.co
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZHR0emZub3dsZnZ5eXlmd3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzM4ODUsImV4cCI6MjA2NzEwOTg4NX0.24bCcC0QgecEC30dWGJcbyQVkbSJ1HOQpcyg6zipfU8', // Ein langer Code-String
    },

    // --- Spieler ("Fritzi auf dem Fahrrad") ---
    player: {
        width: 75,               // Deine angepasste Breite für Fritzi
        height: 55,              // Deine angepasste Höhe für Fritzi
        verticalSpeed: 5,        // Geschwindigkeit für direkte Hoch/Runter-Bewegung (Pixel pro Frame/Update)
        horizontalSpeed: 4,      // Geschwindigkeit für aktive Links/Rechts-Bewegung durch Spieler
        horizontalDriftSpeed: 0.8, // Geschwindigkeit, mit der Fritzi nach links driftet, wenn keine L/R-Taste gedrückt wird  
        minX: 10,                // Minimaler X-Abstand zum linken Bildschirmrand
        maxX: 1056 - 80,         // Maximaler X-Abstand  Dieser Wert (1056/2 - 80 = 448) ist die linke Kante von Fritzi. Du kannst ihn auch als festen Pixelwert setzen, z.B. 400
        hitboxPadding: 7,        // Verkleinert die Trefferzone für fairere Kollisionen
    },

    // Eigener Bereich für UI-Sounds
    uiSounds: {
        menuSelect: { soundName: 'menu_select', volume: 0.5 },
        collision:  { soundName: 'kollisions_sound', volume: 0.4 }, 
        siren:      { soundName: 'krankenwagen_sirene', volume: 0.6 },
        honk:       { soundName: 'honk_sound', volume: 0.7 }
    },

    // Eigener Bereich für die Musik-Lautstärke
    music: {
        menu:  { soundName: 'musik_start', volume: 0.3 },
        ingame: { soundName: 'musik_spiel', volume: 0.3 }
    },

    // --- Sammelobjekt-Einstellungen ---
    collectibleTypes: { 
    'key':     { imageAssetKey: 'key',   points: 1,  size: { width: 45, height: 45 }, soundName: 'collect_key',   volume: 0.4 },
    'money':   { imageAssetKey: 'money', points: 2,  size: { width: 45, height: 45 }, soundName: 'collect_money', volume: 0.4 },
    'trash':   { imageAssetKey: 'trash', points: -2, size: { width: 50, height: 50 }, soundName: 'collect_trash', volume: 0.4 },
    'hamster': { imageAssetKey: 'hamster', points: 10, size: { width: 40, height: 40 }, soundName: 'collect_hamster', volume: 0.2 }
     },

    // --- Straßengeschwindigkeit
    road: {
    baseScrollSpeed: 3.5,     // Grundgeschwindigkeit der Straße, wenn du nichts tust.
    minScrollSpeed: 2,      // Minimale Geschwindigkeit, die du durch Bremsen erreichst.
    maxScrollSpeed: 6,      // Maximale Geschwindigkeit, die du durch Beschleunigen erreichst.
    speedAdjustRate: 0.05,   // Wie schnell die Geschwindigkeit beim Drücken/Loslassen der Tasten angepasst wird.
    idleDecelerationRate: 0.01, // Wie schnell die Straße abbremst, wenn man nichts tut
},

    // --- KI-Einstellungen für Autos ---
    ai: {
        safeDistanceAhead: 120,      // Mindestabstand, bevor KI reagiert
        laneChangeSafetyGapFront: 200, // Sicherheitsabstand nach vorne bei Spurwechsel
        laneChangeSafetyGapBack: 250,  // Sicherheitsabstand nach hinten bei Spurwechsel
        laneChangeSpeed: 2.5,        // Wie schnell die KI die Spur wechselt (Pixel pro Frame/Update)
    },

    carSound: {
    // Ersetze maxHearingDistance mit diesen beiden Werten
    hearingDistanceX: 800,  // Reichweite nach links und rechts
    hearingDistanceY: 400   // Reichweite nach oben und unten
},

    // --- Hindernis (Auto)-Einstellungen ---
    obstacleTypes: {
        'asbo': { 
            imageAssetKey: 'asbo', // Name des Bild-Assets
            scale: 0.7,
            speedRelMin: 1.3,
            speedRelMax: 2.8,
            passingSoundName: '', // Logischer Name des Sounds für diesen Typ
            baseVolume: 0.0,
            hitbox: { paddingX: 6, paddingY: 14 } // x = breite y= Höhe, kleinerer wert, größere bereich
        },
        'tornado': { 
            imageAssetKey: 'tornado',
            scale: 0.8,
            speedRelMin: 1.5,
            speedRelMax: 2.4,
            passingSoundName: '', 
            baseVolume: 0.0,
            hitbox: { paddingX: 5, paddingY: 5 } 
        },
        'issi': { 
            imageAssetKey: 'issi',
            scale: 0.7,
            speedRelMin: 1.6,
            speedRelMax: 3,
            passingSoundName: '', 
            baseVolume: 0.0,
            hitbox: { paddingX: 5, paddingY: 5 } 
        },
        'fast_car1': { 
            imageAssetKey: 'fast_car1',
            scale: 0.65,
            speedRelMin: 3, 
            speedRelMax: 5.5,
            passingSoundName: '', 
            baseVolume: 0.0,
            hitbox: { paddingX: 4, paddingY: 4 } 
        },
        'fast_car2': { 
            imageAssetKey: 'fast_car2',
            scale: 0.7,
            speedRelMin: 3,
            speedRelMax: 5.6,
            passingSoundName: '', 
            baseVolume: 0.0,
            hitbox: { paddingX: 5, paddingY: 22 } 
        },
        'fast_car3': { 
            imageAssetKey: 'fast_car3',
            scale: 0.7,
            speedRelMin: 2.5, 
            speedRelMax: 4.5,
            passingSoundName: '', 
            baseVolume: 0.0,
            hitbox: { paddingX: 7, paddingY: 22 } 
        },
        'taxi': {
            imageAssetKey: 'taxi', 
            scale: 0.7,  
            speedRelMin: 2,
            speedRelMax: 3.5,
            passingSoundName: '', 
            baseVolume: 0.0,
            hitbox: { paddingX: 8, paddingY: 6 } 
        },
        'van': {
            imageAssetKey: 'van', 
            scale: 0.7,  
            speedRelMin: 0.9,
            speedRelMax: 1.6,
            passingSoundName: '', 
            baseVolume: 0.0,
            hitbox: { paddingX: 12, paddingY: 10 } 
        },
        'raser': {
            imageAssetKey: 'raser',
            scale: 0.7,  
            speedRelMin: 6.0,
            speedRelMax: 9.5,
            passingSoundName: ['raser_sound_1', 'raser_sound_2'], 
            baseVolume: 0.4,
            hitbox: { paddingX: 4, paddingY: 3 } 
        }
        // Füge hier weitere Autotypen hinzu, falls du mehr hast oder planst
    },
    
};