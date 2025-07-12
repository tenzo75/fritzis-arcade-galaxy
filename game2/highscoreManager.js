// In game2/highscoreManager.js

import { CONFIG } from './config.js';

// Initialisiere den Supabase-Client.
const { supabaseUrl, supabaseAnonKey } = CONFIG.highscore;
let supabase = null;
if (supabaseUrl && supabaseUrl !== 'DEINE_SUPABASE_PROJEKT_URL') {
    // DIESE ZEILE IST JETZT KORRIGIERT: Der Verweis auf das Schema wurde entfernt.
    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase-Client erfolgreich initialisiert (sucht im 'public' Schema).");
}

const LOCAL_STORAGE_KEY = 'flinkeFritzi_highscores';


/**
 * Lädt die Top 50 Highscores, entweder lokal oder von Supabase.
 * @returns {Array} Ein Array mit den Highscore-Einträgen.
 */
export async function getHighscores() {
    // Prüfe den Modus aus der config.js
    if (CONFIG.highscore.storageMode === 'supabase' && supabase) {
        // --- Supabase-Modus ---
        try {
            const { data, error } = await supabase
                .from('flinkeFritzi_highscores') // Name deiner Tabelle
                .select('*')
                .order('finalScore', { ascending: false }) // Nach bestem Score sortieren
                .limit(50); // Nur die besten 50 abrufen

            if (error) {
                console.error("Fehler beim Laden der Highscores von Supabase:", error);
                return []; // Bei Fehler eine leere Liste zurückgeben
            }
            return data;
        } catch (e) {
            console.error("Ein Fehler ist aufgetreten:", e);
            return [];
        }
    } else {
        // --- Lokaler Modus ---
        try {
            const scoresJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
            return scoresJSON ? JSON.parse(scoresJSON) : [];
        } catch (e) {
            console.error("Fehler beim Laden der lokalen Highscores:", e);
            return [];
        }
    }
}

/**
 * Speichert einen neuen Highscore, entweder lokal oder in Supabase.
 */
export async function saveHighscore(name, finalScore, basePoints, distanceKm) {
    // Wichtig: Wir wandeln distanceKm explizit in einen String mit Punkt um,
    // da Datenbanken dies universell verstehen.
    const distanceAsString = String(distanceKm).replace(',', '.');

    const newScore = {
        name: name,
        finalScore: finalScore,
        basePoints: basePoints,
        distance: distanceAsString,
    };

    if (CONFIG.highscore.storageMode === 'supabase' && supabase) {
        // --- Supabase-Modus ---
        try {
            // NEU: Wir fügen .select() hinzu. 
            // Das zwingt Supabase, uns die gespeicherten Daten zurückzugeben.
            // Wenn das klappt, wissen wir, dass der Eintrag wirklich da ist.
            const { data, error } = await supabase
                .from('flinkeFritzi_highscores')
                .insert([newScore])
                .select(); // <-- Diese Zeile ist neu

            if (error) {
                console.error("Fehler beim Speichern des Highscores in Supabase:", error.message);
            } else {
                // Wenn data jetzt einen Wert hat, war es erfolgreich.
                if (data) {
                    console.log("Highscore erfolgreich in Supabase gespeichert:", data);
                } else {
                    console.error("Speichern fehlgeschlagen, Supabase hat keine Daten zurückgegeben.");
                }
            }
        } catch (e) {
            console.error("Ein Fehler ist aufgetreten:", e);
        }
    } else {
        // --- Lokaler Modus (bleibt unverändert) ---
        const scores = await getHighscores();
        scores.push(newScore);
        scores.sort((a, b) => b.finalScore - a.finalScore);
        const top10 = scores.slice(0, 10);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(top10));
            console.log("Neuer lokaler Highscore gespeichert.");
        } catch (e) {
            console.error("Fehler beim Speichern der lokalen Highscores:", e);
        }
    }
}

export async function isHighscore(score) {
    const scores = await getHighscores();
    
    // Bestimme die maximale Anzahl der Einträge basierend auf dem Modus
    const maxEntries = (CONFIG.highscore.storageMode === 'local') ? 10 : 50;

    // 1. Prüfe, ob die Liste noch nicht voll ist
    if (scores.length < maxEntries) {
        return true; // Jeder Score ist ein Highscore, wenn die Liste nicht voll ist
    }

    // 2. Wenn die Liste voll ist, vergleiche mit dem niedrigsten Score
    // Die Liste ist bereits absteigend sortiert, der letzte Eintrag ist der niedrigste.
    const lowestHighscore = scores[scores.length - 1].finalScore;
    return score > lowestHighscore;
}