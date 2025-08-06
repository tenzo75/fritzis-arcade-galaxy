/* In Hauptverzeichnis/boot.js  */

import { playSound, fadeOutSound } from './launcherSound.js';

// EINSTELLUNGEN
const FONT_SIZE = 22;
const LINE_HEIGHT = 25;
const FONT_FAMILY = 'VT323, monospace';
const TEXT_COLOR = '#DDDDDD';
const CHAR_TYPE_DELAY = 10;
const MEMCHECK_SPEED = 170; // Angepasst für realistisches Tempo
const MEMCHECK_TOTAL_KB = 65536; // Angepasst auf 64 MB
const DRIVE_DETECT_DELAY = 1600; // Zeit in ms, die jede Erkennung dauert
const BOOT_AREA_WIDTH = 850;
const VERTICAL_OFFSET = 50;
const INITIAL_DELAY = 1500;      // Pause nach Enter, bevor etwas passiert
const FADE_IN_DURATION =6000;  // 2000ms = 2 Sekunden für das Aufleuchten

let isAborted = false;

const bootSequence = [
    'SHOW_LOGO',
    { type: 'FADE_IN_TEXT', line: '(A) Award Modular BIOS v4.51PG, An Energy Star Ally' },
    '>> Copyright (C) 1984-97, Award Software, Inc.',
    'BLANK_LINE', '(TX97-A) Intel 430TX PCI Chipset', 
    'BLANK_LINE', 'Intel Pentium(R) MMX(TM) CPU at 200MHz', 
    'MEMCHECK',
    'BLANK_LINE', 'Award Plug and Play BIOS Extension v1.0A', 'Copyright (C) 1997, Award Software, Inc.',
    'BLANK_LINE','BLANK_LINE',
    { type: 'DETECT_DRIVE', line: 'Detecting IDE Primary Master ... ', result: 'QUANTUM FIREBALL ST3.2A' },
    { type: 'DETECT_DRIVE', line: 'Detecting IDE Primary Slave  ... ', result: 'MITSUMI FX240S 1.0A' },
    { type: 'DETECT_DRIVE', line: 'Detecting IDE Secondary Master... ', result: 'None' },
    { type: 'DETECT_DRIVE', line: 'Detecting IDE Secondary Slave ... ', result: 'None' },
    'BLANK_LINE','BLANK_LINE','BLANK_LINE','BLANK_LINE', 'Press ESC to SKIP', 
    '12/10/97-i430TX-PIIX4-2A59G-00',
    'DELAY:1500', 'CLS', 'DRAW_BLOCK', 'DELAY:2000', 'Verifying DMI Pool Data ........', 'DELAY:1000',
    'Starting Fritzi’s Arcade Galaxy...', 'DELAY:1800', 'CLS'
];

const finalScreenBlock = [
    'DRAW_DOUBLE_BORDER', '                                                                       ',
    ' CPU Type       : Pentium(R) MMX            Base Memory      : 640K         ',
    ' Co-Processor   : Installed                 Extended Memory  : 64512K         ',
    ' CPU Clock      : 200MHz                    Cache Memory     : None         ',
    'DRAW_SINGLE_LINE',
    ' Diskette Drive A : 1.44M, 3.5 in.          Display Type     : EGA/VGA        ',
    ' Diskette Drive B : None                    Serial Port(s)   : 3F8 2F8        ',
    ' Pri. Master Disk : LBA,Mode 3, 3240MB      Parallel Port(s) : 378          ',
    ' Pri. Slave Disk  : CDROM,Mode 4            EDO DRAM at Row(s): None         ',
    ' Sec. Master Disk : None                    SDRAM at Row(s)  : 0 1 2 3 4        ',
    ' Sec. Slave Disk  : None                    L2 Cache Type    : Pipeline Burst         ',
    '                                                                       ', '                                                                       ',
    ' PCI device listing.....                                                 ',
    ' Bus No. Device No. Func No. Vendor ID  Device ID  Device Class         IRQ    ',
    'DRAW_PCI_LINE',
    '   0       7         1       8086       1230     IDE Controller         14     ',
    '   0       17        0       1274       1371     Multimedia Device      11     ',
];

// Modul-Variablen
let ctx, canvas, logoElement, win95ScreenElement;
let currentLineIndex, currentX, currentY, offsetX, offsetY;
let onFinishedCallback = null;

// Gibt Auskunft, ob die Sequenz abgebrochen wurde
export function wasBootAborted() {
    return isAborted;
}

function initialize(mainCanvas, mainCtx, callback) {
    canvas = mainCanvas;
    ctx = mainCtx;
    onFinishedCallback = callback;
    logoElement = document.getElementById('epalogo');
    win95ScreenElement = document.getElementById('win95-bootscreen');
    
    offsetX = (canvas.width - BOOT_AREA_WIDTH) / 2;
    offsetY = VERTICAL_OFFSET;

    currentLineIndex = 0;
    currentX = offsetX;
    currentY = offsetY;
    
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left'; 
}

function clearScreen() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = TEXT_COLOR;
    currentX = offsetX;
    currentY = offsetY;
}

function drawLine(startX, startY, endX, endY) { ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke(); }

function drawSingleLine(yOffset) { drawLine(offsetX, yOffset, offsetX + BOOT_AREA_WIDTH - 30, yOffset); }

function drawBlockInstantly() {
    const numLines = finalScreenBlock.length;
    const boxHeight = (numLines * LINE_HEIGHT) - (LINE_HEIGHT / 2 +190);
    
    ctx.strokeStyle = TEXT_COLOR; 
    ctx.lineWidth = 1; 
    ctx.strokeRect(offsetX - 8, currentY , BOOT_AREA_WIDTH - 14, boxHeight);
    ctx.strokeRect(offsetX - 5, currentY + 3, BOOT_AREA_WIDTH - 20, boxHeight - 6);

    finalScreenBlock.forEach(line => {
        if (line === 'DRAW_DOUBLE_BORDER') {
            currentY += LINE_HEIGHT / 2;
        } else if (line === 'DRAW_SINGLE_LINE' || line === 'DRAW_PCI_LINE') {
            drawSingleLine(currentY - 40);
        } else {
            ctx.fillText(line, currentX, currentY - 50);
        }
        currentY += LINE_HEIGHT;
    });

    currentX = offsetX; 
    currentLineIndex++; 
    processNextLine();
}

function handleDriveDetection(command) {
    let text = command.line;
    ctx.fillText(text, currentX, currentY);
    let skipX = currentX + ctx.measureText(text).width;
    const skipText = "[Press F4 to skip]";
    ctx.fillText(skipText, skipX, currentY);

    setTimeout(() => {
        if (isAborted) return;
        ctx.fillStyle = '#000000';
        ctx.fillRect(skipX, currentY, 300, LINE_HEIGHT);
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(command.result, skipX, currentY);
        currentY += LINE_HEIGHT;
        currentX = offsetX;
        currentLineIndex++;
        processNextLine();
    }, DRIVE_DETECT_DELAY); // <-- HIER WURDE DER WERT ERSETZT
}

function handleFadeInText(command) {
    const lineToFadeIn = command.line;
    let startTime = null;
    
    function fadeStep(timestamp) {
        if (isAborted) return;
        if (!startTime) startTime = timestamp;
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / FADE_IN_DURATION, 1);

        // Löschen und zeichnen mit aktuellem Alpha
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#000000';
        ctx.fillRect(currentX, currentY, BOOT_AREA_WIDTH, FONT_SIZE);

        ctx.globalAlpha = progress;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(lineToFadeIn, currentX, currentY);

        if (progress < 1) {
            requestAnimationFrame(fadeStep);
        } else {
            ctx.globalAlpha = 1.0;
            currentY += LINE_HEIGHT;
            currentLineIndex++;
            processNextLine();
        }
    }

    requestAnimationFrame(fadeStep);
}

function processNextLine() {
    if (isAborted) return;
    if (currentLineIndex >= bootSequence.length) {
        if (onFinishedCallback) onFinishedCallback();
        return;
    }

    const command = bootSequence[currentLineIndex];

    if (typeof command === 'object' && command !== null) {
        if (command.type === 'DETECT_DRIVE') {
            handleDriveDetection(command);
        } 
        else if (command.type === 'FADE_IN_TEXT') {
            handleFadeInText(command);
        }
    } else {
        switch(command) {
            case 'SHOW_LOGO':
                logoElement.style.opacity = '0';
                logoElement.style.display = 'block';
                setTimeout(() => {
                logoElement.style.opacity = '1';
                }, 50);
                currentLineIndex++;
                processNextLine();
                break;
            case 'DRAW_BLOCK':
                drawBlockInstantly();
                break;
            case 'CLS':
                clearScreen();
                if (logoElement) logoElement.style.display = 'none';
                if (win95ScreenElement) win95ScreenElement.style.display = 'none';
                currentLineIndex++;
                processNextLine();
                break;
            case 'MEMCHECK':
                startMemoryCheck();
                break;
            case 'BLANK_LINE':
                currentY += LINE_HEIGHT;
                currentLineIndex++;
                processNextLine();
                break;
            case 'SHOW_WIN95_SCREEN':
                clearScreen();
                if (logoElement) logoElement.style.display = 'none';
                if (win95ScreenElement) win95ScreenElement.style.display = 'block';
                currentLineIndex++;
                processNextLine();
                break;
                                
            default:
                if (command.startsWith('DELAY:')) {
                    const delay = parseInt(command.split(':')[1], 10);
                    setTimeout(() => { if (!isAborted) { currentLineIndex++; processNextLine(); } }, delay);
                
               
                
                } else if (command.startsWith('SOUND:')) {
                    const soundName = command.split(':')[1];
                    playSound(soundName);
                    currentLineIndex++;
                    processNextLine();
                } else {
                    typeLine(command);
                }
                break;
        }
    }
}

function typeLine(line) {
    let charIndex = 0;
    function typeChar() {
        if (isAborted) return;
        if (charIndex < line.length) {
            ctx.fillText(line[charIndex], currentX, currentY);
            currentX += ctx.measureText(line[charIndex]).width;
            charIndex++;
            setTimeout(typeChar, CHAR_TYPE_DELAY);
        } else {
            currentY += LINE_HEIGHT;
            currentX = offsetX;
            currentLineIndex++;
            processNextLine();
        }
    }
    typeChar();
}

function startMemoryCheck() {
    const initialText = "Memory Test : ";
    ctx.fillText(initialText, currentX, currentY);
    const startX = currentX + ctx.measureText(initialText).width;
    let currentMemory = 0;
    
    const interval = setInterval(() => {
        if (isAborted) { clearInterval(interval); return; }
        
        ctx.fillStyle = '#000000'; ctx.fillRect(startX, currentY, 300, LINE_HEIGHT);
        ctx.fillStyle = TEXT_COLOR; ctx.fillText(`${currentMemory}K OK`, startX, currentY);
        
        currentMemory += Math.floor(Math.random() * 4096) + 2048; // Angepasst für 64MB
        
        if (currentMemory >= MEMCHECK_TOTAL_KB) {
            clearInterval(interval);
            ctx.fillStyle = '#000000'; ctx.fillRect(startX, currentY, 300, LINE_HEIGHT);
            ctx.fillStyle = TEXT_COLOR; ctx.fillText(`${MEMCHECK_TOTAL_KB}K OK`, startX, currentY);
            currentY += LINE_HEIGHT; currentX = offsetX; currentLineIndex++; processNextLine();
        }
    }, MEMCHECK_SPEED);
}

export function stopBootSequence() {
    isAborted = true;
    console.log("Boot-Sequenz wurde abgebrochen.");
    if (ctx) { // Sicherheitsabfrage, falls ctx noch nicht initialisiert wurde
        ctx.globalAlpha = 1.0;
    }
}

export function startBootSequence(mainCanvas, mainCtx, callback) {
    isAborted = false;
    initialize(mainCanvas, mainCtx, callback);

    document.fonts.load(`${FONT_SIZE}px ${FONT_FAMILY}`).then(() => {
        clearScreen();
        setTimeout(() => {
            processNextLine();
        }, INITIAL_DELAY);
    });
}