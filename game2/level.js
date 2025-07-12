// In game2/level.js

export const LEVELS = [
    
    { // Level 1:
        id: 1,
        name: "Etape 1",
        spawnInterval: 1500, 
        distanceToReach: 1000,
        collectibleSpawning: { key: 0.7, money: 0.2, trash: 0.1, hamster: 0.01 },
        carDistribution: [
            { typeKey: 'asbo', weight: 7 }, 
            { typeKey: 'tornado', weight: 5 },
            { typeKey: 'issi', weight: 6 },
            { typeKey: 'fast_car1', weight: 2 },
            { typeKey: 'fast_car2', weight: 2 },
            { typeKey: 'fast_car3', weight: 2 },
            { typeKey: 'van', weight: 5 },
            { typeKey: 'taxi', weight: 5 },
            { typeKey: 'raser', weight: 0 }
        ],
        autoKiVerhalten: 'defensiv' //  aktuell deaktiviert
    },
    { // Level 2:
        id: 2,
        name: "Etape 2",
        spawnInterval: 1000,
        distanceToReach: 2000,
        collectibleSpawning: { key: 0.6, money: 0.3, trash: 0.2, hamster: 0.03 },
        carDistribution: [
            { typeKey: 'asbo', weight: 7 }, 
            { typeKey: 'tornado', weight: 5 },
            { typeKey: 'issi', weight: 6 },
            { typeKey: 'fast_car1', weight: 3 },
            { typeKey: 'fast_car2', weight: 4 },
            { typeKey: 'fast_car3', weight: 2 },
            { typeKey: 'van', weight: 5 },
            { typeKey: 'taxi', weight: 5 },
            { typeKey: 'raser', weight: 1 }
        ],
        autoKiVerhalten: 'defensiv' 
    },
    { // Level 3:
        id: 3,
        name: "Etape 3",
        spawnInterval: 900,
        distanceToReach: 3500,
        collectibleSpawning: { key: 0.6, money: 0.4, trash: 0.4, hamster: 0.05 },
        carDistribution: [
            { typeKey: 'asbo', weight: 4 }, 
            { typeKey: 'tornado', weight: 5 },
            { typeKey: 'issi', weight: 4 },
            { typeKey: 'fast_car1', weight: 5 },
            { typeKey: 'fast_car2', weight: 3 },
            { typeKey: 'fast_car3', weight: 6 },
            { typeKey: 'van', weight: 3 },
            { typeKey: 'taxi', weight: 4 },
            { typeKey: 'raser', weight: 2 }
        ],
        autoKiVerhalten: 'neutral'
    },
    { // Level 4: 
        id: 4,
        name: "Etape 4",
        spawnInterval: 800,
        distanceToReach: 5000,
        collectibleSpawning: { key: 0.4, money: 0.4, trash: 0.4, hamster: 0.05 },
        carDistribution: [
            { typeKey: 'asbo', weight: 4 }, 
            { typeKey: 'tornado', weight: 5 },
            { typeKey: 'issi', weight: 7 },
            { typeKey: 'fast_car1', weight: 6 },
            { typeKey: 'fast_car2', weight: 6 },
            { typeKey: 'fast_car3', weight: 6 },
            { typeKey: 'van', weight: 2 },
            { typeKey: 'taxi', weight: 3 },
            { typeKey: 'raser', weight: 3 }
        ],
        autoKiVerhalten: 'neutral' //
    },
    { // Level 5: 
        id: 5,
        name: "Etape 5", 
        spawnInterval: 600,
        distanceToReach: 7000,
        collectibleSpawning: { key: 0.4, money: 0.4, trash: 0.5, hamster: 0.05 },
        carDistribution: [
            { typeKey: 'asbo', weight: 4 }, 
            { typeKey: 'tornado', weight: 5 },
            { typeKey: 'issi', weight: 7 },
            { typeKey: 'fast_car1', weight: 6 },
            { typeKey: 'fast_car2', weight: 6 },
            { typeKey: 'fast_car3', weight: 6 },
            { typeKey: 'van', weight: 2 },
            { typeKey: 'taxi', weight: 3 },
            { typeKey: 'raser', weight: 3 }
        ],
        autoKiVerhalten: 'aggressiv' 
    },
    
    { // Level 6: 
        id: 5,
        name: "Etape 6", 
        spawnInterval: 500,
        distanceToReach: 9000,
        collectibleSpawning: { key: 0.4, money: 0.4, trash: 0.5, hamster: 0.05 },
        carDistribution: [
            { typeKey: 'asbo', weight: 4 }, 
            { typeKey: 'tornado', weight: 5 },
            { typeKey: 'issi', weight: 7 },
            { typeKey: 'fast_car1', weight: 6 },
            { typeKey: 'fast_car2', weight: 7 },
            { typeKey: 'fast_car3', weight: 6 },
            { typeKey: 'van', weight: 4 },
            { typeKey: 'taxi', weight: 3 },
            { typeKey: 'raser', weight: 4 }
        ],
        autoKiVerhalten: 'aggressiv' 
    }
];