#!/bin/sh
# Daily PSCDB backup: the database and the uploaded profile pictures, kept for 14 days.
# Installed by DEPLOY.md as /etc/cron.d/pscdb-backup. Copy /var/backups/pscdb off the server regularly.
set -eu
cd /opt/pscdb
DEST=/var/backups/pscdb
STAMP=$(date +%F-%H%M)
umask 077
mkdir -p "$DEST"
docker compose --env-file .env.production exec -T mongo sh -c \
  'mongodump --archive --gzip -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --quiet' \
  < /dev/null > "$DEST/db-$STAMP.archive.gz"
docker run --rm -v pscdb_uploads:/data:ro -v "$DEST":/backup alpine:3.20 tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .
chmod 600 "$DEST"/*
find "$DEST" -type f -mtime +14 -delete
echo "PSCDB backup $STAMP done"
