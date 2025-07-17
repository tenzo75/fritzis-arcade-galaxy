// game1/levelData.js

// ====================================================================================
// Level Design Parameter - Erklärung
// ====================================================================================
// Jedes Objekt im 'gameLevels'-Array repräsentiert ein Level und kann folgende
// Eigenschaften haben, um sein Verhalten und seine Ziele zu definieren:
//
// - time:                      Zahl. Die Zeit für das Level in Sekunden.
//                              Beispiel: 30
//
// - keyTarget:                 Zahl. Die Anzahl der Schlüssel, die gesammelt werden müssen,
//                              um das Levelziel zu erreichen.
//                              Beispiel: 20
//
// - enemyCount:                Zahl. Die Anzahl der Gegner (Hamster) in diesem Level.
//                              Beispiel: 1
//
// - obstacleCount:             Zahl. Die Anzahl der Hindernisse (Vans) in diesem Level.
//                              Beispiel: 0 (keine), 6 (sechs Stück)
//
// - goalStringTemplate:        Text (String). Eine Vorlage für den Zieltext, der auf dem
//                              Level-Zusammenfassungsbildschirm (vor Levelstart oder nach
//                              Levelerfolg) angezeigt wird. Der Platzhalter ${keyTarget}
//                              wird automatisch durch den Wert von 'keyTarget' ersetzt.
//                              Beispiel: "Sammle ${keyTarget} Schlüssel!"
//
// - levelType:                 Text (String). Definiert die Art der Schlüssel und die Sammellogik.
//                              Mögliche Werte:
//                                - 'randomKeys': Zufällig platzierte Schlüssel, beliebige Sammelreihenfolge.
//                                - 'numberedKeys': Schlüssel mit Nummern, müssen in aufsteigender Reihenfolge
//                                                  (1, 2, 3, ...) gesammelt werden.
//                              Beispiel: 'randomKeys'
//
// - enemySpeedMultiplierLevel: Zahl. Beeinflusst die Geschwindigkeit der Gegner.
//                              Ein höherer Wert bedeutet schnellere Gegner.
//                              0 = Basisgeschwindigkeit (playerSpeed * enemyBaseSpeedMultiplier)
//                              1 = Basis + 1 * enemySpeedIncrease, usw.
//                              Beispiel: 0 (für Level 1), 1 (für Level 2)
//
// - hudGoalTemplateActive:     Text (String). Vorlage für den Zieltext, der *während* des
//                              Spiels im HUD (Heads-Up Display) angezeigt wird.
//                              Mögliche Platzhalter:
//                                - ${keyTarget}: Zielanzahl der Schlüssel.
//                                - ${collected}: Aktuell gesammelte Schlüssel (für 'randomKeys'-Level).
//                                - ${nextKeyNumber}: Nächste erwartete Schlüsselnummer (für 'numberedKeys'-Level).
//                              Beispiel 'randomKeys': "Schlüssel: ${collected}/${keyTarget}"
//                              Beispiel 'numberedKeys': "Nächster: ${nextKeyNumber}/${keyTarget}"
//
// - enemyDirectionChangeIntervalMs: Zahl. Das Zeitintervall in Millisekunden (ms),
//                                   nach dem ein Gegner proaktiv eine neue Richtung wählt
//                                   (um den Spieler zu verfolgen). Kürzere Intervalle
//                                   bedeuten häufigere "Überlegungen" und potenziell
//                                   aggressivere oder unberechenbarere Gegner.
//                                   Standard ist 3000 (3 Sekunden).
//                                   Beispiel: 3000 (Standard), 2000 (häufiger), 4000 (seltener)
// - playerSpeedLevel:          Zahl. Definiert die Bewegungsgeschwindigkeit des Spielers
//                              speziell für dieses Level. Ein höherer Wert bedeutet
//                              schnellere Spielerbewegung.
//                              Beispiel: 4 (Standard), 3 (langsamer), 5 (schneller)
// ====================================================================================
export const gameLevels = [
    // Level 1 (Index 0), Keine Hindernisse, Freie Schlüssel
    
    {
        time: 35,
        keyTarget: 20,
        enemyCount: 1,
        obstacleCount: 0,
        goalStringTemplate: "Sammle ${keyTarget} Schlüssel!",
        levelType: 'randomKeys',
        //levelType: 'numberedKeys',
        enemySpeedMultiplierLevel: 1,
        hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        //hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2000,
        playerSpeedLevel: 4
    },
    
    // Level 2 (Index 1), Hindernisse, Freie Schlüssel
    {
        time: 35,
        keyTarget: 20,
        enemyCount: 1,
        obstacleCount: 5,
        goalStringTemplate: "Sammle ${keyTarget} Schlüssel!",
        levelType: 'randomKeys',
        //levelType: 'numberedKeys',
        enemySpeedMultiplierLevel: 1,
        hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        //hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2000,
        playerSpeedLevel: 4
    },

    // Level 3 (Index 2), Keine Hindernisse, Nummer Schlüssel
    {
        time: 35,
        keyTarget: 10,
        enemyCount: 1,
        obstacleCount: 0,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys',
        enemySpeedMultiplierLevel: 1,
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2000,
        playerSpeedLevel: 4
    },

    // Level 4 (Index 3), Hindernisse, Nummer Schlüssel
    {
        time: 35,
        keyTarget: 10,
        enemyCount: 1,
        obstacleCount: 5,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys', 
        enemySpeedMultiplierLevel: 1, 
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2000,
        playerSpeedLevel: 4
    },
    
    // Level 5 (Index 4), Keine Hindernisse, Freie Schlüssel
    {
        time: 35,
        keyTarget: 25,
        enemyCount: 2,
        obstacleCount: 0,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        levelType: 'randomKeys',
        //levelType: 'numberedKeys',
        enemySpeedMultiplierLevel: 2,
        hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        //hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2500,
        playerSpeedLevel: 4
    },

    // Level 6 (Index 5), Hindernisse, Freie Schlüssel
    {
        time: 35,
        keyTarget: 25,
        enemyCount: 2,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        levelType: 'randomKeys',
        //levelType: 'numberedKeys',
        enemySpeedMultiplierLevel: 2,
        hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        //hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2500,
        playerSpeedLevel: 4
    },
    
    // Level 7 (Index 6), Keine Hindernisse, Nummer Schlüssel
    {
        time: 30,
        keyTarget: 12,
        enemyCount: 2,
        obstacleCount: 0,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys',  
        enemySpeedMultiplierLevel: 2,
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2500,
        playerSpeedLevel: 4
    },

    // Level 8 (Index 7), Hindernisse, Nummer Schlüssel
    {
        time: 30,
        keyTarget: 12,
        enemyCount: 2,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys',  
        enemySpeedMultiplierLevel: 2,
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 2500,
        playerSpeedLevel: 4
    },

    // Level 9 (Index 8), Keine Hindernisse, Freie Schlüssel
    {
        time: 35,
        keyTarget: 25,
        enemyCount: 2,
        obstacleCount: 0,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        levelType: 'randomKeys',
        //levelType: 'numberedKeys',
        enemySpeedMultiplierLevel: 3,
        hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        //hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 3000,
        playerSpeedLevel: 4
    },

    // Level 10 (Index 9), Hindernisse, Freie Schlüssel
    {
        time: 35,
        keyTarget: 25,
        enemyCount: 2,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        levelType: 'randomKeys',
        //levelType: 'numberedKeys',  
        enemySpeedMultiplierLevel: 3,
        hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        //hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 3000,
        playerSpeedLevel: 4
    },
    
    // Level 11 (Index 10), Keine Hindernisse, Nummer Schlüssel
    {
        time: 40,
        keyTarget: 15,
        enemyCount: 2,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys',
        enemySpeedMultiplierLevel: 3,
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 3000,
        playerSpeedLevel: 4
    },

    // Level 12 (Index 11), Hindernisse, Nummer Schlüssel
    {
        time: 40,
        keyTarget: 15,
        enemyCount: 2,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys',  
        enemySpeedMultiplierLevel: 3,
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 3000,
        playerSpeedLevel: 4
    },

    // Level 13 (Index 12), Hindernisse, Freie Schlüssel
    {
        time: 40,
        keyTarget: 30,
        enemyCount: 3,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        levelType: 'randomKeys',
        //levelType: 'numberedKeys',  
        enemySpeedMultiplierLevel: 3,
        hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        //hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 3500,
        playerSpeedLevel: 4
    },

    // Level 14 (Index 13), Hindernisse, Nummer Schlüssel
    {
        time: 45,
        keyTarget: 20,
        enemyCount: 2,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys',  
        enemySpeedMultiplierLevel: 3,
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 3500,
        playerSpeedLevel: 4
    },
    
    // Level 15 (Index 14), Hindernisse, Nummer Schlüssel
    {
        time: 60,
        keyTarget: 25,
        enemyCount: 3,
        obstacleCount: 6,
        goalStringTemplate: "Sammle Schlüssel 1-${keyTarget}!",
        //levelType: 'randomKeys',
        levelType: 'numberedKeys',  
        enemySpeedMultiplierLevel: 3,
        //hudGoalTemplateActive: "Schlüssel: ${collected}/${keyTarget}", //für randomkeys
        hudGoalTemplateActive: "Nächster: ${nextKeyNumber}/${keyTarget}", // für numberedKeys
        enemyDirectionChangeIntervalMs: 3500,
        playerSpeedLevel: 4
    },

    // Füge hier einfach neue Objekte für weitere Level hinzu:
    // { time: XX, keyTarget: XX, enemyCount: X, obstacleCount: X, goalStringTemplate: "..." }
];

// Exportiere auch die Gesamtanzahl der Level, damit andere Module sie leicht abfragen können
export const TOTAL_LEVELS = gameLevels.length;