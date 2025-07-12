// In game2/audioManager.js

let audioContext = null;
let masterGainNode = null; // Für eine mögliche Gesamtlautstärke später
let isInitialized = false;

const loadedSounds = {}; // Speichert die dekodierten AudioBuffer: { soundName: AudioBuffer, ... }

// Für Hintergrundmusik
let musicSourceNode = null;
let musicGainNode = null;
let currentMusicVolumeSetting = 0.5; // Vom Nutzer gewünschte Lautstärke (0.0 - 1.0)
let isMusicMutedByUser = false;    // Ob der Nutzer die Musik stummgeschaltet hat
let isMusicPlaying = false;
let isMusicPausedByGame = false;   // Ob die Musik wegen der Spielpause angehalten wurde
let musicPauseOffset = 0;        // Wo die Musik angehalten wurde (in Sekunden)
let musicContextStartTime = 0;   // Wann das aktuelle Musiksegment gestartet wurde (audioContext.currentTime)
let currentPlayingMusicPath = null; // Pfad der aktuellen Musik für's Fortsetzen
let currentMusicShouldLoop = true; // Ob die aktuelle Musik loopen soll

async function init() {
    if (isInitialized) return true;
    if (audioContext) return true; // Falls schon von woanders initialisiert (unwahrscheinlich in diesem Setup)

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Versuche, den Kontext zu aktivieren. Dies sollte klappen, wenn der Nutzer
        // bereits mit der Seite interagiert hat (z.B. Spielauswahl im Hauptmenü).
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        if (audioContext.state === 'running') {
            masterGainNode = audioContext.createGain();
            masterGainNode.connect(audioContext.destination);
            
            musicGainNode = audioContext.createGain();
            musicGainNode.connect(masterGainNode); // Musik-Lautstärke geht über Master-Lautstärke

            console.log("AudioManager: AudioContext läuft und ist bereit.");
            isInitialized = true;
            return true;
        } else {
            console.warn("AudioManager: AudioContext konnte nicht gestartet werden. Status:", audioContext.state);
            return false;
        }
    } catch (e) {
        console.error("AudioManager: Fehler bei der Initialisierung des AudioContext:", e);
        return false;
    }
}

async function loadSound(soundName, filePath) {
    if (!isInitialized) {
        console.warn("AudioManager: Nicht initialisiert. Bitte zuerst init() aufrufen.");
        // Versuche eine späte Initialisierung, falls vergessen
        if (!await init()) return null; 
    }
    if (loadedSounds[soundName]) {
        // console.log(`AudioManager: Sound '${soundName}' ist bereits geladen.`);
        return loadedSounds[soundName];
    }

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status} für ${filePath}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        loadedSounds[soundName] = audioBuffer;
        console.log(`AudioManager: Sound '${soundName}' von ${filePath} geladen.`);
        return audioBuffer;
    } catch (e) {
        console.error(`AudioManager: Fehler beim Laden/Dekodieren von Sound '${soundName}' (${filePath}):`, e);
        return null;
    }
}

async function _startInternalMusicPlayback(soundNameToPlay, loop, offset = 0) {
    if (!isInitialized || !loadedSounds[soundNameToPlay] || !musicGainNode) {
        console.warn("AudioManager: Kann Musik nicht starten. Nicht initialisiert, Sound nicht geladen oder GainNode fehlt.");
        return;
    }

    if (audioContext.state === 'suspended') {
        try {
            console.log(`AudioManager: AudioContext für '${soundNameToPlay}' ist 'suspended', versuche resume()...`);
            await audioContext.resume(); // Wichtig: await hier!
            console.log(`AudioManager: AudioContext für '${soundNameToPlay}' resumed. Neuer Status: ${audioContext.state}`);
        } catch (e) {
            console.error(`AudioManager: Fehler beim audioContext.resume() für '${soundNameToPlay}':`, e);
            return; // Nicht weitermachen, wenn resume fehlschlägt
        }
    }

    if (musicSourceNode) { // Stoppe ggf. bereits laufende Musik
        musicSourceNode.stop(0);
        musicSourceNode.disconnect();
    }

    musicSourceNode = audioContext.createBufferSource();
    musicSourceNode.buffer = loadedSounds[soundNameToPlay];
    musicSourceNode.loop = loop;
    currentMusicShouldLoop = loop; // Für den Fall des Fortsetzens nach Pause

    musicSourceNode.connect(musicGainNode);
    // musicGainNode ist bereits mit masterGainNode verbunden

    // Lautstärke anwenden (berücksichtigt Mute-Status)
    if (isMusicMutedByUser) {
        musicGainNode.gain.value = 0;
    } else {
        musicGainNode.gain.value = currentMusicVolumeSetting;
    }
    
    const aCtx = audioContext; // Für Zugriff im onended Handler
    musicPauseOffset = offset % musicSourceNode.buffer.duration; // Stelle sicher, dass Offset im Rahmen ist
    musicSourceNode.start(0, musicPauseOffset);
    
    musicContextStartTime = aCtx.currentTime - musicPauseOffset; // Virtueller Startzeitpunkt
    isMusicPlaying = true;
    isMusicPausedByGame = false;
    currentPlayingMusicPath = soundNameToPlay; // Merken, welcher Song spielt
    console.log(`AudioManager: Musik '${soundNameToPlay}' gestartet bei Offset ${musicPauseOffset.toFixed(2)}s.`);

    musicSourceNode.onended = () => {
        // Wird aufgerufen, wenn der Sound stoppt (durch .stop() oder weil er zu Ende ist und nicht loopt)
        // Wir setzen isMusicPlaying nur auf false, wenn es nicht durch eine Pause ausgelöst wurde,
        // die den Source Node explizit stoppt, um ihn später neu zu erstellen.
        // Für einen sauberen Stopp ist es besser, isMusicPlaying in stopMusic() und handleGamePauseState() zu managen.
        // console.log(`AudioManager: Musik '${soundNameToPlay}' beendet.`);
    };
}

async function playMusic(soundName, loop = true, volume = 0.5) {
    if (!loadedSounds[soundName]) {
        console.warn(`AudioManager: Musik-Sound '${soundName}' nicht gefunden. Bitte zuerst laden.`);
        return;
    }
    currentMusicVolumeSetting = Math.max(0, Math.min(1, volume));
    await _startInternalMusicPlayback(soundName, loop, 0); // HIER await hinzufügen
}

function stopMusic() {
    if (musicSourceNode) {
        musicSourceNode.stop(0);
        musicSourceNode.disconnect(); // Nicht unbedingt nötig, da SourceNode verworfen wird
        musicSourceNode = null;
        console.log("AudioManager: Musik gestoppt.");
    }
    isMusicPlaying = false;
    isMusicPausedByGame = false;
    musicPauseOffset = 0;
    currentPlayingMusicPath = null;
}

function setMusicVolume(volume) { 
    currentMusicVolumeSetting = Math.max(0, Math.min(1, volume));
    if (musicGainNode && !isMusicMutedByUser && isMusicPlaying) {
        musicGainNode.gain.setTargetAtTime(currentMusicVolumeSetting, audioContext.currentTime, 0.01);
    }
    console.log(`AudioManager: Musik-Ziellautstärke auf ${currentMusicVolumeSetting} gesetzt.`);
}

function toggleMusicMute() {
    if (!isInitialized) return;
    isMusicMutedByUser = !isMusicMutedByUser;
    if (musicGainNode && isMusicPlaying) {
        if (isMusicMutedByUser) {
            musicGainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.01);
            console.log("AudioManager: Musik stummgeschaltet.");
        } else {
            musicGainNode.gain.setTargetAtTime(currentMusicVolumeSetting, audioContext.currentTime, 0.01);
            console.log("AudioManager: Stummschaltung aufgehoben.");
        }
    } else if (isMusicMutedByUser) {
         console.log("AudioManager: Musik ist jetzt als stummgeschaltet vorgemerkt.");
    } else {
         console.log("AudioManager: Musik ist jetzt als nicht stummgeschaltet vorgemerkt.");
    }
}

function isMusicMuted() {
    return isMusicMutedByUser;
}

function playSoundEffect(soundName, volume = 1.0) {
    if (!isInitialized || !loadedSounds[soundName] || !masterGainNode) {
        console.warn(`AudioManager: Kann Soundeffekt '${soundName}' nicht abspielen. Nicht initialisiert oder Sound nicht geladen.`);
        return;
    }
    if (audioContext.state === 'suspended') { // Nur zur Sicherheit
        audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = loadedSounds[soundName];

    const effectGainNode = audioContext.createGain();
    effectGainNode.gain.value = Math.max(0, Math.min(1, volume));

    source.connect(effectGainNode);
    effectGainNode.connect(masterGainNode); // Alle Effekte auch über den Master-Regler
    source.start(0);
    console.log(`AudioManager: Soundeffekt '${soundName}' abgespielt.`);

    // Aufräumen nach dem Abspielen
    source.onended = () => {
        source.disconnect();
        effectGainNode.disconnect();
    };
}

function createPositionalSound(soundName, loop = false) {
    if (!isInitialized || !loadedSounds[soundName]) {
        console.warn(`PositionalSound für '${soundName}' kann nicht erstellt werden.`);
        return null;
    }

    const source = audioContext.createBufferSource();
    source.buffer = loadedSounds[soundName];
    source.loop = loop;
    const gainNode = audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(masterGainNode);

    let isPlayingFlag = false; // Umbenannt, um Verwechslung zu vermeiden

    const soundObject = {
        play: () => {
            if (isPlayingFlag) return;
            source.start(0);
            isPlayingFlag = true;
        },
        stop: () => {
            if (!isPlayingFlag) return;
            source.stop(0);
            source.disconnect();
            gainNode.disconnect();
            isPlayingFlag = false;
        },
        setGain: (value) => {
            if (isPlayingFlag) gainNode.gain.setTargetAtTime(value, audioContext.currentTime, 0.01);
        },
        isPlaying: () => { // <-- NEUE METHODE
            return isPlayingFlag;
        }
    };

    return soundObject;
}

async function handleGamePauseState(isGamePaused) {
    if (!isInitialized || !isMusicPlaying || !musicSourceNode || !loadedSounds[currentPlayingMusicPath]) {
        // Nichts zu tun, wenn nicht initialisiert, keine Musik spielt, oder der Pfad fehlt
        return;
    }

    if (isGamePaused && !isMusicPausedByGame) {
        // Spiel wird pausiert, Musik lief und war nicht schon wegen Spielpause angehalten
        // Berechne, wie lange das aktuelle Segment schon lief, um den Offset zu bekommen
        const elapsedTimeInSegment = audioContext.currentTime - musicContextStartTime;
        musicPauseOffset = (musicPauseOffset + elapsedTimeInSegment) % musicSourceNode.buffer.duration;
        
        musicSourceNode.stop(0);
        // Source Node kann nicht wiederverwendet werden, muss beim Fortsetzen neu erstellt werden.
        // musicSourceNode.disconnect(); // Nicht unbedingt nötig
        isMusicPausedByGame = true;
        console.log(`AudioManager: Musik '${currentPlayingMusicPath}' wegen Spielpause angehalten bei Offset ${musicPauseOffset.toFixed(2)}s.`);
    } else if (!isGamePaused && isMusicPausedByGame) {
        // Spiel wird fortgesetzt, Musik war wegen Spielpause angehalten
        console.log(`AudioManager: Setze Musik '${currentPlayingMusicPath}' fort bei Offset ${musicPauseOffset.toFixed(2)}s.`);
        await _startInternalMusicPlayback(currentPlayingMusicPath, currentMusicShouldLoop, musicPauseOffset); // HIER await hinzufügen
        // isMusicPausedByGame wird in _startInternalMusicPlayback auf false gesetzt
    }
}

// Alles exportieren, was von außen gebraucht wird
const audioManager = {
    init,
    createPositionalSound,
    loadSound,
    playMusic,
    stopMusic,
    setMusicVolume,
    toggleMusicMute,
    isMusicMuted,
    playSoundEffect,
    handleGamePauseState,
    // Hilfsgetter für Debugging oder erweiterte Steuerung (optional)
    // getAudioContext: () => audioContext,
    // isAudioReady: () => isInitialized && audioContext && audioContext.state === 'running',


isMusicCurrentlyPausedByGame: function() {
        return isMusicPausedByGame; // isMusicPausedByGame ist eine interne Variable des Managers
    },
    // getCurrentPlayingMusicName hatten wir schon für den vorherigen Ansatz, ist hier auch nützlich
    getCurrentPlayingMusicName: function() { 
         if (isMusicPlaying && currentPlayingMusicPath) { // isMusicPlaying ist interne Variable
             return currentPlayingMusicPath;
         }
         return null;
     },
     isMusicCurrentlyPlaying: function() { 
         return isMusicPlaying; 
     },
     isInitialized: function() { // <<<< NEUE FUNKTION HINZUFÜGEN
        return isInitialized && audioContext && audioContext.state === 'running';
    }
};
export default audioManager;