// In game2/assets.js

import audioManager from './audioManager.js';

export const ASSETS = {
    loadedImages: {},
};

async function loadImageAsset(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error(`Fehler beim Laden des Bildes: ${url}`);
            resolve(null);
        };
        img.src = url;
    });
}

export async function loadAllGameAssets () {
    try {
        // --- BILDER LADEN ---
        console.log("Assets: Lade Bilder...");
        ASSETS.loadedImages.street = await loadImageAsset("./game2/images/street.png");
        ASSETS.loadedImages.menuBackground = await loadImageAsset("./game2/images/menuBackground.png");
        ASSETS.loadedImages.player = await loadImageAsset("./game2/images/player.png");
        ASSETS.loadedImages.player_sturz = await loadImageAsset("./game2/images/player_sturz.png");
        ASSETS.loadedImages.asbo = await loadImageAsset("./game2/images/asbo.png");
        ASSETS.loadedImages.tornado = await loadImageAsset("./game2/images/tornado.png");
        ASSETS.loadedImages.issi = await loadImageAsset("./game2/images/issi.png");
        ASSETS.loadedImages.fast_car1 = await loadImageAsset("./game2/images/fast_car1.png");
        ASSETS.loadedImages.fast_car2 = await loadImageAsset("./game2/images/fast_car2.png");
        ASSETS.loadedImages.fast_car3 = await loadImageAsset("./game2/images/fast_car3.png");
        ASSETS.loadedImages.van = await loadImageAsset("./game2/images/van.png");
        ASSETS.loadedImages.taxi = await loadImageAsset("./game2/images/taxi.png");
        ASSETS.loadedImages.raser = await loadImageAsset("./game2/images/raser.png");
        
        ASSETS.loadedImages.key = await loadImageAsset("./game2/images/key.png");
        ASSETS.loadedImages.money = await loadImageAsset("./game2/images/money.png");
        ASSETS.loadedImages.trash = await loadImageAsset("./game2/images/trash.png");
        ASSETS.loadedImages.hamster = await loadImageAsset("./game2/images/hamster.png"); 
        ASSETS.loadedImages.krankenwagen_anfahrt = await loadImageAsset("./game2/images/krankenwagen_anfahrt.png");
        ASSETS.loadedImages.krankenwagen_abfahrt = await loadImageAsset("./game2/images/krankenwagen_abfahrt.png");
        console.log("Assets: Bilder geladen.");

        // --- SOUNDS LADEN ---
        if (audioManager.isInitialized()) { // Prüft, ob der audioManager bereit ist
            console.log("Assets: Lade Sounds...");
            await audioManager.loadSound('menu_select', './game2/sound/auswahl.wav');
            await audioManager.loadSound('musik_start', './game2/sound/menu_sound.ogg');
            await audioManager.loadSound('musik_spiel', './game2/sound/ingame_sound.ogg');
            await audioManager.loadSound('kollisions_sound', './game2/sound/kollision.wav');
            await audioManager.loadSound('krankenwagen_sirene', './game2/sound/krankenwagen_sirene.wav');
            await audioManager.loadSound('collect_key', './game2/sound/key_sound.wav');
            await audioManager.loadSound('collect_money', './game2/sound/money_sound.wav');
            await audioManager.loadSound('collect_trash', './game2/sound/trash_sound.wav');
            await audioManager.loadSound('collect_hamster', './game2/sound/hamster_sound.wav');
            await audioManager.loadSound('honk_sound', './game2/sound/hupe.wav');
            // Hier die Sounds für die Autos, die du in config.js definiert hast:
            //await audioManager.loadSound('car1_sound', './game2/sound/car1_sound.mp3');    // Beispiel-Dateiname
            //await audioManager.loadSound('car2_sound', './game2/sound/car1_sound.mp3');    // Beispiel-Dateiname
            //await audioManager.loadSound('car3_sound', './game2/sound/car1_sound.mp3');    // Beispiel-Dateiname
            //await audioManager.loadSound('van_sound', './game2/sound/car1_sound.mp3');      // Beispiel-Dateiname
            await audioManager.loadSound('raser_sound_1', './game2/sound/wagen_31.wav'); // Beispiel-Dateiname
            await audioManager.loadSound('raser_sound_2', './game2/sound/Schnee.ogg');
            console.log("Assets: Sounds geladen.");
        } else {
            console.warn("Assets: AudioManager nicht bereit, überspringe das Laden von Sounds.");
        }
        
        console.log("🎮 Alle Assets erfolgreich geladen.");

    } catch (error) {
        console.warn("🎮 FEHLER beim Laden von Assets", error);
    }
}