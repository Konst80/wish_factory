# Backup-Strategie für Wish Factory

## Übersicht

Diese Dokumentation beschreibt die kostenlose Backup-Strategie für die Wish Factory Supabase-Datenbank. Die Lösung nutzt GitHub Actions, Google Drive und Telegram für eine vollständige, automatisierte Backup-Pipeline ohne zusätzliche Kosten.

## 1. Backup-Philosophie: 3-2-1 Regel

- **3** Kopien der Daten (1 Original + 2 Backups)
- **2** verschiedene Medien/Speicherorte
- **1** Offsite-Backup (externe Cloud)

## 2. Mehrstufige Backup-Strategie

### Kurzfristig (Täglich)

- Automatische Supabase-Backups (7 Tage)
- GitHub Actions Artifacts (7 Tage)
- Google Drive Upload

### Mittelfristig (Wöchentlich)

- Wöchentliche Vollbackups in Google Drive
- Aufbewahrung für 1-3 Monate

### Langfristig (Monatlich)

- Monatliche Archiv-Backups in Google Drive
- Aufbewahrung für 1-2 Jahre

## 3. Technische Implementierung

### GitHub Actions Workflow

Erstelle `.github/workflows/backup.yml`:

```yaml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *' # Täglich um 2 Uhr
  workflow_dispatch: # Manueller Trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Create Database Backup
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          echo "BACKUP_FILE=backup-$DATE.sql.gz" >> $GITHUB_ENV
          pg_dump "${{ secrets.DATABASE_URL }}" | gzip > backup-$DATE.sql.gz

      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-$(date +%Y%m%d)
          path: backup-*.sql.gz
          retention-days: 7

      - name: Setup rclone for Google Drive
        run: |
          curl https://rclone.org/install.sh | sudo bash
          mkdir -p ~/.config/rclone
          echo "${{ secrets.RCLONE_CONFIG }}" > ~/.config/rclone/rclone.conf

      - name: Upload to Google Drive
        run: |
          rclone copy backup-*.sql.gz gdrive:wish-factory-backups/daily/

      - name: Cleanup Old Backups
        run: |
          # Lösche Backups älter als 30 Tage aus Google Drive
          rclone delete gdrive:wish-factory-backups/daily/ --min-age 30d

      - name: Notify Success
        run: |
          curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
            -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
            -d text="✅ Wish Factory Backup erfolgreich: $(date +%Y-%m-%d\ %H:%M)"

      - name: Notify Failure
        if: failure()
        run: |
          curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
            -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
            -d text="🚨 Wish Factory Backup FEHLGESCHLAGEN: $(date +%Y-%m-%d\ %H:%M)"
```

### Wöchentliches Backup

Erstelle `.github/workflows/weekly-backup.yml`:

```yaml
name: Weekly Database Backup
on:
  schedule:
    - cron: '0 3 * * 0' # Sonntags um 3 Uhr
  workflow_dispatch:

jobs:
  weekly-backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Create Weekly Backup
        run: |
          WEEK=$(date +%Y-W%U)
          pg_dump "${{ secrets.DATABASE_URL }}" | gzip > weekly-backup-$WEEK.sql.gz

      - name: Setup rclone
        run: |
          curl https://rclone.org/install.sh | sudo bash
          mkdir -p ~/.config/rclone
          echo "${{ secrets.RCLONE_CONFIG }}" > ~/.config/rclone/rclone.conf

      - name: Upload Weekly Backup
        run: |
          rclone copy weekly-backup-*.sql.gz gdrive:wish-factory-backups/weekly/

      - name: Cleanup Old Weekly Backups
        run: |
          # Lösche wöchentliche Backups älter als 12 Wochen
          rclone delete gdrive:wish-factory-backups/weekly/ --min-age 84d

      - name: Notify Success
        run: |
          curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
            -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
            -d text="✅ Wöchentliches Wish Factory Backup erfolgreich: $(date +%Y-W%U)"
```

### Monatliches Backup

Erstelle `.github/workflows/monthly-backup.yml`:

```yaml
name: Monthly Database Backup
on:
  schedule:
    - cron: '0 4 1 * *' # Ersten jeden Monats um 4 Uhr
  workflow_dispatch:

jobs:
  monthly-backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Create Monthly Backup
        run: |
          MONTH=$(date +%Y-%m)
          pg_dump "${{ secrets.DATABASE_URL }}" | gzip > monthly-backup-$MONTH.sql.gz

      - name: Setup rclone
        run: |
          curl https://rclone.org/install.sh | sudo bash
          mkdir -p ~/.config/rclone
          echo "${{ secrets.RCLONE_CONFIG }}" > ~/.config/rclone/rclone.conf

      - name: Upload Monthly Backup
        run: |
          rclone copy monthly-backup-*.sql.gz gdrive:wish-factory-backups/monthly/

      - name: Cleanup Old Monthly Backups
        run: |
          # Lösche monatliche Backups älter als 2 Jahre
          rclone delete gdrive:wish-factory-backups/monthly/ --min-age 730d

      - name: Notify Success
        run: |
          curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
            -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
            -d text="✅ Monatliches Wish Factory Backup erfolgreich: $(date +%Y-%m)"
```

## 4. Erforderliche Secrets

Füge folgende Secrets in GitHub Repository Settings hinzu:

```
DATABASE_URL=postgresql://username:password@host:port/database
RCLONE_CONFIG=<rclone-konfiguration-für-google-drive>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=<telegram-chat-id>
```

## 5. Google Drive Setup

### rclone für Google Drive konfigurieren:

```bash
# Lokal ausführen
rclone config

# Wähle: n (new remote)
# Name: gdrive
# Storage: drive (Google Drive)
# Folge der Authentifizierung
# Kopiere die Konfiguration aus ~/.config/rclone/rclone.conf
```

### Beispiel rclone.conf:

```ini
[gdrive]
type = drive
client_id = your_client_id
client_secret = your_client_secret
scope = drive
token = {"access_token":"...","token_type":"Bearer","refresh_token":"..."}
team_drive =
```

## 6. Telegram Bot Setup

### Bot erstellen:

1. Schreibe @BotFather in Telegram
2. Sende `/newbot`
3. Folge den Anweisungen
4. Speichere den Bot Token

### Chat ID finden:

1. Schreibe deinem Bot eine Nachricht
2. Rufe auf: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
3. Kopiere die Chat ID aus der Antwort

## 7. Backup-Monitoring

### Monitoring-Workflow

Erstelle `.github/workflows/backup-monitor.yml`:

```yaml
name: Backup Monitor
on:
  schedule:
    - cron: '0 8 * * *' # Täglich um 8 Uhr prüfen
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check Last Backup
        run: |
          # Prüfe letztes Backup in Google Drive
          curl https://rclone.org/install.sh | sudo bash
          mkdir -p ~/.config/rclone
          echo "${{ secrets.RCLONE_CONFIG }}" > ~/.config/rclone/rclone.conf

          LAST_BACKUP=$(rclone lsl gdrive:wish-factory-backups/daily/ | head -1 | awk '{print $2, $3}')

          if [ -z "$LAST_BACKUP" ]; then
            curl -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
              -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
              -d text="🚨 ALARM: Keine Backups in Google Drive gefunden!"
          else
            echo "Letztes Backup: $LAST_BACKUP"
          fi
```

## 8. Backup-Wiederherstellung

### Manueller Restore-Prozess:

```bash
# 1. Backup herunterladen
rclone copy gdrive:wish-factory-backups/daily/backup-20241214.sql.gz ./

# 2. Entpacken
gunzip backup-20241214.sql.gz

# 3. Test-Datenbank erstellen
createdb wish_factory_restore_test

# 4. Backup wiederherstellen
psql wish_factory_restore_test < backup-20241214.sql

# 5. Validierung
psql wish_factory_restore_test -c "SELECT COUNT(*) FROM users;"
psql wish_factory_restore_test -c "SELECT COUNT(*) FROM wishes;"

# 6. Bei Erfolg: Produktionsdatenbank ersetzen
# ACHTUNG: Nur mit größter Vorsicht!
dropdb wish_factory_production
createdb wish_factory_production
psql wish_factory_production < backup-20241214.sql
```

### Automatisiertes Restore-Skript:

```bash
#!/bin/bash
# restore-backup.sh

if [ -z "$1" ]; then
    echo "Verwendung: $0 <backup-datei>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="wish_factory_restore_$(date +%Y%m%d_%H%M%S)"

echo "Erstelle Test-Datenbank: $DB_NAME"
createdb "$DB_NAME"

echo "Stelle Backup wieder her: $BACKUP_FILE"
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql "$DB_NAME"
else
    psql "$DB_NAME" < "$BACKUP_FILE"
fi

echo "Validiere Wiederherstellung..."
USER_COUNT=$(psql "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
WISH_COUNT=$(psql "$DB_NAME" -t -c "SELECT COUNT(*) FROM wishes;")

echo "Benutzer: $USER_COUNT"
echo "Wünsche: $WISH_COUNT"

echo "Test-Datenbank: $DB_NAME"
echo "Zum Löschen: dropdb $DB_NAME"
```

## 9. Backup-Größe und Optimierung

### Backup-Optimierung:

```bash
# Nur Daten, ohne Schema
pg_dump --data-only --compress=9 $DATABASE_URL > backup-data-only.sql.gz

# Nur Schema
pg_dump --schema-only $DATABASE_URL > backup-schema.sql

# Bestimmte Tabellen ausschließen
pg_dump --exclude-table=logs --exclude-table=sessions $DATABASE_URL > backup-minimal.sql
```

## 10. Kostenaufstellung

### Komplett kostenlos:

- **GitHub Actions**: 2.000 Minuten/Monat (ausreichend für tägliche Backups)
- **Google Drive**: 15GB Speicher
- **Telegram Bot**: Kostenlos
- **Backup-Retention**:
  - Täglich: 30 Tage
  - Wöchentlich: 12 Wochen
  - Monatlich: 2 Jahre

### Geschätzte Backup-Größen:

- Kleine DB (< 100MB): ~1MB komprimiert
- Mittlere DB (< 1GB): ~10MB komprimiert
- Große DB (< 10GB): ~100MB komprimiert

## 11. Backup-Checklist

### Einmalige Einrichtung:

- [ ] GitHub Repository Secrets konfiguriert
- [ ] Google Drive mit rclone eingerichtet
- [ ] Telegram Bot erstellt und konfiguriert
- [ ] Backup-Workflows in `.github/workflows/` erstellt
- [ ] Ersten Backup-Lauf getestet

### Regelmäßige Wartung:

- [ ] Monatliche Prüfung der Backup-Logs
- [ ] Vierteljährliche Restore-Tests
- [ ] Jährliche Überprüfung der Backup-Größen
- [ ] Google Drive Speicherplatz monitoren

### Notfall-Vorbereitung:

- [ ] Restore-Skript getestet
- [ ] Kontaktdaten für Notfälle dokumentiert
- [ ] Alternative Zugriffswege auf Backups sichergestellt
- [ ] Dokumentation aktuell gehalten

## 12. Troubleshooting

### Häufige Probleme:

**Problem**: GitHub Actions Workflow schlägt fehl
**Lösung**: Prüfe Secrets, DATABASE_URL und Netzwerkverbindung

**Problem**: rclone kann nicht zu Google Drive hochladen
**Lösung**: Token möglicherweise abgelaufen, rclone neu konfigurieren

**Problem**: Backup-Datei ist zu groß
**Lösung**: Komprimierung optimieren, alte Daten archivieren

**Problem**: Telegram-Benachrichtigungen kommen nicht an
**Lösung**: Bot Token und Chat ID prüfen

## 13. Weiterführende Verbesserungen

### Zukünftige Erweiterungen:

- Inkrementelle Backups implementieren
- Backup-Verschlüsselung hinzufügen
- Multi-Cloud-Redundanz (Dropbox, OneDrive)
- Backup-Integrität durch Checksummen
- Automatisierte Restore-Tests

### Monitoring-Erweiterungen:

- Backup-Größe über Zeit tracken
- Performance-Metriken erfassen
- Detailed Error Reporting
- Dashboard für Backup-Status

---

**Letzte Aktualisierung**: 2024-12-14
**Version**: 1.0
**Maintainer**: Wish Factory Team
