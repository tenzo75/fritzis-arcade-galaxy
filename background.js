// Neue Datei: Hauptverzeichnis/background.js

// Private Variablen des Moduls
let backgroundStars = [];
let shootingStars = [];
let nebulaParticles = [];
let flyingRockets = [];
let imgRocketUpLeft = new Image();
let imgRocketUpRight = new Image();
let imgRocketDownLeft = new Image();
let imgRocketDownRight = new Image();
let imagesLoaded = false;

// #####################################################################
// ### Öffentliche (exportierte) Funktionen                        ###
// #####################################################################

function preloadImages() {
    if (imagesLoaded) return;

    let loadedCount = 0;
    const imageCount = 4; // Wir laden jetzt 4 Bilder

    const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === imageCount) {
            imagesLoaded = true;
            console.log("Diagonale Raketen-Bilder geladen.");
        }
    };

    imgRocketUpLeft.onload = onImageLoad;
    imgRocketUpRight.onload = onImageLoad;
    imgRocketDownLeft.onload = onImageLoad;
    imgRocketDownRight.onload = onImageLoad;
    
    // BITTE PASSEN SIE DIESE DATEINAMEN AN IHRE DATEIEN AN
    imgRocketUpLeft.src = 'images/rocket_up_links.png';      // Fliegt nach links oben
    imgRocketUpRight.src = 'images/rocket_up_rechts.png';   // Fliegt nach rechts oben
    imgRocketDownLeft.src = 'images/rocket_down_links.png'; // Fliegt nach links unten
    imgRocketDownRight.src = 'images/rocket_down_rechts.png';// Fliegt nach rechts unten
}

/**
 * Initialisiert und erzeugt alle Hintergrundeffekte.
 */
export function initBackground(canvas) {
    if (backgroundStars.length > 0) return;
    preloadImages();
    // Arrays für einen sauberen Neustart leeren
    backgroundStars = [];
    shootingStars = [];
    nebulaParticles = [];
    flyingRockets = [];

    // Private Funktionen aufrufen, um die Effekte zu erstellen
    createNebula(canvas);
    createAllStars(canvas);
    // NEU: Fliegende Raketen initial erstellen
    const ROCKET_COUNT = 1; // Anzahl der Raketen, die im Umlauf sind
    for (let i = 0; i < ROCKET_COUNT; i++) {
        flyingRockets.push({ isWaiting: true });
    }
}

/**
 * Zeichnet und animiert alle Hintergrundeffekte.
 */
export function drawAndAnimateBackground(ctx, canvas) {
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawAndMoveNebula(ctx, canvas);
    drawAndMoveStars(ctx, canvas);

    // Nur zeichnen, wenn die Bilder fertig geladen sind
    if (!imagesLoaded) return;

    for (const rocket of flyingRockets) {
        if (rocket.isWaiting) {
            if (!rocket.respawnTime) {
                const minWait = 5000;
                const maxWait = 10000;
                rocket.respawnTime = Date.now() + Math.random() * (maxWait - minWait) + minWait;
            }
            if (Date.now() > rocket.respawnTime) {
                resetFlyingRocket(rocket, canvas);
                rocket.isWaiting = false;
                rocket.respawnTime = null;
            }
            continue;
        }

        // Rakete bewegen
        rocket.x += rocket.speedX;
        rocket.y += rocket.speedY;

        // Rakete zeichnen
        ctx.drawImage(rocket.image, rocket.x, rocket.y, rocket.width, rocket.height);

        // Prüfen, ob die Rakete komplett aus dem Bild ist
        if (rocket.x > canvas.width + rocket.width || rocket.x < -rocket.width || rocket.y > canvas.height + rocket.height || rocket.y < -rocket.height) {
            rocket.isWaiting = true;
        }
    }
}


// #####################################################################
// ### Private Funktionen (nicht exportiert)                       ###
// #####################################################################

function createNebula(canvas) {
    const particleCount = 30; 
    const colors = [
        'rgba(20, 40, 180, 0.04)',  
        'rgba(80, 20, 150, 0.04)', 
        'rgba(150, 50, 150, 0.03)'
    ];

    for (let i = 0; i < particleCount; i++) {
        nebulaParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radiusX: Math.random() * 80 + 40,
            radiusY: Math.random() * 80 + 40,
            color: colors[Math.floor(Math.random() * colors.length)],
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.05 + 0.02,
            turnSpeed: (Math.random() - 0.5) * 0.001
        });
    }
}

function createAllStars(canvas) {
    const starCount = 300;
    const pulsingChance = 0.15;

    for (let i = 0; i < starCount; i++) {
        const star = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.2 + 0.1,
            isPulsing: false,
        };
        if (Math.random() < pulsingChance) {
            star.isPulsing = true;
            star.pulseAngle = Math.random() * Math.PI * 2;
            star.pulseSpeed = (Math.random() * 0.04) + 0.01;
            star.baseAlpha = 0.4 + Math.random() * 0.4;
        }
        backgroundStars.push(star);
    }

    const shootingStarCount = 1; 
    for (let i = 0; i < shootingStarCount; i++) {
        const newStar = { isWaiting: true };
        shootingStars.push(newStar);
    }
}

function drawAndMoveNebula(ctx, canvas) {
    ctx.globalCompositeOperation = 'lighter';
    for (const p of nebulaParticles) {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.angle += p.turnSpeed;
        if (p.x < 0 || p.x > canvas.width) p.turnSpeed *= -1;
        if (p.y < 0 || p.y > canvas.height) p.turnSpeed *= -1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
}

function drawAndMoveStars(ctx, canvas) {
    for (const star of backgroundStars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        let alpha = 1.0;
        if (star.isPulsing) {
            star.pulseAngle += star.pulseSpeed;
            alpha = star.baseAlpha + (Math.sin(star.pulseAngle) * (1 - star.baseAlpha));
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#FFFFFF';
    for (const shootingStar of shootingStars) {
        if (shootingStar.isWaiting) {
            if (!shootingStar.respawnTime) {
                 const minWait = 3000;
                 const maxWait = 6000;
                 shootingStar.respawnTime = Date.now() + Math.random() * (maxWait - minWait) + minWait;
            }
            if (Date.now() > shootingStar.respawnTime) {
                resetShootingStar(shootingStar, canvas);
                shootingStar.isWaiting = false;
                shootingStar.respawnTime = null;
            }
            continue;
        }
        
        shootingStar.x += shootingStar.speedX;
        shootingStar.y += shootingStar.speedY;

        const tailLength = 50;
        const tailX = shootingStar.x - shootingStar.speedX * tailLength;
        const tailY = shootingStar.y - shootingStar.speedY * tailLength;
        const gradient = ctx.createLinearGradient(shootingStar.x, shootingStar.y, tailX, tailY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(shootingStar.x, shootingStar.y);
        ctx.stroke();
        
        if (shootingStar.x > canvas.width || shootingStar.y > canvas.height) {
            shootingStar.isWaiting = true;
        }
    }
}

function resetShootingStar(star, canvas) {
    star.size = 1.5;
    if (Math.random() > 0.5) {
        star.x = Math.random() * canvas.width;
        star.y = -20;
        star.speedX = (Math.random() * 2) + 1; 
        star.speedY = (Math.random() * 3) + 3;
    } else {
        star.x = -20;
        star.y = Math.random() * canvas.height * 0.5;
        star.speedX = (Math.random() * 3) + 3;
        star.speedY = (Math.random() * 2) + 1;
    }
}

function resetFlyingRocket(rocket, canvas) {
    const ROCKET_SIZE = 40;
    rocket.height = ROCKET_SIZE;
    rocket.width = ROCKET_SIZE;

    const speed = Math.random() * 1 + 0.5; // Grundgeschwindigkeit
    const direction = Math.floor(Math.random() * 4); // Zufallszahl von 0 bis 3

    switch (direction) {
        case 0: // Fliegt von rechts unten nach links oben
            rocket.image = imgRocketUpLeft;
            rocket.x = canvas.width;
            rocket.y = canvas.height;
            rocket.speedX = -speed;
            rocket.speedY = -speed;
            break;
        case 1: // Fliegt von links unten nach rechts oben
            rocket.image = imgRocketUpRight;
            rocket.x = -rocket.width;
            rocket.y = canvas.height;
            rocket.speedX = speed;
            rocket.speedY = -speed;
            break;
        case 2: // Fliegt von rechts oben nach links unten
            rocket.image = imgRocketDownLeft;
            rocket.x = canvas.width;
            rocket.y = -rocket.height;
            rocket.speedX = -speed;
            rocket.speedY = speed;
            break;
        case 3: // Fliegt von links oben nach rechts unten
            rocket.image = imgRocketDownRight;
            rocket.x = -rocket.width;
            rocket.y = -rocket.height;
            rocket.speedX = speed;
            rocket.speedY = speed;
            break;
    }
}
