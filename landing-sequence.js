// Kompletter Inhalt für: landing-sequence.js

// === EINSTELLUNGEN ===
const NUM_STARS = 9500;
const SPREAD = 1300;
const TUNNEL_DEPTH = 1000;
const MIN_SPEED = 0.5;
const MAX_SPEED = 17;
const HOLDING_SPEED = 0.2;

const ACCELERATION = 0.03;
const TIME_AT_MAX_SPEED = 3000;

// NEU: Faktoren für das sanfte Abbremsen
const STAR_BRAKE_FACTOR = 0.01;   // Wie sanft die Sterne abbremsen (kleiner = sanfter)
const LOGO_BRAKE_FACTOR = 0.01;   // Wie sanft das Logo abbremst (kleiner = sanfter)


// === Logo-Variablen ===
const logoImage = new Image();
// ... (der Rest der Datei bleibt unverändert) ...
let logoLoaded = false;
let logo = {
    z: 25000,
    targetZ: TUNNEL_DEPTH,
    scale: 1.0
};


// === Interne Variablen ===
let isActive = false;
let onCompleteCallback = null;
const stars = [];
let currentSpeed = 0;
let cameraOffsetX = 0;
let phase = 'idle';


function preloadLogo() {
    if (logoLoaded) return;
    logoImage.onload = () => { logoLoaded = true; };
    logoImage.src = 'images/schild.png';
}

export function initLandingSequence(onComplete) {
    preloadLogo();
    onCompleteCallback = onComplete;
    
    logo.z = 20000;
    cameraOffsetX = 0;
    phase = 'idle';
    stars.length = 0;

    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: (Math.random() - 0.5) * SPREAD,
            y: (Math.random() - 0.5) * SPREAD,
            z: Math.random() * TUNNEL_DEPTH
        });
    }
}

export function startLandingSequence() {
    phase = 'accelerating';
    currentSpeed = MIN_SPEED;
    isActive = true;
}

export function updateAndDrawLandingSequence(ctx, canvas) {
    if (!isActive) return;

    const centerX = canvas.width / 2 - cameraOffsetX;
    const centerY = canvas.height / 2;

    // Phasen-Logik
    if (phase === 'accelerating') {
        currentSpeed += ACCELERATION;
        if (currentSpeed >= MAX_SPEED) {
            currentSpeed = MAX_SPEED;
            phase = 'flying';
            setTimeout(() => { phase = 'finalApproach'; }, TIME_AT_MAX_SPEED);
        }
    } else if (phase === 'finalApproach') {
        const speedRemaining = currentSpeed - HOLDING_SPEED;
        // NEU: Verwendet die Konstante
        currentSpeed -= speedRemaining * STAR_BRAKE_FACTOR;

        const distRemaining = logo.z - logo.targetZ;
        // NEU: Verwendet die Konstante
        logo.z -= distRemaining * LOGO_BRAKE_FACTOR;

        if (distRemaining < 1) {
            logo.z = logo.targetZ;
            currentSpeed = HOLDING_SPEED;
            phase = 'holding';
            setTimeout(() => { phase = 'panning'; }, 200);
        }
    } else if (phase === 'panning') {
        cameraOffsetX += 5;

        const p = TUNNEL_DEPTH / logo.z;
        const logoWidth = logoImage.width * p * logo.scale;
        if ((centerX + logoWidth / 2) < 0) {
            phase = 'holding'; 
            if (onCompleteCallback) {
                onCompleteCallback();
                onCompleteCallback = null;
            }
        }
    }

    // --- ZEICHNEN ---
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sterne zeichnen
    for (const star of stars) {
        star.z -= currentSpeed;
        if (star.z <= 0) { star.z = TUNNEL_DEPTH; }
        const p = TUNNEL_DEPTH / star.z;
        const x = centerX + star.x * p;
        const y = centerY + star.y * p;
        const size = (1 - star.z / TUNNEL_DEPTH) * 4;
        const alpha = 1 - star.z / TUNNEL_DEPTH;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        
        if (phase !== 'panning' && (x < 0 || x > canvas.width || y < 0 || y > canvas.height)) {
            // Im Schwenk wird nicht geprüft
        } else {
             ctx.fillRect(x, y, size, size);
        }
    }

    // Logo zeichnen
    if (logoLoaded && (phase === 'finalApproach' || phase === 'holding' || phase ==='panning')) {
        const p = TUNNEL_DEPTH / logo.z;
        const logoWidth = logoImage.width * p * logo.scale;
        const logoHeight = logoImage.height * p * logo.scale;
        const logoX = centerX - logoWidth / 2;
        const logoY = centerY - logoHeight / 2;

        if (logo.z > 0) {
            ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
        }
    }
}

export function isLandingSequenceActive() {
    return phase !== 'holding' && phase !== 'idle';
}