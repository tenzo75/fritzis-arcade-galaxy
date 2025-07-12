// In Hauptverzeichniss: pixel-storm.js

// Die Auflösung des Partikel-Gitters. 
// Ein größerer Wert bedeutet weniger, aber größere Partikel und eine bessere Performance.
// Ein guter Wert zum Starten ist 4 oder 5.
const resolution = 8; 

// Die maximale Startgeschwindigkeit der Partikel.
const maxSpeed = 5; 


// Diese Funktion liest ein Bild und gibt ein Array mit Partikeln zurück.
export function createPixelStorm(imageElement, canvas) {
    const particles = [];
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = imageElement.naturalWidth;
    tempCanvas.height = imageElement.naturalHeight;
    tempCtx.drawImage(imageElement, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
    const offsetX = (canvas.width - tempCanvas.width) / 2;
    const offsetY = (canvas.height - tempCanvas.height) / 2;
    
    // Den Mittelpunkt des Canvas berechnen wir einmal vor der Schleife
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    for (let y = 0; y < tempCanvas.height; y += resolution) {
        for (let x = 0; x < tempCanvas.width; x += resolution) {
            const index = (y * tempCanvas.width + x) * 4;
            const a = imageData[index + 3];

            if (a > 0) {
                const particleX = offsetX + x;
                const particleY = offsetY + y;

                // ===============================================
                // NEUE LOGIK FÜR DIE BEWEGUNGSRICHTUNG
                // ===============================================
                // 1. Richtung vom Canvas-Mittelpunkt zum Partikel bestimmen
                const dirX = particleX - canvasCenterX;
                const dirY = particleY - canvasCenterY;

                // 2. Die Länge dieses Richtungsvektors berechnen (Satz des Pythagoras)
                const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);

                // 3. Eine zufällige Geschwindigkeit für dieses Partikel festlegen
                // Wir addieren 1, damit kein Partikel stehen bleibt.
                const speed = 1 + Math.random() * maxSpeed;

                // 4. Die finale Bewegung (dx, dy) berechnen:
                // Wir teilen die Richtung durch ihre Länge (um sie zu "normalisieren") und
                // multiplizieren sie dann mit der zufälligen Geschwindigkeit.
                // Ein kleiner Check (magnitude > 0) verhindert eine Division durch Null im exakten Zentrum.
                const particleDx = magnitude > 0 ? (dirX / magnitude) * speed : 0;
                const particleDy = magnitude > 0 ? (dirY / magnitude) * speed : 0;
                // ===============================================

                particles.push({
                    x: particleX,
                    y: particleY,
                    color: `rgba(${imageData[index]},${imageData[index+1]},${imageData[index+2]},${a})`,
                    // NEU: Verwende die berechneten Werte statt der rein zufälligen
                    dx: particleDx,
                    dy: particleDy,
                    size: resolution 
                });
            }
        }
    }
    console.log(`Pixel-Sturm erzeugt mit ${particles.length} Partikeln.`);
    return particles;
}

// Diese Funktion wird später die Partikel zeichnen
export function drawParticles(ctx, particles) {
    if (!particles) return;
    for (const p of particles) {
        ctx.fillStyle = p.color;
        // NEU: Verwendet die individuelle Größe des Partikels
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
}

// Diese Funktion wird später die Partikel bewegen
export function updateParticles(particles) {
    if (!particles) return;
    for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        // NEU: Partikel wird bei jedem Frame etwas größer
        p.size += 0.25; 
    }
}