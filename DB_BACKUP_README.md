# Database Backup & Restore Guide

## Automated Backups
- Backups are created daily by the `scripts/pg_backup.sh` script and stored in the `backups/` directory.
- Each backup is named as `bullkit_YYYY-MM-DD_HH-MM-SS.sql.gz`.
- Old backups (older than 7 days) are automatically deleted.

## How to Restore a Backup
1. Locate the desired backup file in the `backups/` directory.
2. Run the following command (replace `<backup_file>` with your file name):

```bash
export PGPASSWORD="<your_db_password>"
gunzip -c backups/<backup_file> | psql -h <db_host> -p <db_port> -U <db_user> <db_name>
unset PGPASSWORD
```

- Example:
  ```bash
  export PGPASSWORD="201199201199"
  gunzip -c backups/bullkit_2025-05-18_02-00-01.sql.gz | psql -h 172.19.83.213 -p 2522 -U postgres bullkit
  unset PGPASSWORD
  ```

## Security
- Use a `.pgpass` file for passwordless, secure automation if possible.
- Never commit backup files or credentials to version control.

## Scheduling
- Add the following line to your crontab to run the backup daily at 2:00 AM:
  ```
  0 2 * * * /bin/bash /root/api/scripts/pg_backup.sh
  ```

## Troubleshooting
- Ensure the database is accessible from the backup host.
- Check `logs/` for errors if backups fail.
