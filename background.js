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
let lastTime = 0; // NEU: Variable für die Zeitmessung

// #####################################################################
// ### Öffentliche (exportierte) Funktionen                          ###
// #####################################################################

function preloadImages() {
    if (imagesLoaded) return;

    let loadedCount = 0;
    const imageCount = 4;

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
    
    imgRocketUpLeft.src = 'images/rocket_up_links.png';
    imgRocketUpRight.src = 'images/rocket_up_rechts.png';
    imgRocketDownLeft.src = 'images/rocket_down_links.png';
    imgRocketDownRight.src = 'images/rocket_down_rechts.png';
}

/**
 * Initialisiert und erzeugt alle Hintergrundeffekte.
 */
export function initBackground(canvas) {
    // KORREKTUR: Die Zeitmessung wird jetzt immer zurückgesetzt, wenn der
    // Hintergrund neu gestartet wird. Dies ist der wichtigste Teil der Lösung.
    lastTime = 0; 

    // Die Schutz-Bedingung bleibt, aber sie beeinflusst die Zeitmessung nicht mehr.
    if (backgroundStars.length > 0) {
        return;
    }
    
    // Der restliche Code wird nur beim allerersten Start ausgeführt.
    preloadImages();
    backgroundStars = [];
    shootingStars = [];
    nebulaParticles = [];
    flyingRockets = [];

    createNebula(canvas);
    createAllStars(canvas);
    const ROCKET_COUNT = 1;
    for (let i = 0; i < ROCKET_COUNT; i++) {
        flyingRockets.push({ isWaiting: true });
    }
}

/**
 * Zeichnet und animiert alle Hintergrundeffekte.
 */
export function drawAndAnimateBackground(ctx, canvas, currentTime) { // NEU: currentTime als Parameter
    if (!currentTime) return; // Sicherheitsabfrage, falls die Zeit noch nicht da ist
    if (!lastTime) {
        lastTime = currentTime;
    }
    const deltaSeconds = (currentTime - lastTime) / 1000; // Zeit in Sekunden
    lastTime = currentTime;

    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // NEU: deltaSeconds wird an die Hilfsfunktionen weitergegeben
    drawAndMoveNebula(ctx, canvas, deltaSeconds);
    drawAndMoveStars(ctx, canvas, deltaSeconds);

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

        // NEU: Raketenbewegung ist jetzt zeitbasiert
        rocket.x += rocket.speedX * deltaSeconds;
        rocket.y += rocket.speedY * deltaSeconds;

        ctx.drawImage(rocket.image, rocket.x, rocket.y, rocket.width, rocket.height);

        if (rocket.x > canvas.width + rocket.width || rocket.x < -rocket.width || rocket.y > canvas.height + rocket.height || rocket.y < -rocket.height) {
            rocket.isWaiting = true;
        }
    }
}


// #####################################################################
// ### Private Funktionen (nicht exportiert)                         ###
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
            speed: Math.random() * 15 + 5, // NEU: Angepasste Geschwindigkeit (Pixel pro Sekunde)
            turnSpeed: (Math.random() - 0.5) * 0.05
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
            speed: Math.random() * 20 + 10, // NEU: Angepasste Geschwindigkeit (Pixel pro Sekunde)
            isPulsing: false,
        };
        if (Math.random() < pulsingChance) {
            star.isPulsing = true;
            star.pulseAngle = Math.random() * Math.PI * 2;
            star.pulseSpeed = (Math.random() * 2) + 1; // Pulsieren ist okay ohne deltaTime
            star.baseAlpha = 0.4 + Math.random() * 0.4;
        }
        backgroundStars.push(star);
    }

    const shootingStarCount = 1; 
    for (let i = 0; i < shootingStarCount; i++) {
        shootingStars.push({ isWaiting: true });
    }
}

function drawAndMoveNebula(ctx, canvas, deltaSeconds) { // NEU: deltaSeconds als Parameter
    ctx.globalCompositeOperation = 'lighter';
    for (const p of nebulaParticles) {
        // NEU: Zeitbasierte Bewegung
        p.x += Math.cos(p.angle) * p.speed * deltaSeconds;
        p.y += Math.sin(p.angle) * p.speed * deltaSeconds;
        p.angle += p.turnSpeed * deltaSeconds;

        if (p.x < 0 || p.x > canvas.width) p.turnSpeed *= -1;
        if (p.y < 0 || p.y > canvas.height) p.turnSpeed *= -1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
}

function drawAndMoveStars(ctx, canvas, deltaSeconds) { // NEU: deltaSeconds als Parameter
    for (const star of backgroundStars) {
        star.y += star.speed * deltaSeconds; // NEU: Zeitbasierte Bewegung
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        let alpha = 1.0;
        if (star.isPulsing) {
            star.pulseAngle += star.pulseSpeed * deltaSeconds; // Auch Pulsieren zeitbasiert machen
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
        
        // NEU: Zeitbasierte Bewegung
        shootingStar.x += shootingStar.speedX * deltaSeconds;
        shootingStar.y += shootingStar.speedY * deltaSeconds;

        const tailLength = 50;
        // Der Schweif muss nun auch die Geschwindigkeit pro Sekunde berücksichtigen
        const tailX = shootingStar.x - (shootingStar.speedX * deltaSeconds) * tailLength;
        const tailY = shootingStar.y - (shootingStar.speedY * deltaSeconds) * tailLength;
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
        // NEU: Angepasste Geschwindigkeiten (Pixel pro Sekunde)
        star.speedX = (Math.random() * 100) + 50; 
        star.speedY = (Math.random() * 150) + 150;
    } else {
        star.x = -20;
        star.y = Math.random() * canvas.height * 0.5;
        // NEU: Angepasste Geschwindigkeiten (Pixel pro Sekunde)
        star.speedX = (Math.random() * 150) + 150;
        star.speedY = (Math.random() * 100) + 50;
    }
}

function resetFlyingRocket(rocket, canvas) {
    const ROCKET_SIZE = 40;
    rocket.height = ROCKET_SIZE;
    rocket.width = ROCKET_SIZE;

    const speed = Math.random() * 60 + 30; // NEU: Grundgeschwindigkeit in Pixel pro Sekunde
    const direction = Math.floor(Math.random() * 4);

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