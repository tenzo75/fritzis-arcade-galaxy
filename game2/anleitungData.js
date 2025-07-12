// In game2/anleitungData.js

export const anleitungFritzi = {
    titel: "Anleitung: Flinke Fritzi - Tour durch Los Santos",
    inhalt: [ // Statt eines HTML-Strings jetzt ein Array von Objekten
        { text: "Starte mit Fritzi in den Tag und steuere sie durch den dichten Verkehr von Los Santos! Weiche dabei" },
        { text: "den entgegenkommenden Autos aus und Sammel dabei soviel Punkte wie möglich! Weil Fritzi keine" },
        { text: "Katze ist hat sie nur 3 Leben, pass also gut auf sie auf! Nach jeder Kollision startet das Level neu." },
        { text: "" }, // Leere Zeile für Abstand
        { text: "Die Steuerung:", style: 'bold' },
        { text: "Benutze die Pfeiltasten oder W, A, S, D, um Fritzi zu bewegen", indent: 20 },
        { text: "• Drücke die 'P'-Taste, um das Spiel zu pausieren und die 'N'-Taste, um das Spiel neu zu Starten", indent: 20 },
        { text: "• Drücke die 'ESC'-Taste, um zum Hauptmenü zu kommen", indent: 20 },
        { text: "" },
        { text: "Punkte:", style: 'bold' },
        { text: "• Schlüssel: +1 Punkt", indent: 20 },
        { text: "• Geld: +2 Punkte", indent: 20 },
        { text: "• Müll: -2 Punkte", indent: 20 },
        { text: "" },
        { text: "Drücke Enter", style: 'italic' },
    ]
};