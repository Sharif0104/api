# Database Restore Instructions

## Restore a Backup

1. Locate the desired backup file in the `backups/` directory (e.g., `bullkit_2025-05-16_02-00-00.sql.gz`).
2. Run the following command to restore:

```bash
# Stop your application if needed to avoid conflicts
zcat backups/bullkit_YYYY-MM-DD_HH-MM-SS.sql.gz | PGPASSWORD="201199201199" psql -h 172.19.83.213 -p 2522 -U postgres bullkit
```

- Replace the filename and timestamp as needed.
- You may need to drop and recreate the database if restoring to a fresh instance.

## Automate Backups with Cron

1. Make the script executable:
   ```bash
   chmod +x scripts/pg_backup.sh
   ```
2. Edit your crontab:
   ```bash
   crontab -e
   ```
3. Add this line to run the backup daily at 2am:
   ```bash
   0 2 * * * /root/api/scripts/pg_backup.sh
   ```

## Security Best Practices
- Store backups offsite or in cloud storage for disaster recovery.
- Restrict access to backup files and scripts.
- Never commit backup files or credentials to version control.

---
This ensures your production data is always protected and recoverable.
