// game1/highscore.js 

import { HIGHSCORE_CONFIG } from './config.js';

let currentStorageMode = 'local';
let supabase = null;

const MAX_SCORES_ONLINE = 50;
const MAX_SCORES_LOCAL = 10;

export function initHighscoreSystem(options) {
    currentStorageMode = options.storageMode || 'local';
    console.log(`Highscore-System für "Schlüsselmomente" initialisiert. Modus: ${currentStorageMode}`);

    if (currentStorageMode === 'supabase' && window.supabase) {
        if (!supabase) {
            supabase = window.supabase.createClient(HIGHSCORE_CONFIG.supabaseUrl, HIGHSCORE_CONFIG.supabaseAnonKey);
            console.log("Supabase-Client für Schlüsselmomente erfolgreich initialisiert.");
        }
    } else if (currentStorageMode === 'supabase' && !window.supabase) {
        console.error("Supabase-Bibliothek wurde nicht gefunden.");
    }
}

export async function getHighScores() {
    const limit = currentStorageMode === 'supabase' ? MAX_SCORES_ONLINE : MAX_SCORES_LOCAL;

    if (currentStorageMode === 'supabase' && supabase) {
        try {
            const { data, error } = await supabase
                .from('schluesselmomente_highscores')
                .select('*')
                .order('score', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error("Fehler beim Laden der Supabase-Highscores:", e);
            return [];
        }
    } else {
        try {
            const scoresJSON = localStorage.getItem('schluesselmomenteHighscores');
            const allScores = scoresJSON ? JSON.parse(scoresJSON) : [];
            return allScores.slice(0, limit);
        } catch (e) {
            console.error("Fehler beim Laden der lokalen Highscores:", e);
            return [];
        }
    }
}

export async function saveScoreEntry(playerName, scoreValue, levelValue) {
    const newEntry = {
        name: playerName.trim().substring(0, 15) || "FRITZI",
        score: scoreValue,
        level: levelValue
    };

    if (currentStorageMode === 'supabase' && supabase) {
        try {
            await supabase.from('schluesselmomente_highscores').insert([newEntry]);
            console.log("Highscore erfolgreich in Supabase gespeichert.");
        } catch (e) {
            console.error("Fehler beim Speichern in Supabase:", e);
        }
    } else {
        // Lokale Speicherung berücksichtigt jetzt das Top-10-Limit
        const localScoresJSON = localStorage.getItem('schluesselmomenteHighscores');
        const highScores = localScoresJSON ? JSON.parse(localScoresJSON) : [];
        highScores.push(newEntry);
        highScores.sort((a, b) => b.score - a.score);
        const topScores = highScores.slice(0, MAX_SCORES_LOCAL);
        localStorage.setItem('schluesselmomenteHighscores', JSON.stringify(topScores));
        console.log("Lokaler Highscore gespeichert (Top 10).");
    }
}

export async function isNewHighScore(newScoreValue) {
    if (!newScoreValue || newScoreValue <= 0) return false;

    const highScores = await getHighScores();
    const limit = currentStorageMode === 'supabase' ? MAX_SCORES_ONLINE : MAX_SCORES_LOCAL;

    if (highScores.length < limit) {
        return true; 
    }
    // Prüft, ob der neue Score besser ist als der letzte in der Liste
    return newScoreValue > highScores[highScores.length - 1].score;
}