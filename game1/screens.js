// game1/screens.js

import { FONT_FAMILY_MAIN, FONT_FAMILY_TEXT, FONT_FAMILY_MONO } from './config.js';
import { getHighScores } from './highscore.js';
import { drawRoundedRect } from './utils.js';

export function drawGameStartScreen(ctx, canvas, gameContext, startScreenState, selectedMenuItemIndex, animationValues) {
    const assets = gameContext.assets;

    if (!ctx || !canvas || !assets) {
        console.error("drawGameStartScreen: Wichtige Parameter fehlen!");
        return;
    }

    const TITLE_IMG_WIDTH = 500;
    const TITLE_IMG_HEIGHT = 500;
    const TITLE_X_OFFSET = +50;
    const TITLE_Y_OFFSET = -160;
    
    const canvasCenterX = canvas.width / 2;
    const titleBaseY = animationValues.titleY; 
    const titleHoverOffset = animationValues.titleHover;

    // --- HINTERGRUND-CHARAKTERE ---
    if (assets.fritziStartImage && assets.fritziStartImageLoaded()) {
        ctx.drawImage(assets.fritziStartImage, animationValues.fritziX, 290, 250, 250);
    }
    if (assets.hamsterStartImage && assets.hamsterStartImageLoaded()) {
        ctx.drawImage(assets.hamsterStartImage, 70, animationValues.hamsterY, 100, 100);
    }
    
    // --- TITEL-BILD ZEICHNEN ---
    if (assets.titleImage && assets.titleImageLoaded()) {
        const xPos = canvasCenterX - (TITLE_IMG_WIDTH / 2) + TITLE_X_OFFSET;
        const yPos = titleBaseY - (TITLE_IMG_HEIGHT / 2) + titleHoverOffset + TITLE_Y_OFFSET;
        ctx.globalAlpha = animationValues.titleOpacity;
        ctx.drawImage(assets.titleImage, xPos, yPos, TITLE_IMG_WIDTH, TITLE_IMG_HEIGHT);
        ctx.globalAlpha = 1.0;
    }

    // --- Menü-Logik ---
    switch (startScreenState) {
        case 'menu':
            drawMainMenu(ctx, canvas, selectedMenuItemIndex, animationValues);
            break;
        case 'anleitung_zeigen':
            drawAnleitungOverlay(ctx, canvas);
            break;
        case 'highscore_zeigen':
      if (gameContext.state.storageMode === 'supabase') {
          // highscorePage wird jetzt aus dem gameContext geholt und übergeben
          drawOnlineHighscoreOverlay(ctx, canvas, gameContext.highscoreData, gameContext.state.highscorePage);
      } else {
          drawLocalHighscoreOverlay(ctx, canvas, gameContext.highscoreData);
      }
      break;
    }
}

export function drawLevelSummaryScreen(ctx, canvas, levelStartMessage, previousLevelSummaryText, levelGoalMessage) {
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#F0EAD6"; // Ihre Farb-Einstellung
    ctx.textAlign = 'center';
    let currentY = canvas.height / 2 - 200;
    
    // Haupttitel
    ctx.fillStyle = "#E3B878";
    ctx.font = `bold 50px ${FONT_FAMILY_MAIN}`; 
    ctx.fillText(levelStartMessage, canvas.width / 2, currentY);
    ctx.fillStyle = "#F0EAD6";
    currentY += 80;

    const allLines = levelGoalMessage.split('\n');
    let subHeader = null;
    let detailLines = [];

    // 1. Prüfen, ob eine "Es folgt..."-Überschrift vorhanden ist
    if (allLines[0].startsWith("Es folgt:")) {
        // Fall A: Wir sind ZWISCHEN den Leveln
        subHeader = allLines[0];
        detailLines = allLines.slice(1); 
    } else {
        detailLines = allLines;
    }

    // 2. Zeichne die "Es folgt..."-Überschrift, FALLS sie existiert
    if (subHeader) {
        ctx.font = `bold 35px ${FONT_FAMILY_MAIN}`; 
        ctx.fillStyle = "#F0EAD6"; // Ihre Farbe
        ctx.fillText(subHeader, canvas.width / 2, currentY);
        currentY += 30;
    }
    
    // 3. Zeichne die Detail-Liste (linksbündig-zentriert), falls vorhanden
    if (detailLines.length > 0) {
        const lineHeight = 30;
        let maxWidth = 0;
        
        // Längste Zeile finden (mit Ihrer Schriftgröße)
        detailLines.forEach(line => {
            if (line.trim() !== '') {
                ctx.font = `22px ${FONT_FAMILY_MAIN}`; 
                const metrics = ctx.measureText(line);
                if (metrics.width > maxWidth) {
                    maxWidth = metrics.width;
                }
            }
        });

        const startX = canvas.width / 2 - maxWidth / 2;
        ctx.textAlign = 'left';
        ctx.font = `22px ${FONT_FAMILY_MAIN}`;
        
        for (let i = 0; i < detailLines.length; i++) {
            if (detailLines[i].trim() !== '') {
                ctx.fillText(detailLines[i], startX, currentY + i * lineHeight);
            }
        }
        currentY += (detailLines.length) * lineHeight;
        ctx.textAlign = 'center'; 
    }

    // Punkte-Anzeige (bleibt wie in Ihrer Version am Ende)
    if (previousLevelSummaryText) {
        currentY += 60; // Angepasster Abstand
        ctx.font = `30px ${FONT_FAMILY_MAIN}`;
        ctx.fillStyle = '#E3B878';
        ctx.fillText(previousLevelSummaryText, canvas.width / 2, currentY);
    }
        
    // Untere Texte mit fester Position (bleiben wie in Ihrer Version)
    const enterY = canvas.height - 100;
    ctx.font = `bold 25px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = '#F0EAD6';
    ctx.fillText("Drücke Enter zum Fortfahren...", canvas.width / 2, enterY);
    
    const controlsY = canvas.height - 60;
    ctx.font = `17px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = '#F0EAD6';
    ctx.fillText("Steuerung im Spiel: Pfeile oder WASD (Bewegen)   |   P (Pause)   |   N (Neustart)", canvas.width / 2, controlsY);
}

export function drawGameOverScreen(ctx, canvas, finalScore, finalLevel, isNewHighscore) {
    if (!ctx || !canvas) return;

    // "Game Over" Text
    ctx.fillStyle = "#E3B878";
    ctx.font = `50px ${FONT_FAMILY_MAIN}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 100);

    // Level und Punkte anzeigen
    ctx.fillStyle = "#F0EAD6";
    ctx.font = `30px ${FONT_FAMILY_MAIN}`;
    ctx.fillText(`Erreichtes Level: ${finalLevel}`, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`Punkte: ${finalScore}`, canvas.width / 2, canvas.height / 2 + 10);

    // Zeige den Highscore-Hinweis an, falls zutreffend
    if (isNewHighscore) {
        ctx.fillStyle = "#FFD700";
        ctx.font = `bold 35px ${FONT_FAMILY_MAIN}`;
        ctx.fillText("🎉 Neuer Highscore! 🎉", canvas.width / 2, canvas.height / 2 + 60);
    } else {
        ctx.fillStyle = "#F0EAD6"; // Normale Farbe
        ctx.font = `25px ${FONT_FAMILY_MAIN}`;
        ctx.fillText("Kein neuer Highscore!", canvas.width / 2, canvas.height / 2 + 60);
    }

    // Hinweistext für die Tastatursteuerung
    ctx.font = `25px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "#F0EAD6";
    ctx.fillText("Enter = Neustart  |  ESC = Zurück zum Intro", canvas.width / 2, canvas.height / 2 + 130);
}

export function drawWinScreen(ctx, canvas, finalScore, isNewHighscore) {
    if (!ctx || !canvas) return;

    // "GEWONNEN!" Text
    ctx.fillStyle = "#FFD700"; // Goldene Schrift
    ctx.font = `50px ${FONT_FAMILY_MAIN}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎉 SPIEL GEWONNEN! 🎉", canvas.width / 2, canvas.height / 2 - 100);

    // Punkte anzeigen
    ctx.font = `30px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "#F0EAD6";
    ctx.fillText(`Endpunktestand: ${finalScore}`, canvas.width / 2, canvas.height / 2 - 10);
    // Optional könntest du hier noch eine Abschlussnachricht hinzufügen

    // Zeige den Highscore-Hinweis an, falls zutreffend
    if (isNewHighscore) {
        ctx.fillStyle = "#FFD700";
        ctx.font = `bold 35px ${FONT_FAMILY_MAIN}`;
        ctx.fillText("🎉 Neuer Highscore! 🎉", canvas.width / 2, canvas.height / 2 + 60);
    } else {
        ctx.fillStyle = "#F0EAD6"; // Normale Farbe
        ctx.font = `25px ${FONT_FAMILY_MAIN}`;
        ctx.fillText("Kein neuer Highscore.", canvas.width / 2, canvas.height / 2 + 60);
    }

    // Hinweistext für die Tastatursteuerung
    ctx.font = `25px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "#F0EAD6";
    ctx.fillText("Enter = Neustart  |  ESC = Zurück zum Intro", canvas.width / 2, canvas.height / 2 + 130);
}

export function drawPauseScreen(ctx, canvas) {
    if (!ctx || !canvas) return;

    // Leicht abgedunkelter Overlay über dem pausierten Spielgeschehen
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // "PAUSE"-Text
    ctx.fillStyle = "white";
    ctx.font = `bold 60px ${FONT_FAMILY_MAIN}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);

    // Hinweistext
    ctx.font = `20px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Drücke P, um fortzufahren", canvas.width / 2, canvas.height / 2 + 50);
}

function drawMainMenu(ctx, canvas, selectedMenuItemIndex, animationValues) {
    const menuItems = ["Spiel starten", "Highscore", "Anleitungen"];
    const canvasCenterX = canvas.width / 2 - 165;
    const startY = canvas.height / 2 + 40;
    const lineHeight = 50;
    
    // Basisschriftgröße und Puls-Wert aus den AnimationValues holen
    const baseFontSize = 32;
    const pulseSize = animationValues.menuPulseSize || 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    menuItems.forEach((item, index) => {
        let displayText = item;
        let dynamicFontSize = baseFontSize; 

        if (index === selectedMenuItemIndex) {
            ctx.fillStyle = "yellow";
            displayText = `> ${item} <`;
            // Wende den Puls-Effekt nur auf den ausgewählten Punkt an
            dynamicFontSize += pulseSize; 
        } else {
            ctx.fillStyle = "white";
        }
        
        // Setze die Schriftgröße für jeden Menüpunkt individuell
        ctx.font = `${dynamicFontSize}px ${FONT_FAMILY_MAIN}`;
        
        ctx.fillText(displayText, canvasCenterX, startY + index * lineHeight);
    });
    
    ctx.font = `15px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("Benutze ↑ ↓ zum Navigieren und Enter zur Auswahl", canvasCenterX, startY + menuItems.length * lineHeight + 70);
    ctx.fillText("ESC - Zurück zum Intro", canvasCenterX, startY + menuItems.length * lineHeight + 95);
}

export function drawEnterHighscoreScreen(ctx, canvas, score, currentName) {
    // Fenstergröße 
    const windowWidth = 600;
    const windowHeight = 350;
    const x = (canvas.width - windowWidth) / 2;
    const y = (canvas.height - windowHeight) / 2;
    const centerX = x + windowWidth / 2;

    // Hintergrund-Box zeichnen
    drawRoundedRect(ctx, x, y, windowWidth, windowHeight, 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#FFD700"; // Goldener Rand für den Anlass
    ctx.lineWidth = 3;
    ctx.stroke();

    // Titel
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.font = `bold 40px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Neuer Highscore!", centerX, y + 60);

    // Score anzeigen
    ctx.fillStyle = "#F0EAD6";
    ctx.font = `30px ${FONT_FAMILY_MAIN}`;
    ctx.fillText(`Dein Score: ${score}`, centerX, y + 120);

    // Eingabeaufforderung
    ctx.font = `18px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Gib deinen Namen ein:", centerX, y + 180);

    // Das "Eingabefeld"
    ctx.font = `bold 28px ${FONT_FAMILY_MONO}`;
    // Blinker/Cursor simulieren: alle halbe Sekunde an/aus
    const showCursor = Math.floor(Date.now() / 500) % 2 === 0;
    const displayName = currentName + (showCursor ? "|" : "");
    ctx.fillText(displayName, centerX, y + 220);

    // Bestätigungshinweis
    ctx.font = `16px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "#F0EAD6";
    ctx.fillText("Mit Enter bestätigen (max. 15 Zeichen)", centerX, y + 280);
}

function drawAnleitungOverlay(ctx, canvas) {
    const windowWidth = 950;  // z.B. 700 Pixel breit
    const windowHeight = 560; // z.B. 500 Pixel hoch

    // Berechne die Start-Positionen, um das Fenster zu zentrieren ---
    const x = (canvas.width - windowWidth) / 2;
    const y = (canvas.height - windowHeight) / 2;

    // Zeichne das Rechteck mit den neuen, berechneten Werten.
    drawRoundedRect(ctx, x, y, windowWidth, windowHeight, 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "#4A2A2A";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text für die Anleitung
    ctx.fillStyle = "#E3B878";
    ctx.textAlign = "center";
    ctx.font = `bold 36px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Spieleanleitung - Schlüsselmomente", canvas.width / 2, 80);

    ctx.fillStyle = "#F0EAD6";
    ctx.font = `17px ${FONT_FAMILY_MAIN}`;
    ctx.textAlign = "left";
    ctx.textAlign = "center";
    const anleitungText = [
        "Oh nein! Fritzi war mal wieder etwas tollpatschig und hat im Laden alle Ihre Schlüssel verloren!",
        "Hilf Fritzi, die Schlüssel wieder einzusammeln. Dabei pass auf den frechen Piraten-Hamster auf!",
        "",
        "Das Spielprinzip:",
        "Zufällige Schlüssel können in einer beliebigen Reihenfolge eingesammelt werden.",
        "Nummerierte Schlüssel müssen nach der Reihenfolge (1, 2, 3...) eingesammelt werden.",
        "Der fiese Hamster klaut dir beim berühren deine wertvolle Zeit!",
        "Umlaufe die im Wege stehenden Vans.",
        "",
        "Die Steuerung:",
        "Benutze die Pfeiltasten oder W, A, S, D, um Fritzi zu bewegen",
        "Drücke die 'P'-Taste, um das Spiel zu pausieren",
        "Drücke die 'N'-Taste, um das Spiel neu zu Starten",
        "Drücke die 'ESC'-Taste, um zum Hauptmenü zu kommen",
        ""
        
    ];
    
    for (let i = 0; i < anleitungText.length; i++) {
       ctx.fillText(anleitungText[i], canvas.width / 2, y + 100 + i * 28);
    }
    
    ctx.fillStyle = "#E3B878";
    ctx.font = `bold 25px ${FONT_FAMILY_MAIN}`;
    ctx.textAlign = "center";
    ctx.fillText("Drücke Enter", canvas.width / 2, canvas.height - 80);
}

function drawLocalHighscoreOverlay(ctx, canvas, highScores) { 
    // Fenstergröße und Overlay-Stile
    const windowWidth = 950;
    const windowHeight = 560;
    const x = (canvas.width - windowWidth) / 2;
    const y = (canvas.height - windowHeight) / 2;
    const centerX = x + windowWidth / 2;

    drawRoundedRect(ctx, x, y, windowWidth, windowHeight, 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "#4A2A2A";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Titel
    ctx.fillStyle = "#E3B878";
    ctx.textAlign = "center";
    ctx.font = `bold 36px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Lokale Top 10 Highscores", centerX, y + 50);
    
    const lineHeight = 30;

    // Wir prüfen jetzt die übergebene highScores-Liste
    if (!highScores || highScores.length === 0) { 
        ctx.fillStyle = "#F0EAD6";
        ctx.font = `22px ${FONT_FAMILY_MAIN}`;
        ctx.fillText("Noch keine Highscores vorhanden.", centerX, y + windowHeight / 2);
    } else {
        const totalHeight = highScores.length * lineHeight;
        const startY = y + (windowHeight - totalHeight) / 2 + 35;

        const platzX = centerX - 250;
        const nameX = centerX - 170;
        const levelX = centerX + 150;
        const punkteX = centerX + 250;

        ctx.font = `bold 20px ${FONT_FAMILY_MAIN}`;
        ctx.fillStyle = "#E3B878";
      
        ctx.textAlign = "center";
        ctx.fillText("Platz", platzX, startY - 40);     
        ctx.textAlign = "left"; 
        ctx.fillText("Name", nameX, startY - 40);
        ctx.textAlign = "center";
        ctx.fillText("Level", levelX, startY - 40);
        ctx.textAlign = "center";
        ctx.fillText("Punkte", punkteX, startY - 40);
        ctx.font = `18px ${FONT_FAMILY_MAIN}`;

        ctx.font = `18px ${FONT_FAMILY_MAIN}`;
        ctx.fillStyle = "#F0EAD6";
        highScores.forEach((entry, index) => {
            const yPos = startY + index * lineHeight;
            
            const rank = (index + 1).toString() + ".";
            const name = entry.name;
            const level = (entry.level || '?').toString();
            const score = entry.score.toString();

            ctx.textAlign = "center";
            ctx.fillText(rank, platzX, yPos);    
            // Name (linksbündig)
             ctx.textAlign = "left";
             ctx.fillText(name, nameX, yPos);    
            // Level (zentriert)
            ctx.textAlign = "center";
            ctx.fillText(level, levelX, yPos);
            // Punkte 
            ctx.textAlign = "right";
            ctx.fillText(score, punkteX, yPos);
        });
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#E3B878";
    ctx.font = `15px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Info: Dieses Spiel speichert die Highscores nur lokal im Browser!", centerX, y + windowHeight - 20);
    
    ctx.font = `bold 25px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Enter zurück zum Menü", centerX, y + windowHeight - 60);
}

function drawOnlineHighscoreOverlay(ctx, canvas, highScores, currentPage) {
    const ITEMS_PER_PAGE = 10;

    // Fenster und Hintergrund zeichnen
    const windowWidth = 950;
    const windowHeight = 560;
    const x = (canvas.width - windowWidth) / 2;
    const y = (canvas.height - windowHeight) / 2;
    const centerX = x + windowWidth / 2;

    drawRoundedRect(ctx, x, y, windowWidth, windowHeight, 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "#4A2A2A";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Titel
    ctx.fillStyle = "#E3B878";
    ctx.textAlign = "center";
    ctx.font = `bold 36px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("Online Top 50 Highscores", centerX, y + 50);

    // Prüfen, ob Daten vorhanden sind
    if (!highScores || highScores.length === 0) {
        ctx.fillStyle = "#F0EAD6";
        ctx.font = `22px ${FONT_FAMILY_MAIN}`;
        ctx.fillText("Noch keine Highscores vorhanden.", centerX, y + windowHeight / 2);
    } else {
        const startIndex = currentPage * ITEMS_PER_PAGE;
        const scoresToShow = highScores.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        const lineHeight = 30;
        // Start-Y-Position für die Liste berechnen
        const listHeight = ITEMS_PER_PAGE * lineHeight;
        const startY = y + (windowHeight - listHeight) / 2 + 35;

        const platzX = centerX - 250;
        const nameX = centerX - 170;
        const levelX = centerX + 150;
        const punkteX = centerX + 250;

        // Spaltenüberschriften
        ctx.font = `bold 20px ${FONT_FAMILY_MAIN}`;
        ctx.fillStyle = "#E3B878";

        ctx.textAlign = "center";
        ctx.fillText("Platz", platzX, startY - 40);     
        ctx.textAlign = "left"; 
        ctx.fillText("Name", nameX, startY - 40);
        ctx.textAlign = "center";
        ctx.fillText("Level", levelX, startY - 40);
        ctx.textAlign = "center";
        ctx.fillText("Punkte", punkteX, startY - 40);
        ctx.font = `18px ${FONT_FAMILY_MAIN}`;

        // Einträge zeichnen
        ctx.font = `18px ${FONT_FAMILY_MAIN}`;
        ctx.fillStyle = "#F0EAD6";
        scoresToShow.forEach((entry, index) => {
            const yPos = startY + index * lineHeight;
            const rank = (startIndex + index + 1).toString() + ".";
            const name = entry.name;
            const level = (entry.level || '?').toString();
            const score = entry.score.toString();

            ctx.textAlign = "center";
            ctx.fillText(rank, platzX, yPos);    
            // Name (linksbündig)
             ctx.textAlign = "left";
             ctx.fillText(name, nameX, yPos);    
            // Level (zentriert)
            ctx.textAlign = "center";
            ctx.fillText(level, levelX, yPos);
            // Punkte 
            ctx.textAlign = "right";
            ctx.fillText(score, punkteX, yPos);
        });
    }

    // Untere Hinweistexte für Navigation und Seitenzahl
    ctx.font = `bold 22px ${FONT_FAMILY_MAIN}`;
    ctx.fillStyle = "#E3B878";
    ctx.textAlign = "center";
    
    const totalPages = Math.max(1, Math.ceil(highScores.length / ITEMS_PER_PAGE));
    ctx.fillText(`Seite ${currentPage + 1} / ${totalPages}`, centerX, y + windowHeight - 65);
    ctx.font = `18px ${FONT_FAMILY_MAIN}`;
    ctx.fillText("‹ Links / Rechts › zum Blättern | Enter zurück zum Menü", centerX, y + windowHeight - 35);
}