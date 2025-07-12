// game1/audiomanager.js

// priority: 1 = normal, 10 = sehr wichtig (stoppt andere Sounds)
const soundConfig = {
    'keyPickup': { src: './game1/sound/coin1.wav', volume: 0.7, priority: 1 },
    'enemyHit': { src: './game1/sound/klauen1.wav', volume: 0.5, priority: 2 },
    'obstacleHit': { src: './game1/sound/bumper1.wav', volume: 0.5, priority: 1 },
    'tick': { src: './game1/sound/tick1.wav', volume: 0.5, priority: 1 },
    'schluesselmoment': { src: './game1/sound/schluesselmoment1.wav', volume: 0.8, priority: 10 },
    'menuMove': { src: './game1/sound/auswahl.wav', volume: 0.7, priority: 2 },
    'menuSelect': { src: './game1/sound/menu_select.mp3', volume: 0.8, priority: 5 },
    'menuMusic': { src: './game1/sound/menu_background.mp3', volume: 0.3, loop: true, priority: 0 },
};

const audioNodes = {};
let isUnlocked = false;

export function initAudioManager() {
    for (const name in soundConfig) {
        const config = soundConfig[name];
        const audio = new Audio(config.src);
        audio.volume = config.volume || 1.0;
        audio.loop = config.loop || false;
        audioNodes[name] = audio;
    }
    console.log("Audio Manager: Alle Sounds initialisiert.");
}

function unlockAudio() {
    if (isUnlocked || Object.keys(audioNodes).length === 0) return;
    for (const name in audioNodes) {
        const node = audioNodes[name];
        node.play().catch(() => {});
        node.pause();
    }
    isUnlocked = true;
    console.log("Audio-Kontext durch Nutzerinteraktion entsperrt.");
}

export function playSound(name) {
    if (!isUnlocked) unlockAudio();

    const soundToPlay = audioNodes[name];
    if (!soundToPlay) {
        console.warn(`Sound "${name}" nicht gefunden.`);
        return;
    }

    const config = soundConfig[name];
    // Hier ist die Prioritäten-Logik!
    if (config.priority > 1) {
        for (const runningSoundName in audioNodes) {
            const runningNode = audioNodes[runningSoundName];
            const runningConfig = soundConfig[runningSoundName];
            if (!runningNode.paused && runningConfig.priority < config.priority) {
                // Stoppe alle laufenden Sounds mit niedrigerer Priorität
                stopSound(runningSoundName);
            }
        }
    }
    soundToPlay.currentTime = 0;
    soundToPlay.play().catch(e => console.error(`Fehler beim Abspielen von "${name}":`, e));
}

export function stopSound(name) {
    const soundToStop = audioNodes[name];
    if (soundToStop) {
        soundToStop.pause();
        soundToStop.currentTime = 0;
    }
}