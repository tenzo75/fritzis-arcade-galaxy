// game1/drawing.js

import { 
    playerImage, playerImageLoaded,
    keyImage, keyImageLoaded,
    obstacleImage, obstacleImageLoaded,
    enemyImage, enemyImageLoaded
} from './assets.js';

import { 
    keySize,
    obstacleColor,
    obstacleImageWidth,
    obstacleImageHeight, FONT_FAMILY_MAIN, FONT_FAMILY_TEXT, FONT_FAMILY_MONO
} from './config.js';

function drawFallbackPlayer(ctx, playerObject) {
    if (!ctx || !playerObject) return;
    ctx.fillStyle = playerObject.color;
    ctx.fillRect(playerObject.x, playerObject.y, playerObject.width, playerObject.height);
    ctx.fillStyle = '#f1c40f'; 
    ctx.fillRect(playerObject.x + playerObject.width / 4, playerObject.y + playerObject.height / 4, playerObject.width / 2, playerObject.width / 2);
}

function drawFallbackKey(ctx, keyObject) {
    if (!ctx || !keyObject) return;
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(keyObject.x, keyObject.y, keySize, keySize);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(keyObject.x + keySize / 4, keyObject.y + keySize * 0.8, keySize / 2, keySize / 3);
}

function drawFallbackObstacle(ctx, obstacle) {
    if (!ctx || !obstacle) return;
    ctx.fillStyle = obstacleColor;
    if (typeof obstacle.x === 'number') { 
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width || obstacleImageWidth, obstacle.height || obstacleImageHeight);
    }
}

function drawFallbackEnemy(ctx, enemyUnit) {
    if (!ctx || !enemyUnit) return;
    ctx.fillStyle = 'orange';
    ctx.fillRect(enemyUnit.x, enemyUnit.y, enemyUnit.width, enemyUnit.height);
    ctx.fillStyle = 'black'; 
    ctx.fillRect(enemyUnit.x + enemyUnit.width * 0.6, enemyUnit.y + enemyUnit.height * 0.2, 5, 5);
}

export function drawPlayer(ctx, playerObject) {
    if (!ctx || !playerObject) return;
    if (playerImageLoaded) {
        try {
            ctx.drawImage(playerImage, playerObject.x, playerObject.y, playerObject.width, playerObject.height);
        } catch (imgError) {
            console.error("Fehler Spielerbild:", imgError);
            drawFallbackPlayer(ctx, playerObject);
        }
    } else {
        drawFallbackPlayer(ctx, playerObject);
    }
}

export function drawKey(ctx, keyObject, levelType) {
    if (!ctx || !keyObject) return;
    if (keyImageLoaded) {
        try {
            ctx.drawImage(keyImage, keyObject.x, keyObject.y, keySize, keySize);
        } catch (imgError) {
            console.error("Fehler Schlüsselbild:", imgError);
            drawFallbackKey(ctx, keyObject);
        }
    } else {
        drawFallbackKey(ctx, keyObject);
    }

    // Nummer auf Schlüssel zeichnen
    if (levelType === 'numberedKeys' && typeof keyObject.number === 'number') { 
    ctx.fillStyle = '#F0EAD6';     
    ctx.strokeStyle = 'black'; 
    ctx.lineWidth = 2;
    ctx.font = `bold 16px ${FONT_FAMILY_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textX = keyObject.x + keySize / 2 +8;
    const textY = keyObject.y + keySize / 2 +9;
    ctx.strokeText(keyObject.number, textX, textY);
    ctx.fillText(keyObject.number, textX, textY);
  }
}

export function drawObstacles(ctx, obstaclesArray) {
    if (!ctx || !obstaclesArray) return;
    obstaclesArray.forEach(obstacle => {
        if (obstacleImageLoaded) {
            try {
                ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } catch (imgError) {
                console.error("Fehler Hindernisbild:", imgError);
                drawFallbackObstacle(ctx, obstacle);
            }
        } else {
            drawFallbackObstacle(ctx, obstacle);
        }
    });
}

export function drawEnemies(ctx, enemiesArray) {
    if (!ctx || !enemiesArray) return;
    enemiesArray.forEach(enemyUnit => {
        if (!enemyUnit) return; 
        if (enemyImageLoaded) {
            try {
                ctx.drawImage(enemyImage, enemyUnit.x, enemyUnit.y, enemyUnit.width, enemyUnit.height);
            } catch (e) {
                console.error("Fehler Gegnerbild:", e);
                drawFallbackEnemy(ctx, enemyUnit);
            }
        } else {
            drawFallbackEnemy(ctx, enemyUnit);
        }
    });
}

export function drawScore(ctx, score) {
    if (!ctx) return;
    ctx.font = `bold 22px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Score: ${score}`, 200, 15);
}

export function drawTime(ctx, timeLeft) {
    if (!ctx) return;
    ctx.font = `bold 22px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    if (timeLeft <= 10 && timeLeft > 0) { 
    ctx.fillStyle = "red"; // Oder eine andere Warnfarbe, z.B. '#FF6347' (Tomato)
  } else if (timeLeft <= 0) {
    ctx.fillStyle = "darkred"; // Optional: Andere Farbe für "Zeit abgelaufen", bevor der Screen wechselt
  }
  else {
    ctx.fillStyle = "white";
  }
    ctx.fillText(`Zeit: ${Math.max(0, timeLeft)}s`, ctx.canvas.width - 200, 15);
}

export function drawLevel(ctx, currentLevel) {
    if (!ctx) return;
    ctx.font = `bold 22px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`Level: ${currentLevel}`, ctx.canvas.width / 2, 15);
}

export function drawGoal(ctx, goalText, isHighlighted = false) { 
    if (!ctx || !goalText) return;
    ctx.font = `20px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = isHighlighted ? "#FFFF00" : "white"; // Gelb wenn hervorgehoben, sonst weiß
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom"; // Zielanzeige unten mittig
    ctx.fillText(goalText, ctx.canvas.width / 2, ctx.canvas.height - 10);
}
