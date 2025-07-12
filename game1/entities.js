// game1/entities.js

import { 
    playerSpeed, // Wird hier nicht direkt verwendet, aber gehört logisch zur Spielerdefinition
    keySize, keySpawnMargin, keyLimit,
    obstacleImageWidth, obstacleImageHeight, minObstacleDistSq,
    enemyWidth, enemyHeight, SAFE_SPAWN_MARGIN_TOP, SAFE_SPAWN_MARGIN_BOTTOM, SAFE_SPAWN_MARGIN_LEFT, SAFE_SPAWN_MARGIN_RIGHT
} from './config.js';

import { checkRectCollision } from './utils.js'; 

function isPositionInNoSpawnZone(x, y, entityWidth, entityHeight, canvas) {
    // Prüfe oberen Rand (HUD)
    if (y < SAFE_SPAWN_MARGIN_TOP) {
        return true; // Zu nah am oberen Rand
    }

    // Prüfe unteren Rand (Zielanzeige)
    if (y + entityHeight > canvas.height - SAFE_SPAWN_MARGIN_BOTTOM) {
        return true; // Zu nah am unteren Rand
    }

    // Prüfe linken Rand (Maskenkrümmung/Ecken)
    if (x < SAFE_SPAWN_MARGIN_LEFT) {
        return true; // Zu nah am linken Rand
    }

    // Prüfe rechten Rand (Maskenkrümmung/Ecken)
    if (x + entityWidth > canvas.width - SAFE_SPAWN_MARGIN_RIGHT) {
        return true; // Zu nah am rechten Rand
    }

    return false; 
}

export function createPlayer(canvas) {
    return {
        x: canvas.width / 2 - 25, // Standardbreite 50 / 2
        y: canvas.height / 2 - 25, // Standardhöhe 50 / 2
        width: 50,
        height: 50,
        color: '#3498db', // Standardfarbe, falls kein Bild
        dx: 0,
        dy: 0
    };
}

export function generateObstacles(obstaclesArrayToFill, count, canvas, enemiesArray, playerObject) {
    obstaclesArrayToFill.length = 0;
    if (!canvas || count === 0) return;

    const margin = 40; // Äußerer Randabstand für Hindernisplatzierung 
    const centerMargin = 100; // Abstand von der Mitte
    const maxSpawnAttempts = 50; // Ggf. erhöhen
    console.log(`Generiere ${count} Hindernisse...`);

    const playerRect = { x: playerObject.x, y: playerObject.y, width: playerObject.width, height: playerObject.height };

    for (let i = 0; i < count; i++) {
        let obstacleX, obstacleY, collisionWithSomething, inNoSpawnZone;
        let attempts = 0;
        do {
            collisionWithSomething = false;
            inNoSpawnZone = false;
            attempts++;

            obstacleX = Math.random() * (canvas.width - obstacleImageWidth - 2 * margin) + margin;
            obstacleY = Math.random() * (canvas.height - obstacleImageHeight - 2 * margin) + margin;
            const tempRect = { x: obstacleX, y: obstacleY, width: obstacleImageWidth, height: obstacleImageHeight };

            // Prüfe No-Spawn-Zone
            if (isPositionInNoSpawnZone(obstacleX, obstacleY, obstacleImageWidth, obstacleImageHeight, canvas)) {
                inNoSpawnZone = true;
                continue;
            }

            // Kollision mit dem Canvas-Zentrum prüfen 
            const centerX = tempRect.x + tempRect.width / 2;
            const centerY = tempRect.y + tempRect.height / 2;
            if (Math.abs(centerX - canvas.width / 2) < centerMargin && Math.abs(centerY - canvas.height / 2) < centerMargin) {
                collisionWithSomething = true;
                continue;
            }
            // Kollision mit Spieler prüfen
            if (checkRectCollision(tempRect, playerRect)) {
                collisionWithSomething = true;
                continue;
            }
            // Kollision mit Gegnern prüfen
            for (const enemyUnit of enemiesArray) { 
                if (checkRectCollision(tempRect, enemyUnit)) {
                    collisionWithSomething = true;
                    break;
                }
            }
            if (collisionWithSomething) continue;

            // Kollision mit anderen Hindernissen prüfen
            for (const other of obstaclesArrayToFill) {
                const otherCenterX = other.x + other.width / 2;
                const otherCenterY = other.y + other.height / 2;
                const dx = centerX - otherCenterX;
                const dy = centerY - otherCenterY;
                const distSq = dx * dx + dy * dy;
                if (distSq < minObstacleDistSq) {
                    collisionWithSomething = true;
                    break;
                }
            }
        } while ((collisionWithSomething || inNoSpawnZone) && attempts < maxSpawnAttempts);

        if (!collisionWithSomething && !inNoSpawnZone) {
            obstaclesArrayToFill.push({ x: obstacleX, y: obstacleY, width: obstacleImageWidth, height: obstacleImageHeight });
        } else {
            console.warn(`Konnte nach ${maxSpawnAttempts} Versuchen kein sicheres Hindernis ${i + 1} platzieren.`);
        }
    }
    console.log(`${obstaclesArrayToFill.length} von ${count} Hindernissen platziert.`);
}

export function spawnRandomKey(keysArrayToFill, canvas, obstaclesArray, enemiesArray) {
    if (!canvas) {
        console.error("spawnRandomKey: Canvas wurde nicht übergeben.");
        return;
    }
    if (keysArrayToFill.length >= keyLimit) return;

    let keyX, keyY, collisionWithSomething, inNoSpawnZone;
    const maxAttempts = 50;
    let attempt = 0;

    do {
        collisionWithSomething = false;
        inNoSpawnZone = false;
        attempt++;

        keyX = Math.random() * (canvas.width - keySize);
        keyY = Math.random() * (canvas.height - keySize);
        const keyRect = { x: keyX, y: keyY, width: keySize, height: keySize };

        if (isPositionInNoSpawnZone(keyX, keyY, keySize, keySize, canvas)) {
            inNoSpawnZone = true;
            continue;
        }

        for (const obstacle of obstaclesArray) {
            if (checkRectCollision(keyRect, obstacle)) {
                collisionWithSomething = true; break;
            }
        }
        if (collisionWithSomething) continue;

        for (const enemyUnit of enemiesArray) {
            if (checkRectCollision(keyRect, enemyUnit)) {
                collisionWithSomething = true; break;
            }
        }
        if (collisionWithSomething) continue;

        for (const otherKey of keysArrayToFill) {
            const expandedOtherKeyRect = {
                x: otherKey.x - keySpawnMargin, y: otherKey.y - keySpawnMargin,
                width: keySize + 2 * keySpawnMargin, height: keySize + 2 * keySpawnMargin
            };
            if (checkRectCollision(keyRect, expandedOtherKeyRect)) {
                collisionWithSomething = true; break;
            }
        }
    } while ((collisionWithSomething || inNoSpawnZone) && attempt < maxAttempts);

    if (!collisionWithSomething && !inNoSpawnZone) {
        keysArrayToFill.push({ x: keyX, y: keyY, collected: false, number: null });
    } else {
        console.warn("spawnRandomKey: Konnte nach", maxAttempts, "Versuchen keinen sicheren Platz für ZUFÄLLIGEN Schlüssel finden.");
    }
}

export function spawnNumberedKeys(keysArrayToFill, count, canvas, obstaclesArray, enemiesArray) {
    keysArrayToFill.length = 0;
    if (!canvas || count === 0) return;
    console.log(`Spawne ${count} nummerierte Schlüssel (mit No-Spawn-Zone-Prüfung)...`);

    for (let i = 1; i <= count; i++) {
        let keyX, keyY, collisionWithSomething, inNoSpawnZone;
        const maxAttempts = 50; // Ggf. erhöhen
        let attempt = 0;
        do {
            collisionWithSomething = false;
            inNoSpawnZone = false;
            attempt++;

            keyX = Math.random() * (canvas.width - keySize);
            keyY = Math.random() * (canvas.height - keySize);
            const keyRect = { x: keyX, y: keyY, width: keySize, height: keySize };

            // Prüfe No-Spawn-Zone
            if (isPositionInNoSpawnZone(keyX, keyY, keySize, keySize, canvas)) {
                inNoSpawnZone = true;
                continue;
            }

            // Bestehende Kollisionsprüfungen
            for (const obstacle of obstaclesArray) {
                if (checkRectCollision(keyRect, obstacle)) {
                    collisionWithSomething = true; break;
                }
            }
            if (collisionWithSomething) continue;

            for (const enemyUnit of enemiesArray) { // Korrigierte Schleife
                if (checkRectCollision(keyRect, enemyUnit)) {
                    collisionWithSomething = true; break;
                }
            }
            if (collisionWithSomething) continue;

            for (const otherKey of keysArrayToFill) {
                const expandedOtherKeyRect = {
                    x: otherKey.x - keySpawnMargin, y: otherKey.y - keySpawnMargin,
                    width: keySize + 2 * keySpawnMargin, height: keySize + 2 * keySpawnMargin
                };
                if (checkRectCollision(keyRect, expandedOtherKeyRect)) {
                    collisionWithSomething = true; break;
                }
            }
        } while ((collisionWithSomething || inNoSpawnZone) && attempt < maxAttempts);

        if (!collisionWithSomething && !inNoSpawnZone) {
            keysArrayToFill.push({ x: keyX, y: keyY, collected: false, number: i });
        } else {
            console.warn(`Kein sicherer Platz für Schlüssel Nr. ${i} (mit Margin und No-Spawn-Zone) nach ${maxAttempts} Versuchen.`);
        }
    }
    console.log(`${keysArrayToFill.length} von ${count} nummerierten Schlüsseln platziert.`);
}

export function createInitialEnemies(enemyCount, canvas, currentEnemySpeed, setEnemyRandomDirectionFunc, playerObject, gameConfig) {
    const newEnemiesArray = [];
  if (!canvas) {
    console.error("createInitialEnemies: Canvas wurde nicht übergeben!");
    return newEnemiesArray;
  }
  if (!playerObject) {
    console.error("createInitialEnemies: playerObject wurde nicht übergeben!");
    // Optional: trotzdem Gegner ohne Tracking erstellen oder leeres Array zurückgeben
  }
  if (!gameConfig) {
    console.error("createInitialEnemies: gameConfig wurde nicht übergeben!");
    // Optional: Fallback-Config verwenden oder leeres Array zurückgeben
  }

  for (let i = 0; i < enemyCount; i++) {
    const corner = Math.floor(Math.random() * 4);
    let startX, startY;
    const offset = i * (enemyWidth + 15); 

    if (corner === 0) { 
      startX = 40 + offset;
      startY = 40;
    } else if (corner === 1) { 
      startX = canvas.width - enemyWidth - 40 - offset;
      startY = 40;
    } else if (corner === 2) { 
      startX = 40 + offset;
      startY = canvas.height - enemyHeight - 40; 
    } else { 
      startX = canvas.width - enemyWidth - 40 - offset;
      startY = canvas.height - enemyHeight - 40;
    }

    // Sicherstellen, dass Gegner innerhalb des Canvas bleiben
    startX = Math.max(0, Math.min(startX, canvas.width - enemyWidth));
    startY = Math.max(0, Math.min(startY, canvas.height - enemyHeight));

    let newEnemy = {
      x: startX,
      y: startY,
      width: enemyWidth,
      height: enemyHeight,
      speed: currentEnemySpeed, 
      dx: 0,
      dy: 0,
      lastDirectionChange: Date.now() + Math.random() * 500 
    };

    if (typeof setEnemyRandomDirectionFunc === 'function') {
      setEnemyRandomDirectionFunc(newEnemy, gameConfig, playerObject);
    } else {
      console.warn("setEnemyRandomDirectionFunc wurde nicht an createInitialEnemies übergeben oder ist keine Funktion!");
    }
    newEnemiesArray.push(newEnemy);
    console.log(`Gegner ${i + 1}/${enemyCount} erstellt bei X:${startX.toFixed(0)}, Y:${startY.toFixed(0)}`);
  }
  return newEnemiesArray;
}