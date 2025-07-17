// game1/gameLogic.js 

import { checkRectCollision } from './utils.js';

function setAggressiveDirection(enemyUnit, config, player) {
  if (!enemyUnit) return;

  // Geschwindigkeit sicherstellen (wie vorher, aber mit 'config' als Parametername)
  // Ein Fallback-Wert für speed, falls config nicht verfügbar ist oder speed 0 ist.
  enemyUnit.speed = enemyUnit.speed || (config ? config.playerSpeed * config.enemyBaseSpeedMultiplier : 2);
  if (enemyUnit.speed === 0) enemyUnit.speed = 2; 

  let finalAngle;

  if (player && player.x !== undefined && player.y !== undefined) { 
    // Mittelpunkt des Spielers und des Gegners berechnen
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const enemyCenterX = enemyUnit.x + enemyUnit.width / 2;
    const enemyCenterY = enemyUnit.y + enemyUnit.height / 2;

    // Richtung zum Spieler
    const deltaX = playerCenterX - enemyCenterX;
    const deltaY = playerCenterY - enemyCenterY;

    // Winkel zum Spieler berechnen
    let angleToPlayer = Math.atan2(deltaY, deltaX);

    const maxAngleDeviation = Math.PI / 3; 
    const deviation = (Math.random() - 0.5) * maxAngleDeviation; 
    finalAngle = angleToPlayer + deviation;

  } else {
    // Fallback: Wenn kein Spielerobjekt vorhanden ist, rein zufällige Bewegung
    console.warn("setEnemyRandomDirection: Kein Spielerobjekt übergeben, Gegner bewegt sich zufällig.");
    finalAngle = Math.random() * Math.PI * 2;
  }

  enemyUnit.dx = Math.cos(finalAngle) * enemyUnit.speed;
  enemyUnit.dy = Math.sin(finalAngle) * enemyUnit.speed;
  enemyUnit.lastDirectionChange = Date.now();
}

function setPurelyRandomDirection(enemyUnit, config) {
    if (!enemyUnit) return;
    // Geschwindigkeit sicherstellen
    enemyUnit.speed = enemyUnit.speed || (config ? config.playerSpeed * config.enemyBaseSpeedMultiplier : 2);
    if (enemyUnit.speed === 0) enemyUnit.speed = 2;

    const angle = Math.random() * Math.PI * 2;
    enemyUnit.dx = Math.cos(angle) * enemyUnit.speed;
    enemyUnit.dy = Math.sin(angle) * enemyUnit.speed;
    enemyUnit.lastDirectionChange = Date.now();
}

function reverseEnemyDirection(enemyUnit, collidedObjRect, config) { 
    if (!enemyUnit) return;  
    setPurelyRandomDirection(enemyUnit, config); 
}

export function applyPlayerHit(game) {
    if (game.state.playerCanBeHit && game.state.timeLeft > 0 && game.state.gameState === 'running') {
        console.log("Spieler getroffen! Zeit -2s");
        game.state.timeLeft -= 2; 
        if (game.state.timeLeft < 0) {
            game.state.timeLeft = 0;
        }

        game.audio.playSound('enemyHit');

        

        if (game.state.timeLeft <= 0) {
            console.log("Game Over - Zeit durch Treffer abgelaufen in Level", game.state.currentLevel);
            game.endGame(); 
            return true; 
        }

        game.state.playerCanBeHit = false;
        setTimeout(() => {
            game.state.playerCanBeHit = true;
        }, game.config.playerHitCooldown);
        return true; 
    }
    return false; 
}

export function movePlayer(game, deltaSeconds) {
    if (game.state.gameState !== 'running' || !game.canvas || !game.player) return;

    // Hole die korrekte Geschwindigkeit für dieses Level.
    // game.config.playerSpeed hat den Wert aus levelData (z.B. 4, 5, 6), was jetzt als Multiplikator dient.
    const currentSpeed = game.config.playerSpeed * 60; // Basis-Geschwindigkeit von 240px/s (4 * 60)

    // Berechne die Bewegung für diesen Frame
    // Richtung (game.player.dx) * Geschwindigkeit * Zeit
    let nextX = game.player.x + (game.player.dx * currentSpeed * deltaSeconds);
    let nextY = game.player.y + (game.player.dy * currentSpeed * deltaSeconds);

    // Canvas-Grenzen
    if (nextX < 0) nextX = 0;
    if (nextX + game.player.width > game.canvas.width) nextX = game.canvas.width - game.player.width;
    if (nextY < 0) nextY = 0;
    if (nextY + game.player.height > game.canvas.height) nextY = game.canvas.height - game.player.height;

    let canMoveX = true;
    let canMoveY = true;
    let collidedWithObstacle = false;

    const playerRectX = { x: nextX, y: game.player.y, width: game.player.width, height: game.player.height };
    const playerRectY = { x: game.player.x, y: nextY, width: game.player.width, height: game.player.height };

    // Kollision mit Hindernissen
    for (const obstacle of game.obstacles) {
        if (checkRectCollision(playerRectX, obstacle)) {
            canMoveX = false;
            collidedWithObstacle = true;
        }
        if (checkRectCollision(playerRectY, obstacle)) {
            canMoveY = false;
            collidedWithObstacle = true;
        }
    }

    // Kollision mit Gegnern
    game.enemies.forEach(enemyUnit => {
        const enemyRect = { x: enemyUnit.x, y: enemyUnit.y, width: enemyUnit.width, height: enemyUnit.height };
        if (checkRectCollision(playerRectX, enemyRect)) {
            canMoveX = false;
        }
        if (checkRectCollision(playerRectY, enemyRect)) {
            canMoveY = false;
        }
    });

    if (collidedWithObstacle) {
        game.audio.playSound('obstacleHit');
    }
    if (canMoveX) {
        game.player.x = nextX;
    }
    if (canMoveY) {
        game.player.y = nextY;
    }
}

export function checkCollisions(game) {
  // Grundlegende Sicherheitsüberprüfungen
  if (!game || !game.state || !game.player || !game.keys || !game.canvas || !game.config || !game.utils || typeof game.utils.checkRectCollision !== 'function' || !game.assets || !game.entities || typeof game.endGame !== 'function') {
    console.error("gameLogic.checkCollisions: Wichtige Teile im 'game' (gameContext) fehlen für die Kernlogik! Breche ab.", { /* ... Detail-Log ... */ });
    return;
  }

  const playerRect = { x: game.player.x, y: game.player.y, width: game.player.width, height: game.player.height };

  for (let i = game.keys.length - 1; i >= 0; i--) {
    const key = game.keys[i];
    if (!key || typeof key.x === 'undefined' || typeof key.y === 'undefined') {
      console.warn(`gameLogic.checkCollisions: Ungültiges Schlüsselobjekt im Array bei Index ${i}:`, key);
      continue;
    }
    const keyRect = { x: key.x, y: key.y, width: game.config.keySize, height: game.config.keySize };

    const collisionDetected = game.utils.checkRectCollision(playerRect, keyRect);

    if (!key.collected && collisionDetected) {
      console.log(`gameLogic.checkCollisions: Kollision mit Key ${i} (Nummer: ${key.number !== null ? key.number : 'keine'}) DETEKTIERT!`);
      let collectedThisTurn = false;

      // Hole die Level-Parameter für das aktuelle Level EINMAL hier
      const currentLevelParams = game.config.getLevelParameters(game.state.currentLevel);
      if (currentLevelParams.error) {
          console.error("checkCollisions: Konnte Level-Parameter nicht laden für Level " + game.state.currentLevel);
          return; 
      }

      // --- Logik basierend auf levelType ---
      if (currentLevelParams.levelType === 'numberedKeys') {
        if (key.number === game.state.nextKeyNumber) {
          console.log("gameLogic.checkCollisions: Korrekter nummerierter Schlüssel gesammelt.");
          collectedThisTurn = true;
          game.state.score++;
          game.state.nextKeyNumber++;

          game.audio.playSound('keyPickup');
          
          // HUD-Nachricht aktualisieren
          if (game.state.nextKeyNumber <= currentLevelParams.keyTarget) {
            if (currentLevelParams.hudGoalTemplateActive && typeof currentLevelParams.hudGoalTemplateActive.replace === 'function') {
              let message = currentLevelParams.hudGoalTemplateActive;
              message = message.replace('${keyTarget}', currentLevelParams.keyTarget);
              message = message.replace('${nextKeyNumber}', game.state.nextKeyNumber);
              game.state.levelGoalMessage = message;
            } else { game.state.levelGoalMessage = "Nächstes Ziel..."; }
          } else {
            game.state.levelGoalMessage = "Alle Schlüssel gesammelt!"; 
          }

          // Levelziel erreicht?
          if (game.state.nextKeyNumber > currentLevelParams.keyTarget) {
            console.log("gameLogic.checkCollisions: Levelziel für 'numberedKeys' erreicht.");
            game.endGame(); 
          }
        } else {
          console.log(`gameLogic.checkCollisions: Falscher nummerierter Schlüssel! Erwartet: ${game.state.nextKeyNumber}, Berührt: ${key.number}`);
          // Hier könnte man z.B. eine Strafe einführen oder einen Sound für "falsch" spielen
        }
      } else if (currentLevelParams.levelType === 'randomKeys') {
        console.log("gameLogic.checkCollisions: Schlüssel in 'randomKeys'-Level gesammelt.");
        collectedThisTurn = true;
        game.state.score++;
        game.state.levelKeysCollected++;
        game.audio.playSound('keyPickup');

        // HUD-Nachricht aktualisieren
        if (currentLevelParams.hudGoalTemplateActive && typeof currentLevelParams.hudGoalTemplateActive.replace === 'function') {
          let message = currentLevelParams.hudGoalTemplateActive;
          message = message.replace('${keyTarget}', currentLevelParams.keyTarget);
          message = message.replace('${collected}', game.state.levelKeysCollected);
          game.state.levelGoalMessage = message;
        } else { game.state.levelGoalMessage = "Sammle Schlüssel...";}
        
        // Levelziel erreicht?
        if (game.state.levelKeysCollected >= currentLevelParams.keyTarget) {
          console.log("gameLogic.checkCollisions: Levelziel für 'randomKeys' erreicht!");
          game.endGame();
        } else {
          console.log("gameLogic.checkCollisions: Rufe spawnRandomKey für 'randomKeys' Level Nachschub auf.");
          if (game.entities && typeof game.entities.spawnRandomKey === 'function') {
            game.entities.spawnRandomKey(game.keys, game.canvas, game.obstacles, game.enemies);
          } else {
            console.error("checkCollisions: game.entities.spawnRandomKey ist keine Funktion oder game.entities fehlt!");
          }
        }
      } else {
        console.error(`gameLogic.checkCollisions: Unbekannter levelType "${currentLevelParams.levelType}" in Level ${game.state.currentLevel}.`);
      }
      // --- Ende Logik basierend auf levelType ---

      if (collectedThisTurn) {
        console.log("gameLogic.checkCollisions: Schlüssel wird aus Array entfernt.");
        game.keys.splice(i, 1);
        break;
      }
    }
  }
}

export function moveEnemies(game, deltaSeconds) {
  if (game.state.gameState !== 'running' || !game.canvas) return;

  const currentLevelParams = game.config.getLevelParameters(game.state.currentLevel);
  if (currentLevelParams.error) {
    console.error("moveEnemies: Konnte Level-Parameter nicht laden für Level " + game.state.currentLevel + ". Gegnerbewegung gestoppt.");
    return; 
  }
  // Fallback, falls der Wert in levelData.js nicht gesetzt wurde (getLevelParameters sollte aber schon einen Fallback liefern)
  const actualEnemyDirectionChangeInterval = currentLevelParams.enemyDirectionChangeIntervalMs || 3000;

  game.enemies.forEach((enemyUnit, index) => {
    if (!enemyUnit) return;

    if (Date.now() - enemyUnit.lastDirectionChange > actualEnemyDirectionChangeInterval) { 
      setAggressiveDirection(enemyUnit, game.config, game.player);
    }

    let nextX = enemyUnit.x + enemyUnit.dx * deltaSeconds;
    let nextY = enemyUnit.y + enemyUnit.dy * deltaSeconds;
    const enemyRectNext = { x: nextX, y: nextY, width: enemyUnit.width, height: enemyUnit.height };
    const playerRect = { x: game.player.x, y: game.player.y, width: game.player.width, height: game.player.height };

    // Kollision mit Spieler:
    if (checkRectCollision(enemyRectNext, playerRect)) {
      applyPlayerHit(game);
      reverseEnemyDirection(enemyUnit, playerRect, game.config); // Nutzt jetzt rein zufällige Richtung
      return; 
    }

    // Kollision mit Hindernissen:
    if (game.obstacles.length > 0) {
      for (const obstacle of game.obstacles) {
        if (checkRectCollision(enemyRectNext, obstacle)) {
          reverseEnemyDirection(enemyUnit, obstacle, game.config); // Rein zufällig
          return;
        }
      }
    }

    // Kollision mit Schlüsseln:
    if (game.keys.length > 0) {
      for (const key of game.keys) {
        if (!key.collected) {
          const keyRect = { x: key.x, y: key.y, width: game.config.keySize, height: game.config.keySize };
          if (checkRectCollision(enemyRectNext, keyRect)) {
            reverseEnemyDirection(enemyUnit, keyRect, game.config); // Rein zufällig
            return;
          }
        }
      }
    }

    // Kollision mit anderen Gegnern:
    for (let j = index + 1; j < game.enemies.length; j++) {
      const otherEnemy = game.enemies[j];
      const otherEnemyRect = {x: otherEnemy.x, y: otherEnemy.y, width: otherEnemy.width, height: otherEnemy.height};
      if(checkRectCollision(enemyRectNext, otherEnemyRect)) {
        reverseEnemyDirection(enemyUnit, otherEnemyRect, game.config);
        reverseEnemyDirection(otherEnemy, enemyRectNext, game.config);
        return; 
      }
    }
    
    // Wandkollision:
    let hitWall = false;
    if ((nextX < 0 && enemyUnit.dx < 0) || (nextX + enemyUnit.width > game.canvas.width && enemyUnit.dx > 0)) {
      hitWall = true;
    }
    if ((nextY < 0 && enemyUnit.dy < 0) || (nextY + enemyUnit.height > game.canvas.height && enemyUnit.dy > 0)) {
      hitWall = true;
    }

    if(hitWall) {
      setAggressiveDirection(enemyUnit, game.config, game.player);
      enemyUnit.x = Math.max(0, Math.min(enemyUnit.x, game.canvas.width - enemyUnit.width));
      enemyUnit.y = Math.max(0, Math.min(enemyUnit.y, game.canvas.height - enemyUnit.height));
      return; 
    } else {
      enemyUnit.x += enemyUnit.dx * deltaSeconds;
        enemyUnit.y += enemyUnit.dy * deltaSeconds;
    }
  });
}

export function checkPlayerEnemyCollision(game) {
    if (game.state.gameState !== 'running' || !game.player) return; 

    const playerRect = { x: game.player.x, y: game.player.y, width: game.player.width, height: game.player.height };
    game.enemies.forEach(enemyUnit => {
        if (!enemyUnit) return;
        const enemyRect = { x: enemyUnit.x, y: enemyUnit.y, width: enemyUnit.width, height: enemyUnit.height };
        if (checkRectCollision(playerRect, enemyRect)) {
            applyPlayerHit(game);
        }
    });
}

export { setAggressiveDirection };