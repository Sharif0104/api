#!/bin/bash
# PostgreSQL Automated Backup Script
# Stores daily backups in ./backups and deletes backups older than 7 days
# Usage: Run manually or via cron. See DB_BACKUP_README.md for restore instructions.

set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
DB_NAME="bullkit"
DB_USER="postgres"
DB_HOST="172.19.83.213"
DB_PORT="2522"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$DATE.sql.gz"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# Use .pgpass for passwordless, secure automation if possible
export PGPASSWORD="201199201199"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
unset PGPASSWORD

# Remove backups older than retention period
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;

echo "Backup complete: $BACKUP_FILE"
