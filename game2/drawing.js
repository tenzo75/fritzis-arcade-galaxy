// game2/drawing.js
import { CONFIG } from './config.js';
import { ASSETS } from './assets.js';
import { drawRoundedRect } from './utils.js';
import { getHighscores } from './highscoreManager.js';

export function drawPlayer(ctx, player) {
    // 1. Spieler oder Fallback-Grafik zeichnen
    if (ASSETS.loadedImages.player) {
        ctx.drawImage(ASSETS.loadedImages.player, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "#0f0";
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            Math.min(player.width, player.height) / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // 2. Den Debug-Rahmen für die Hitbox darüber zeichnen
    if (CONFIG.debugDrawHitboxes) {
        ctx.save();
        
        const hitboxX = player.x + CONFIG.player.hitboxPadding;
        const hitboxY = player.y + CONFIG.player.hitboxPadding;
        const hitboxWidth = player.width - (CONFIG.player.hitboxPadding * 2);
        const hitboxHeight = player.height - (CONFIG.player.hitboxPadding * 2);

        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);

        ctx.restore();
    }
}

export function drawInfoOverlayElements(ctx, levelNumber) {
    // Semi-transparenter Hintergrund-Overlay für den Info-Text
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Steuerungshinweise (wie vorher besprochen)
    let yPos = CONFIG.canvasHeight / 2 - 110;
    ctx.fillStyle = "#FFFFFF"; 
    ctx.font = "30px Kalam";
    ctx.fillText("Steuerung:", CONFIG.canvasWidth / 2, yPos);
    yPos += 30;
    ctx.font = "22px Kalam";
    ctx.fillText("Pfeiltasten oder W/A/S/D", CONFIG.canvasWidth / 2, yPos);
    yPos += 35;
    
    // Punktevergabe Items (wie vorher besprochen)
    yPos += 30; 
    ctx.font = "30px Kalam";
    ctx.fillText("Punkte:", CONFIG.canvasWidth / 2, yPos);
    yPos += 30;
    ctx.font = "22px Kalam";
    ctx.fillText("Schlüssel: +1 Punkt", CONFIG.canvasWidth / 2, yPos);
    yPos += 25;
    ctx.fillText("Geld: +2 Punkte", CONFIG.canvasWidth / 2, yPos);
    yPos += 25;
    ctx.fillText("Hamster: +10 Punkte", CONFIG.canvasWidth / 2, yPos);
    yPos += 25;
    ctx.fillText("Müll: -2 Punkte", CONFIG.canvasWidth / 2, yPos);

    // Start-Aufforderung für diesen Screen
    ctx.fillStyle = "#e6695a"; 
    ctx.font = "30px Kalam";
    ctx.fillText("Enter zum Starten", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 220);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

export function drawObstacles(ctx, obstacles) {
    // Start der Schleife, die für jedes Auto einmal durchläuft
    for (let o of obstacles) {

        // 1. Das Auto-Bild zeichnen (dieser Teil war schon korrekt)
        const image = ASSETS.loadedImages[o.type];
        if (image) {
            ctx.drawImage(image, o.x, o.y, o.width, o.height);
        } else {
            ctx.fillStyle = "#f00";
            ctx.fillRect(o.x, o.y, o.width, o.height);
        }

        // 2. Den Debug-Rahmen für genau dieses Auto 'o' zeichnen
        // Dieser Block muss INNERHALB der for-Schleife sein
        if (CONFIG.debugDrawHitboxes) {
            ctx.save();

            // Lade die spezifischen Hitbox-Daten für diesen Autotyp
        const carTypeData = CONFIG.obstacleTypes[o.type];
        const carPaddingX = carTypeData.hitbox.paddingX;
        const carPaddingY = carTypeData.hitbox.paddingY;

        // Berechne den Rahmen mit den individuellen Werten
        const hitboxX = o.x + carPaddingX;
        const hitboxY = o.y + carPaddingY;
        const hitboxWidth = o.width - (carPaddingX * 2);
        const hitboxHeight = o.height - (carPaddingY * 2);

            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
            
            ctx.restore();
        }

    } // Ende der for-Schleife. Alles, was 'o' verwendet, muss davor stehen.
}

export function drawCollectibles(ctx, collectibles) {
    if (!collectibles || collectibles.length === 0) {
         return; 
    }
    
    for (let i = 0; i < collectibles.length; i++) {
        const item = collectibles[i];
        
         // Prüfe, ob alle benötigten Eigenschaften für das Zeichnen vorhanden und gültig sind
        if (item && 
            typeof item.x === 'number' && 
            typeof item.y === 'number' &&
            typeof item.width === 'number' && item.width > 0 &&  // Breite muss eine positive Zahl sein
            typeof item.height === 'number' && item.height > 0 && // Höhe muss eine positive Zahl sein
            typeof item.imageAssetKey === 'string' && item.imageAssetKey.length > 0) { // imageAssetKey muss ein nicht-leerer String sein

            const imageToDraw = ASSETS.loadedImages[item.imageAssetKey];

            if (imageToDraw) {
               
                ctx.drawImage(
                    imageToDraw,
                    item.x,
                    item.y,
                    item.width,  // Individuelle Breite des Objekts
                    item.height  // Individuelle Höhe des Objekts
                );
            } else {
                // Fallback-Grafik, falls das spezifische Bild nicht geladen wurde
                let fallbackColor = "#FFFF00"; // Gelb für unbekannt oder Standard-Schlüssel
                if (item.type === 'money') {
                    fallbackColor = "#00FF00"; // Grün für Geld
                } else if (item.type === 'trash') {
                    fallbackColor = "#FF0000"; // Rot für Müll
                }
                
                console.warn(`    --> Bild für Sammelobjekt-Typ '${item.type}' (Asset Key: '${item.imageAssetKey}') NICHT gefunden. Zeichne Fallback-Rechteck in ${fallbackColor} bei x:${Math.round(item.x)}, y:${Math.round(item.y)}.`); // DEBUG-LOG: Fallback wird genutzt
                ctx.fillStyle = fallbackColor;
                ctx.fillRect(item.x, item.y, item.width, item.height);
            }
        } else {
            // Wenn eines der Attribute fehlt oder ungültig ist
            console.warn("  -> Sammelobjekt im Array hat ungültige oder fehlende Eigenschaften zum Zeichnen:", item); // DEBUG-LOG: Problem mit Item-Daten
        }
    }
}

export function drawScore(ctx, currentScore, lives, distance) {
    // Zeichne einen halbtransparenten Balken als Hintergrund für das HUD
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Dunkler, halbtransparenter Hintergrund
    ctx.fillRect(0, 0, CONFIG.canvasWidth, 30); // Höhe des Balkens anpassen, falls nötig

    // Setze die Schrift-Eigenschaften
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px Kalam";
    ctx.textBaseline = "top";

    // Berechne die Texte
    const livesText = `❤️ Leben: ${lives}`;
    const scoreText = `💰 Punkte: ${currentScore}`;

    const meters = Math.floor(distance * CONFIG.distanceToMetersFactor);
    let distanceValueText = "";
    if (meters < 1000) {
        distanceValueText = `${meters} m`;
    } else {
        const kilometers = (meters / 1000).toFixed(1).replace('.', ',');
        distanceValueText = `${kilometers} km`;
    }
    const distanceText = `📏 Strecke: ${distanceValueText}`;

    // HIER IST DIE ANPASSUNG
    // 4. Zeichne die Texte nebeneinander
    const paddingY = 12; // Steuert den Abstand nach OBEN
    const paddingX = 180; // Steuert den Abstand zu den SEITEN (größere Zahl = weiter zur Mitte)

    // Leben (linksbündig)
    ctx.textAlign = "left";
    ctx.fillText(livesText, paddingX, paddingY);

    // Strecke (zentriert)
    ctx.textAlign = "center";
    ctx.fillText(distanceText, CONFIG.canvasWidth / 2, paddingY);

    // Punkte (rechtsbündig)
    ctx.textAlign = "right";
    ctx.fillText(scoreText, CONFIG.canvasWidth - paddingX, paddingY);

    // Wichtig: Textausrichtung für den Rest des Spiels zurücksetzen
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

export function drawFinishLine(ctx, finishLine) {
    if (!finishLine.isActive) return;

    // Zeichne einen halbtransparenten Balken
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(finishLine.x, finishLine.y, finishLine.width, finishLine.height);

    // Zeichne den Text darauf
    ctx.fillStyle = "#FFD700"; // Goldene Schrift
    ctx.font = "40px Kalam";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(finishLine.text, finishLine.x + finishLine.width / 2, finishLine.y + finishLine.height / 2);
    
    // Wichtig: Textausrichtung zurücksetzen
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

export function drawGameOverSummaryScreen(ctx, score, distance, finalScore, wasHighscore) {
    const canvas = ctx.canvas;

    // Hintergrund
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titel
    ctx.fillStyle = '#FFD700'; // Gold für den Ergebnis-Screen
    ctx.font = 'bold 50px Kalam';
    ctx.textAlign = 'center';
    ctx.fillText('Ergebnis', canvas.width / 2, 120);

    // Score-Aufschlüsselung
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '28px Kalam';
    let yPos = 220;
    const kilometers = (distance * CONFIG.distanceToMetersFactor) / 1000;
    const distanceBonus = Math.floor(score * kilometers);
    ctx.fillText(`Gesammelte Punkte: ${score}`, canvas.width / 2, yPos);
    yPos += 45;
    const kilometersText = kilometers.toFixed(1).replace('.', ',');
    ctx.fillText(`Bonus = Punkte (${score}) x Strecke (${kilometersText} km): +${distanceBonus}`, canvas.width / 2, yPos);
    yPos += 60;
    ctx.font = 'bold 36px Kalam';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(`Finaler Score: ${finalScore}`, canvas.width / 2, yPos);
    yPos += 60;

    // Highscore-Hinweis
    if (wasHighscore) {
        ctx.fillStyle = '#90EE90'; // Grün für Erfolg
        ctx.fillText('🎉 Neuer Highscore! 🎉', canvas.width / 2, yPos);
    } else {
        ctx.fillStyle = '#FF4444'; // Rot
        ctx.fillText('Kein neuer Highscore', canvas.width / 2, yPos);
    }
    yPos += 80;
    
    // Hinweistext
    ctx.font = '24px Kalam';
    ctx.fillStyle = '#e6695a';
    ctx.fillText("Drücke Enter zum Fortfahren", canvas.width / 2, yPos);

    ctx.textAlign = 'left'; // Zurücksetzen
}

export function drawBackground(ctx, currentBackgroundX) {
    const bgImage = ASSETS.loadedImages.street;

    if (bgImage && bgImage.width > 0 && bgImage.height > 0) {
        const originalTileWidth = bgImage.width;
        const originalTileHeight = bgImage.height;

        // Skaliere die Kachelhöhe auf die Canvas-Höhe unter Beibehaltung des Seitenverhältnisses
        const tileDrawnHeight = CONFIG.canvasHeight;
        const scaleRatio = tileDrawnHeight / originalTileHeight;
        const tileDrawnWidth = originalTileWidth * scaleRatio;

        if (tileDrawnWidth <= 0) { // Sicherheitsprüfung, falls Bilddimensionen ungültig sind
            return;
        }

        // Berechne die Start-X-Position für die erste zu zeichnende Kachel,
        // sodass der Hintergrund nahtlos scrollt.
        let startX = currentBackgroundX % tileDrawnWidth;
        // Wenn currentBackgroundX negativ wird (Scroll nach links), ist startX negativ oder 0.
        // Wenn currentBackgroundX (durch += tileDrawnWidth Reset) leicht positiv wäre,
        // würde dies sicherstellen, dass wir links von x=0 zu zeichnen beginnen, falls nötig.
        if (startX > 0) {
            startX -= tileDrawnWidth;
        }

        for (let x = startX; x < CONFIG.canvasWidth; x += tileDrawnWidth) {
         ctx.drawImage(
        bgImage,
        0, 0,
        originalTileWidth, originalTileHeight,
        Math.round(x), 0,
        Math.round(tileDrawnWidth),
        tileDrawnHeight
    );
}
    } else {
        // Fallback, falls das Hintergrundbild nicht geladen wurde
        ctx.fillStyle = "#333"; // Dunkelgrau als Beispiel
        ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    }
}

export function drawGameMenu(ctx, menuItems, currentMenuItemIndex) {
    const canvas = ctx.canvas;

    // Hintergrund
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Design-Werte für die Buttons ---
    const xPos_links = canvas.width / 2 - 350;
    const xPos_rechts = canvas.width / 2 + 250;
    const startY = canvas.height / 2 + 50;
    const lineHeight = 90;      // Vertikaler Abstand zwischen den Buttons
    const buttonWidth = 200;    // Breite der Buttons
    const buttonHeight = 50;     // Höhe der Buttons
    const buttonRadius = 20;     // Rundung der Ecken

    menuItems.forEach((item, index) => {
        let currentX;
        let currentY;

        // Position berechnen
        if (index === 0) {
            currentX = xPos_links;
            currentY = startY;
        } else {
            currentX = xPos_rechts;
            const rightColumnIndex = index - 1;
            currentY = startY + (rightColumnIndex * lineHeight);
        }

        const buttonX = currentX - (buttonWidth / 2);
        const buttonY = currentY - (buttonHeight / 2);

        // --- NEUES FARB-DESIGN FÜR BUTTONS ---
        if (index === currentMenuItemIndex) {
            // Stil für den AUSGEWÄHLTEN Button
            ctx.fillStyle = '#f18f47'; // Helleres, leicht transparentes Pink
            ctx.strokeStyle = '#FFFFFF'; // Leuchtend weißer Rahmen
            ctx.lineWidth = 3;
        } else {
            // Stil für NORMALE Buttons
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Dunkler, neutraler Hintergrund
            ctx.strokeStyle = '#45B8AC'; // Türkis vom Fahrrad als Rahmenfarbe
            ctx.lineWidth = 2;
        }
        
        drawRoundedRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, buttonRadius);
        ctx.fill();
        ctx.stroke();

        // --- Text auf den Button zeichnen ---
        ctx.font = '32px Kalam';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF'; // Weißer Text für besten Kontrast
        ctx.fillText(item.text, currentX, currentY + 4); // Mit deiner manuellen Y-Korrektur
    });

    // --- Steuerungshinweis auf zwei Zeilen für bessere Lesbarkeit ---
    const hintText1 = "Navigation: Pfeiltasten";
    const hintText2 = "Auswahl: Enter";
    const hintY1 = startY + (buttonHeight / 2) + 30; // Y-Position für die erste Zeile
    const hintY2 = hintY1 + 25; // Y-Position für die zweite Zeile (25px darunter)
    
    ctx.font = '18px Kalam';
    ctx.textAlign = 'center';
    
    // --- Erste Zeile zeichnen ---
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeText(hintText1, xPos_links, hintY1);
    ctx.fillStyle = '#005A8D';
    ctx.fillText(hintText1, xPos_links, hintY1);

    // --- Zweite Zeile zeichnen ---
    ctx.strokeText(hintText2, xPos_links, hintY2);
    ctx.fillStyle = '#005A8D';
    ctx.fillText(hintText2, xPos_links, hintY2);
}

export function drawGameInstructions(ctx) {
    const canvas = ctx.canvas;
    const windowWidth = 950;
    const windowHeight = 560;
    const x = (canvas.width - windowWidth) / 2;
    const y = (canvas.height - windowHeight) / 2;

    // Hintergrund-Box zeichnen
    drawRoundedRect(ctx, x, y, windowWidth, windowHeight, 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#e6695a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Anleitungstext direkt hier definieren
    const anleitung = {
        titel: "Anleitung: Flinke Fritzi - Tour durch Los Santos",
    inhalt: [ // Statt eines HTML-Strings jetzt ein Array von Objekten
        { text: "Starte mit Fritzi in den Tag und steuere sie durch den dichten Verkehr von Los Santos! Fahre soweit" },
        { text: "wie du kommst und Sammel dabei soviele Punkte wie möglich! Der Verkehr wird sich in Etappen erhöhen." },
        { text: "Weil Fritzi keine Katze ist, hat sie nur 3 Leben, pass also gut auf sie auf!" },
        { text: "Nach jeder Kollision startet die aktuelle Etappe neu." },
        { text: "" }, // Leere Zeile für Abstand
        { text: "Die Steuerung:", style: 'bold'},
        { text: "• Benutze die Pfeiltasten oder W, A, S, D, um Fritzi zu bewegen", indent: 30 },
        { text: "• Drücke die 'P'-Taste, um das Spiel zu pausieren und die 'N'-Taste, um das Spiel neu zu Starten", indent: 30 },
        { text: "• Drücke die 'ESC'-Taste, um zum Hauptmenü zu kommen", indent: 30 },
        { text: "" },
        { text: "Punkte:", style: 'bold' },
        { text: "Schlüssel: +1 Punkt          Geld: +2 Punkte          Hamster: +10 Punkte          Müll: -2 Punkte" },
    
    ]
    };

    // Titel
    ctx.fillStyle = '#e6695a';
    ctx.font = 'bold 30px Kalam';
    ctx.textAlign = 'center';
    ctx.fillText(anleitung.titel, canvas.width / 2, y + 40);

    // Inhalt
    ctx.textAlign = 'left';
    let currentY = y + 90;
    const startX = x + 30;
    const lineHeight = 30;

    for (const line of anleitung.inhalt) {
        let font = '20px Kalam';
        if (line.style === 'bold') font = 'bold 22px Kalam';
        if (line.style === 'italic') font = 'italic 20px Kalam';
        ctx.font = font;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line.text, startX + (line.indent || 0), currentY);
        currentY += lineHeight;
    }

    // Hinweis zum Zurückkehren
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e6695a';
    ctx.font = 'bold 25px Kalam';
    ctx.fillText('Drücke Enter', canvas.width / 2, y + windowHeight - 40);
}

export function drawLocalHighscores(ctx, highscoreData) {
    const canvas = ctx.canvas;
    const windowWidth = 800;
    const windowHeight = 500;
    const x = (canvas.width - windowWidth) / 2;
    const y = (canvas.height - windowHeight) / 2;
    const scores = highscoreData.slice(0, 10);

    drawRoundedRect(ctx, x, y, windowWidth, windowHeight, 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#e6695a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e6695a';
    ctx.font = 'bold 30px Kalam';
    ctx.textAlign = 'center';
    ctx.fillText('Lokale Top 10 Highscores', canvas.width / 2, y + 40);

    ctx.font = 'bold 22px Kalam';
    ctx.fillStyle = '#FFFFFF';
    let yPos = y + 90;
    const xPlatz = x + 80, xName = x + 180, xStrecke = x + 480, xPunkte = x + 680;
    ctx.textAlign = 'left';
    ctx.fillText('Platz', xPlatz, yPos);
    ctx.fillText('Name', xName, yPos);
    ctx.textAlign = 'center';
    ctx.fillText('Strecke', xStrecke, yPos);
    ctx.textAlign = 'right';
    ctx.fillText('Punkte', xPunkte, yPos);

    ctx.font = '20px Kalam';
    yPos += 40;
    const lineHeight = 30;
    
    if (scores.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillText("Noch keine Highscores vorhanden.", canvas.width / 2, yPos + 50);
    } else {
        scores.forEach((entry, index) => {
            const rank = index + 1;
            ctx.textAlign = 'center';
            ctx.fillText(`${rank}.`, xPlatz, yPos);
            ctx.textAlign = 'left';
            ctx.fillText(entry.name, xName, yPos);
            ctx.textAlign = 'center';
            ctx.fillText(entry.distance + " km", xStrecke, yPos);
            ctx.textAlign = 'right';
            ctx.fillText(entry.finalScore, xPunkte, yPos);
            yPos += lineHeight;
        });
    }

    ctx.textAlign = 'center';
    ctx.font = '22px Kalam';
    ctx.fillStyle = '#e6695a';
    ctx.fillText('Enter zum Verlassen', canvas.width / 2, y + windowHeight - 30);
}

export function drawOnlineHighscores(ctx, highscoreData, currentPage) {
    const canvas = ctx.canvas;
    const windowWidth = 800;
    const windowHeight = 500;
    const x = (canvas.width - windowWidth) / 2;
    const y = (canvas.height - windowHeight) / 2;
    const scores = highscoreData || [];
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(scores.length / itemsPerPage));

    drawRoundedRect(ctx, x, y, windowWidth, windowHeight, 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#e6695a";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#e6695a';
    ctx.font = 'bold 30px Kalam';
    ctx.textAlign = 'center';
    ctx.fillText('Online Top 50 Highscores', canvas.width / 2, y + 40);

    ctx.font = 'bold 22px Kalam';
    ctx.fillStyle = '#FFFFFF';
    let yPos = y + 90;
    const xPlatz = x + 80, xName = x + 180, xStrecke = x + 480, xPunkte = x + 680;
    ctx.textAlign = 'left';
    ctx.fillText('Platz', xPlatz, yPos);
    ctx.fillText('Name', xName, yPos);
    ctx.textAlign = 'center';
    ctx.fillText('Strecke', xStrecke, yPos);
    ctx.textAlign = 'right';
    ctx.fillText('Punkte', xPunkte, yPos);
    
    ctx.font = '20px Kalam';
    yPos += 40;
    const lineHeight = 30;
    const startIndex = currentPage * itemsPerPage;
    const pageScores = scores.slice(startIndex, startIndex + itemsPerPage);

    if (pageScores.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillText("Noch keine Highscores vorhanden.", canvas.width / 2, yPos + 50);
    } else {
        pageScores.forEach((entry, index) => {
            const rank = startIndex + index + 1;
            ctx.textAlign = 'center';
            ctx.fillText(`${rank}.`, xPlatz, yPos);
            ctx.textAlign = 'left';
            ctx.fillText(entry.name, xName, yPos);
            ctx.textAlign = 'center';
            ctx.fillText(entry.distance + " km", xStrecke, yPos);
            ctx.textAlign = 'right';
            ctx.fillText(entry.finalScore, xPunkte, yPos);
            yPos += lineHeight;
        });
    }
    
    ctx.textAlign = 'center';
    ctx.font = '22px Kalam';
    ctx.fillStyle = '#e6695a';
    ctx.fillText(`Seite ${currentPage + 1} / ${totalPages}`, canvas.width / 2, y + windowHeight - 60);
    ctx.font = '18px Kalam';
    ctx.fillText('Pfeiltasten zum Blättern | Enter zum Verlassen', canvas.width / 2, y + windowHeight - 30);
}

export function drawNameInputScreen(ctx, currentName, finalScore) {
    const canvas = ctx.canvas;

    // Hintergrund & Rahmen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
   // ctx.strokeStyle = '#e6695a';
   // ctx.lineWidth = 2;
   // ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    // Titel
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px Kalam';
    ctx.textAlign = 'center';
    ctx.fillText('Neuer Highscore!', canvas.width / 2, 120);
    
    // Finalen Score nochmal anzeigen
    ctx.font = 'bold 32px Kalam';
    ctx.fillStyle = '#f18f47';
    ctx.fillText(`Finaler Score: ${finalScore}`, canvas.width / 2, 180);

    // Eingabeaufforderung
    let yPos = 250;
    ctx.font = '22px Kalam';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Gib deinen Namen ein (max. 15 Zeichen):', canvas.width / 2, yPos);

    // Eingegebener Name mit Cursor
    ctx.font = 'bold 40px "Courier New", Courier, monospace';
    ctx.fillStyle = '#90EE90';
    let displayName = currentName + (Math.floor(Date.now() / 500) % 2 ? '_' : ' ');
    ctx.fillText(displayName, canvas.width / 2, yPos + 50);

    // Hinweis zum Speichern
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e6695a';
    ctx.font = '25px Kalam';
    ctx.fillText('Enter zum Speichern', canvas.width / 2, canvas.height - 80);

    ctx.textAlign = 'left'; // Zurücksetzen
}