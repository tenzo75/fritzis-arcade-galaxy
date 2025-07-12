// game1/assets.js

// Bild-Ladungen
export const keyImage = new Image();
export let keyImageLoaded = false;
keyImage.onload = function() { console.log("Key Img OK."); keyImageLoaded = true; };
keyImage.onerror = function() { console.error("FEHLER: Key Img!"); };
keyImage.src = './game1/images/schluessel1.png';

export const obstacleImage = new Image();
export let obstacleImageLoaded = false;
obstacleImage.onload = function() { console.log("Obstacle Img OK."); obstacleImageLoaded = true; };
obstacleImage.onerror = function() { console.error("FEHLER: Obstacle Img!"); };
obstacleImage.src = './game1/images/blockade1.png';

export const playerImage = new Image();
export let playerImageLoaded = false;
playerImage.onload = function() { console.log("Player Img OK."); playerImageLoaded = true; };
playerImage.onerror = function() { console.error("FEHLER: Player Img!"); };
playerImage.src = './game1/images/player1.png';

export const enemyImage = new Image();
export let enemyImageLoaded = false;
enemyImage.onload = function() { console.log("Enemy Img OK."); enemyImageLoaded = true; };
enemyImage.onerror = function() { console.error("FEHLER: Enemy Img!"); };
enemyImage.src = './game1/images/hamster1.png';

export const gameBackgroundImage = new Image();
export let gameBackgroundImageLoaded = false;
gameBackgroundImage.onload = function() { console.log("BG Img OK."); gameBackgroundImageLoaded = true; };
gameBackgroundImage.onerror = function() { console.error("FEHLER: BG Img!"); };
gameBackgroundImage.src = './game1/images/backgroundGame1.jpg';

//SChlüsselmoment Schriftzug
export const titleImage = new Image();
export let titleImageLoaded = false;
titleImage.onload = function() { console.log("Title Img OK."); titleImageLoaded = true; };
titleImage.onerror = function() { console.error("FEHLER: Title Img!"); };
titleImage.src = './game1/images/schluesselmoment.png';

// Hintergrundbild für Spiel-Startbildschirm
export const gameStartBackgroundImage = new Image();
export let gameStartBackgroundImageLoaded = false;
gameStartBackgroundImage.onload = function() { console.log("GameStart BG Img OK."); gameStartBackgroundImageLoaded = true; };
gameStartBackgroundImage.onerror = function() { console.error("FEHLER: GameStart BG Img!"); };
gameStartBackgroundImage.src = './game1/images/backgroundStart1.jpg'; 

// Fritzi-Bild für Spiel-Startbildschirm
export const fritziStartImage = new Image();
export let fritziStartImageLoaded = false;
fritziStartImage.onload = function() { console.log("Fritzi Start Img OK."); fritziStartImageLoaded = true; };
fritziStartImage.onerror = function() { console.error("FEHLER: Fritzi Start Img!"); };
fritziStartImage.src = './game1/images/fritzi1.png';

// Hamster-Bild für Spiel-Startbildschirm
export const hamsterStartImage = new Image();
export let hamsterStartImageLoaded = false;
hamsterStartImage.onload = function() { console.log("Hamster Start Img OK."); hamsterStartImageLoaded = true; };
hamsterStartImage.onerror = function() { console.error("FEHLER: Hamster Start Img!"); };
hamsterStartImage.src = './game1/images/hamster1.png'; 
