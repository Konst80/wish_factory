# **Anforderungsspezifikation: Wish-Factory**

Version: 1.1  
Datum: 07.07.2025  
Projekt-Verantwortlicher: \[Platzhalter für Ihren Namen\]

### **1\. Einleitung und Projektziele**

#### **1.1. Projektübersicht**

"Wish-Factory" ist ein webbasiertes Content-Management-System (CMS) zur Erstellung, Verwaltung und Auslieferung von qualitativ hochwertigen, KI-gestützten Glückwünschen ("Wishes"). Das System soll Redakteuren ermöglichen, Wünsche effizient zu generieren, zu kuratieren und über eine standardisierte API für externe Applikationen bereitzustellen.

#### **1.2. Hauptziele**

- **Effiziente Inhaltserstellung:** Beschleunigung der Wunscherstellung durch eine integrierte KI.
- **Hohe Datenqualität:** Sicherstellung der Einhaltung von Stil-, Inhalts- und Formatierungsregeln durch einen geführten Prozess und menschliche Reviews.
- **Zentrale Verwaltung:** Eine einzige Quelle der Wahrheit ("Single Source of Truth") für alle Wünsche.
- **Geregelte Auslieferung:** Bereitstellung geprüfter Inhalte über eine performante, filterbare API.

#### **1.3. Glossar**

- **Wunsch:** Ein einzelnes Datenelement, das einen Glückwunschtext mit Metadaten enthält.
- **Platzhalter:** Spezielle Marker im Text (z.B. \[Name\], \[Age\]), die in der Ziel-App ersetzt werden.
- **Redakteur:** Ein Benutzer, der Wünsche erstellen und bearbeiten kann.
- **Administrator:** Ein Benutzer mit erweiterten Rechten, der Wünsche final freigeben kann.
- **Status:** Der aktuelle Zustand eines Wunsches im Workflow (z.B. Entwurf, Freigegeben).

### **2\. Kerndatenmodell: Das "Wunsch"-Objekt**

Das zentrale Datenobjekt des Systems ist der "Wunsch". Jeder Wunsch MUSS die folgende JSON-Struktur aufweisen.  
{  
 "id": "string",  
 "type": "string",  
 "eventType": "string",  
 "relations": \["string"\],  
 "ageGroups": \["string"\],  
 "specificValues": \[Number\],  
 "text": "string",  
 "belated": "string",  
 "status": "string",  
 "language": "string"  
}

**Feld-Definitionen:**

- **id:** Eindeutiger, systemgenerierter Identifikator. Format: wish_external\_{sprache}\_{laufende_nummer}
- **type:** Art des Wunsches. Muss einer der Werte sein: "normal" | "funny".
- **eventType:** Anlass. Muss einer der Werte sein: "birthday" | "anniversary" | "custom".
- **relations:** Ziel-Beziehung(en). Array mit Werten aus: "friend", "family", "partner", "colleague".
- **ageGroups:** Ziel-Altersgruppe(n). Array mit Werten aus: "all", "young", "middle", "senior".
- **specificValues:** Array mit Zahlen für Meilensteine (z.B. \[18, 30, 50\] für Geburtstage oder \[25, 50\] für Jahrestage). Kann leer sein.
- **text:** Der Haupttext des Wunsches mit Platzhaltern.
- **belated:** Der nachträgliche Text des Wunsches mit Platzhaltern.
- **status:** Der aktuelle Workflow-Status. Muss einer der Werte sein: "Entwurf" | "Zur Freigabe" | "Freigegeben" | "Archiviert".
- **language:** Sprache des Wunsches. Muss einer der Werte sein: "de" | "en".

### **3\. Funktionale Anforderungen**

#### **3.1. Dashboard und Listenansicht**

1. **Anzeige:** Das System MUSS eine tabellarische Übersicht aller Wünsche anzeigen.
2. **Spalten:** Die Tabelle MUSS mindestens die Spalten ID, Text (Vorschau), Sprache, EventType und Status enthalten.
3. **Filterung:** Die Ansicht MUSS eine leistungsstarke Filterung nach folgenden Kriterien ermöglichen: language, status, eventType, type, relations, ageGroups. Eine Volltextsuche im text-Feld ist WÜNSCHENSWERT (SOLLTE).
4. **Sortierung:** Die Tabelle MUSS nach ID und Erstellungsdatum sortierbar sein.
5. **Aktionen:** Jede Zeile MUSS Aktionen für Bearbeiten, Klonen und Status ändern (je nach Berechtigung) anbieten.

#### **3.2. Wunsch-Editor (Erstellen & Bearbeiten)**

1. **Formular:** Das System MUSS ein Formular bereitstellen, das die Erstellung und Bearbeitung eines "Wunsch"-Objekts erlaubt.
2. **ID-Verwaltung:** Das id-Feld MUSS vom System automatisch generiert und schreibgeschützt sein. Das System MUSS die korrekte laufende Nummer pro Sprache sicherstellen.
3. **Eingabeelemente:**
   - type, eventType, language, status: MÜSSEN als Dropdown-Menüs implementiert sein.
   - relations, ageGroups: MÜSSEN als Multi-Select-Checkbox-Gruppen implementiert sein.
   - text, belated: MÜSSEN als textarea-Felder implementiert sein.
   - specificValues: MUSS als Textfeld zur Eingabe kommagetrennter Zahlen implementiert sein.
4. **Assistenzfunktionen:**
   - **Platzhalter-Helfer:** Buttons zum Einfügen der korrekten Platzhalter (\[Name\], \[Age\]) MÜSSEN vorhanden sein.
   - **Zeichen-/Wortzähler:** Für text und belated SOLLTE ein Zähler angezeigt werden.

#### **3.3. KI-Wunsch-Generator**

1. **UI-Komponente:** Es MUSS eine dedizierte UI-Komponente (z.B. ein Modal oder eine eigene Seite) für die KI-Generierung geben.
2. **Benutzereingaben:** Der Benutzer MUSS Anzahl, Sprache und die gewünschten Wunsch-Parameter (eventType, relations, etc.) auswählen können.
3. **Prompt-Generierung:** Das System MUSS basierend auf den Benutzereingaben einen detaillierten, regelkonformen Prompt für eine externe LLM-API erstellen.
4. **API-Kommunikation:** Das System MUSS den Prompt an die KI senden und die JSON-Antwort empfangen.
5. **Datenverarbeitung:**
   - Das System MUSS die von der KI gelieferte JSON-Struktur validieren.
   - Für jeden validen Wunsch-Vorschlag MUSS das System einen neuen Datensatz in der Datenbank anlegen.
   - Der status dieser neuen Wünsche MUSS automatisch auf Entwurf gesetzt werden.
   - Die id MUSS vom System final vergeben werden, um Eindeutigkeit zu garantieren.

#### **3.4. Workflow & Statusmanagement**

1. **Status-Feld:** Jeder Wunsch MUSS einen der folgenden Status haben: Entwurf, Zur Freigabe, Freigegeben, Archiviert.
2. **Status-Übergänge:** Autorisierte Benutzer MÜSSEN den Status eines Wunsches ändern können. Die UI muss diese Übergänge logisch abbilden.
3. **Rollen-Berechtigungen:**
   - Redakteur: Kann Wünsche erstellen (Entwurf) und zur Freigabe einreichen.
   - Administrator: Kann Wünsche von Zur Freigabe zu Freigegeben oder Archiviert ändern.

#### **3.5. Externe API (REST-API)**

1. **Endpunkt:** Das System MUSS einen öffentlichen, schreibgeschützten (read-only) REST-API-Endpunkt bereitstellen (z.B. /api/v1/wishes).
2. **Zugriffsbeschränkung:** Die API MUSS **ausschließlich** Wünsche mit dem Status Freigegeben zurückgeben.
3. **Filterung:** Die API MUSS Filterungen über URL-Query-Parameter unterstützen. Mindestens filterbar nach: language, eventType, relations, ageGroups.
4. **Antwortformat:** Die API MUSS ein JSON-Array mit den "Wunsch"-Objekten im unter Sektion 2 definierten Format zurückliefern.

#### **3.6. JSON-Export**

1. **Funktionalität:** Die UI MUSS eine Funktion zum Exportieren von Wünschen anbieten.
2. **Auswahl:** Der Export MUSS auf die in der Listenansicht aktuell gefilterte Auswahl von Wünschen angewendet werden.
3. **Format:** Der Export MUSS eine .json-Datei erzeugen, die ein Array der ausgewählten "Wunsch"-Objekte enthält.

### **4\. Technische Anforderungen (Technologie-Stack)**

1. **Frontend:** Eine moderne Single-Page-Application (SPA) MUSS entwickelt werden. Empfehlung: **React (mit Vite)** oder Vue.js. Zur Beschleunigung der UI-Entwicklung SOLLTE eine Komponentenbibliothek wie **MUI** oder **Shadcn/UI** verwendet werden.
2. **Backend:** Ein Backend-Service MUSS die Geschäftslogik, Datenverwaltung und API-Endpunkte bereitstellen. Empfehlung: **Node.js** mit einem Framework wie **Express.js** oder **NestJS**.
3. **Datenbank:** Die Wahl der Datenbank sollte zum Datenmodell passen. Empfehlung: Eine NoSQL-Datenbank wie **MongoDB**, die nativ mit JSON-Strukturen arbeitet, oder eine relationale Datenbank wie **PostgreSQL**.
4. **Authentifizierung:** Die Authentifizierung von Benutzern MUSS über einen token-basierten Ansatz, vorzugsweise mit **JSON Web Tokens (JWT)**, erfolgen.

### **5\. Nicht-funktionale Anforderungen**

#### **5.1. Sicherheit**

1. **Authentifizierung:** Der Zugriff auf das CMS MUSS durch ein Login-System geschützt sein.
2. **Autorisierung:** Das System MUSS das unter 3.4 definierte Rollenkonzept (Redakteur, Administrator) umsetzen.
3. **API-Sicherheit:** Die öffentliche API ist schreibgeschützt. Sensible Operationen erfordern einen gültigen Authentifizierungstoken.

#### **5.2. Benutzerfreundlichkeit (Usability)**

1. **Intuitives UI:** Die Oberfläche, insbesondere der Editor und der KI-Generator, MUSS klar strukturiert und einfach zu bedienen sein.
2. **Feedback:** Das System MUSS dem Benutzer klares Feedback geben (z.B. "10 Wünsche als Entwurf erstellt", "Status erfolgreich geändert", "Fehler bei der KI-Anfrage").
3. **Qualitäts-Helfer:** Im Editor SOLLTE eine Live-Validierung für kritische Regeln (z.B. Warnung bei nicht-geschlechtsneutralen Begriffen) implementiert werden.

#### **5.3. Datenintegrität**

1. **Eindeutige IDs:** Das System MUSS die globale Eindeutigkeit und das korrekte Format der id für jeden Wunsch sicherstellen.
2. **Validierung:** Alle Eingaben MÜSSEN vor dem Speichern validiert werden, um die Konsistenz des Datenmodells zu gewährleisten.

#### **5.4. Performance**

1. **Seitenladezeit:** Die initiale Ladezeit des Dashboards SOLLTE unter 3 Sekunden liegen.
2. **API-Antwortzeit:** Anfragen an die öffentliche API SOLLTEN im Durchschnitt in unter 250ms beantwortet werden.

#### **5.5. Fehlerbehandlung**

1. **Benutzer-Feedback:** Bei Fehlern (z.B. ungültige Eingabe, KI-Dienst nicht erreichbar) MUSS dem Benutzer eine klare und verständliche Fehlermeldung angezeigt werden.
2. **Logging:** Kritische Fehler im Backend (z.B. Datenbankfehler, Abstürze) MÜSSEN in einer Log-Datei oder einem Logging-Dienst erfasst werden.

### **6\. Teststrategie**

1. **Unit-Tests:** Kritische Geschäftslogik im Backend (z.B. ID-Generierung, API-Validierung) und komplexe UI-Komponenten im Frontend MÜSSEN durch Unit-Tests abgedeckt sein.
2. **Integrationstests:** Die API-Endpunkte und ihre Interaktion mit der Datenbank MÜSSEN durch Integrationstests validiert werden.
3. **End-to-End (E2E) Tests:** Die wichtigsten Benutzerflüsse (z.B. Login, Wunsch mit KI erstellen, Wunsch freigeben) SOLLTEN durch E2E-Tests (z.B. mit Cypress oder Playwright) automatisiert werden.

### **7\. Annahmen und Einschränkungen**

#### **7.1. Annahmen**

- Eine externe LLM-API (z.B. Google Gemini) ist für das Backend zugänglich.
- Die Benutzer sind mit der Bedienung moderner Webanwendungen vertraut.
- Der Browser-Support beschränkt sich auf die jeweils letzten beiden Hauptversionen von Chrome, Firefox, Safari und Edge.

#### **7.2. Einschränkungen**

- Das System ist für die interne Nutzung durch ein Redaktionsteam konzipiert; eine öffentliche Registrierung ist nicht Teil des Umfangs.
- Das initiale Release konzentriert sich auf die Kernfunktionalitäten. Erweiterte Analyse- oder Reporting-Funktionen sind nicht enthalten.
