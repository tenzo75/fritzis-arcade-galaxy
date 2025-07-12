// In Hauptverzeichnis/launcherSound.js

const sounds = {};
let activeFades = {};
let isUnlocked = false;

// ===================================================================================
// NEUE KONFIGURATION: Wir speichern jetzt mehr Infos pro Sound
// ===================================================================================
const soundFiles = {
  // Hier können Sie für jeden Sound die Quelle (src), die Standardlautstärke (volume)
  // und ob er loopen soll (loop) festlegen.

  // Boot-Sequenz Sounds
  boot_sound: { src: "./sound/boot.ogg", volume: 0.3, loop: false },

  // NEU: Explosions-Sound hinzufügen
    explosion: { src: "./sound/explode.wav", volume: 0.3, loop: false },

  // Intro Sound
  intro: { src: "./sound/intro_music.ogg", volume: 0.3, loop: true }, // Beispiel-Lautstärke: 50%

  // Menü Sounds
  select: { src: "./sound/auswahl.wav", volume: 0.8, loop: false },
  // Abspann Musik
  credits_music: { src: "./sound/abspann.ogg", volume: 0.2, loop: false },
};

/**
 * Lädt alle Sounds vor und konfiguriert sie.
 */
export function initLauncherSounds() {
  console.log("Lade Launcher-Sounds...");
  for (const key in soundFiles) {
    const config = soundFiles[key];
    sounds[key] = new Audio(config.src);
    sounds[key].preload = "auto";
    sounds[key].volume = config.volume || 1.0; // Setzt die Standardlautstärke
    sounds[key].loop = config.loop || false; // Setzt die Loop-Eigenschaft
  }
}

/**
 * Die zentrale Funktion zum Entsperren des Audios. Bleibt unverändert.
 */
export function unlockAudio() {
  if (isUnlocked) return;
  console.log("Entsperre Audio-Kontext...");
  isUnlocked = true;
  for (const key in sounds) {
    const sound = sounds[key];
    sound.volume = 0;
    sound.play().catch(() => {});
    sound.pause();
    sound.currentTime = 0; // WICHTIG: Stellt die korrekte Lautstärke aus der Konfiguration wieder her
    sound.volume = soundFiles[key].volume || 1.0;
  }
}

/**
 * Spielt einen Sound ab und stellt sicher, dass die Lautstärke korrekt ist.
 */
export function playSound(name) {
  if (sounds[name]) {
    // Stellt sicher, dass ein laufender Fade gestoppt wird, bevor der Sound neu startet
    if (activeFades[name]) {
      clearInterval(activeFades[name]);
      delete activeFades[name];
    }
    // Setzt die Lautstärke auf den Standardwert zurück
    sounds[name].volume = soundFiles[name].volume || 1.0;
    sounds[name].currentTime = 0;
    sounds[name]
      .play()
      .catch((e) =>
        console.error(`Sound ${name} konnte nicht abgespielt werden:`, e)
      );
  }
}

/**
 * Stoppt einen laufenden Sound sofort.
 */
export function stopSound(name) {
  if (sounds[name]) {
    // Stoppt auch einen eventuellen Fade
    if (activeFades[name]) {
      clearInterval(activeFades[name]);
      delete activeFades[name];
    }
    sounds[name].pause();
    sounds[name].currentTime = 0;
  }
}

// ===================================================================================
// NEUE FUNKTION: Sound langsam ausblenden (faden)
// ===================================================================================
/**
 * Lässt einen Sound über eine bestimmte Dauer sanft ausblenden und stoppt ihn dann.
 * @param {string} name Der Name des Sounds (z.B. 'intro')
 * @param {number} duration Die Dauer des Ausblendens in Millisekunden (z.B. 2000 für 2 Sekunden)
 */
export function fadeOutSound(name, duration, onFinished) { // NEU: onFinished Callback
    const sound = sounds[name];
    
    // WICHTIG: Wenn der Sound gar nicht läuft, sofort den Callback ausführen.
    if (!sound || sound.paused) {
        if (onFinished) {
            onFinished();
        }
        return; 
    }

    // GEÄNDERT: Stoppt JEDEN laufenden Fade für diesen Sound
    if (activeFades[name]) {
        clearInterval(activeFades[name]);
    }

    const startVolume = sound.volume;
    const intervalTime = 50; 
    const steps = duration / intervalTime;
    const volumeStep = startVolume / steps;

    if (activeFades[name]) {
        clearInterval(activeFades[name]);
    }

    activeFades[name] = setInterval(() => {
        if (sound.volume > volumeStep) {
            sound.volume -= volumeStep;
        } else {
            stopSound(name); 
            sound.volume = startVolume; 
            
            // Wenn der Fade beendet ist, führe die onFinished-Funktion aus.
            if (onFinished) {
                onFinished();
            }
        }
    }, intervalTime);
}

export function fadeInSound(name, duration) {
    if (!sounds[name]) return;

    // GEÄNDERT: Stoppt JEDEN laufenden Fade für diesen Sound
    if (activeFades[name]) {
        clearInterval(activeFades[name]);
    }

    const sound = sounds[name];
    const targetVolume = soundFiles[name].volume || 1.0; // Ziel-Lautstärke aus der Konfig
    const intervalTime = 50;
    const steps = duration / intervalTime;
    const volumeStep = targetVolume / steps;

    sound.volume = 0; // Startet komplett leise
    sound.currentTime = 0;
    sound.play().catch(e => console.error(`Sound ${name} konnte nicht gestartet werden:`, e));

    const fadeInInterval = setInterval(() => {
        if (sound.volume < targetVolume - volumeStep) {
            sound.volume += volumeStep;
        } else {
            sound.volume = targetVolume;
            clearInterval(fadeInInterval);
        }
    }, intervalTime);
}