// Inhalt für game2/carAI.js mit allen Debug-Werkzeugen

import { CONFIG } from './config.js';

// Hilfsfunktionen (unverändert)
export function getLaneIndexFromY(y, height, laneDefinitions) {
    if (!laneDefinitions || laneDefinitions.length === 0) return null;
    const objectCenterY = y + (height / 2);
    for (const lane of laneDefinitions) {
        if (objectCenterY >= lane.topClear && objectCenterY <= lane.bottomClear) {
            return lane.id;
        }
    }
    return null;
}

// Die korrigierte und exportierte Funktion zur Erkennung
export function findCarAhead(currentCar, allObstacles) {
    let carDirectlyAhead = null;
    let minDistance = Infinity;
    const currentCarTop = currentCar.y;
    const currentCarBottom = currentCar.y + currentCar.height;

    for (const otherCar of allObstacles) {
        if (currentCar === otherCar) continue;
        
        const otherCarTop = otherCar.y;
        const otherCarBottom = otherCar.y + otherCar.height;
        const verticallyOverlapping = currentCarBottom > otherCarTop && currentCarTop < otherCarBottom;

        if (verticallyOverlapping && otherCar.x < currentCar.x) {
            const distance = currentCar.x - (otherCar.x + otherCar.width);
            if (distance < minDistance) {
                minDistance = distance;
                carDirectlyAhead = otherCar;
            }
        }
    }
    return carDirectlyAhead;
}

// Die Funktion zur Prüfung der Spur (unverändert)
function isLaneSafeForSwitch(currentCar, targetLaneIndex, allObstacles, laneDefinitions) {
    for (const otherCar of allObstacles) {
        if (currentCar === otherCar) continue;
        const otherCarCurrentLane = getLaneIndexFromY(otherCar.y, otherCar.height, laneDefinitions);
        if (otherCarCurrentLane !== targetLaneIndex) continue;
        const frontSafeZone = currentCar.x + currentCar.width + CONFIG.ai.laneChangeSafetyGapFront;
        const backSafeZone = currentCar.x - CONFIG.ai.laneChangeSafetyGapBack;
        if (otherCar.x < frontSafeZone && otherCar.x + otherCar.width > backSafeZone) {
            return false;
        }
    }
    return true;
}


// Die Haupt-KI-Funktion mit voller Logik UND voller Diagnose
export function decideActionForCar(car, allObstacles, player, levelConfig, laneDefinitions) {
    if (car.isChangingLanes) {
        return { action: 'CONTINUE_STRAIGHT' };
    }
    
    const carAhead = findCarAhead(car, allObstacles);

    // =================================================================
    // =========== HIER IST DAS ENTSCHEIDENDE DEBUGGING ================
    // =================================================================
    if (carAhead) { // Nur loggen, wenn es überhaupt etwas zu sehen gibt
        const debugData = {
            "KI-Auto": `${car.type} (ID: ${car.id})`,
            "KI-Auto Speed": car.speed.toFixed(2),
            "Vordermann": `${carAhead.type} (ID: ${carAhead.id})`,
            "Vordermann Speed": carAhead.speed.toFixed(2),
            "Abstand": Math.round(car.x - (carAhead.x + carAhead.width)),
            "AM_I_FASTER": (car.speed > carAhead.speed)
        };
        console.table(debugData);
    }
    // =================================================================
    // ====================== ENDE DEBUGGING ===========================
    // =================================================================

    if (!carAhead) {
        return { action: 'CONTINUE_STRAIGHT' };
    }
    
    const distanceToCarAhead = car.x - (carAhead.x + carAhead.width);
    const amIFaster = car.speed > carAhead.speed;
    const dynamicSafeDistance = car.speed * 45;

    if (!amIFaster || distanceToCarAhead > dynamicSafeDistance) {
        return { action: 'CONTINUE_STRAIGHT' };
    }
    
    const currentLane = car.laneIndex;
    const canSwitchUp = currentLane > 0 && isLaneSafeForSwitch(car, currentLane - 1, allObstacles, laneDefinitions);
    const canSwitchDown = currentLane < laneDefinitions.length - 1 && isLaneSafeForSwitch(car, currentLane + 1, allObstacles, laneDefinitions);

    if (canSwitchUp || canSwitchDown) {
        let targetLaneIndex;
        if (canSwitchUp && canSwitchDown) {
            targetLaneIndex = Math.random() < 0.5 ? currentLane - 1 : currentLane + 1;
        } else if (canSwitchUp) {
            targetLaneIndex = currentLane - 1;
        } else {
            targetLaneIndex = currentLane + 1;
        }
        return { action: 'CHANGE_LANE', targetLaneIndex: targetLaneIndex };
    } else {
        return { action: 'FOLLOW', target: carAhead };
    }
}