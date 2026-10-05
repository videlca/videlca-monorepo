#!/bin/sh
set -e

VERSION="$1"
if [ -z "$VERSION" ]; then
  echo "Usage: ./deploy.sh <tag>   e.g. ./deploy.sh v1.4.0"
  echo "First install with an empty database: SKIP_BACKUP=1 ./deploy.sh <tag>"
  exit 1
fi

# Manual edits on the server would block or be silently mixed into the checkout
if ! git diff --quiet HEAD; then
  echo "Local changes in tracked files; commit them or discard with 'git checkout -- <file>':"
  git status --short --untracked-files=no
  exit 1
fi

# Back up the database before changing anything
if [ "$SKIP_BACKUP" != "1" ]; then
  if [ -z "$(docker compose ps -q --status running db)" ]; then
    echo "The db service of this compose project is not running, so no backup can be taken."
    echo "Start it with 'docker compose up -d db', or back up manually and rerun with SKIP_BACKUP=1."
    exit 1
  fi
  mkdir -p backups
  BACKUP="backups/$(date +%F-%H%M)-before-$VERSION.sql"
  if ! docker compose exec -T db sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' > "$BACKUP" \
    || [ ! -s "$BACKUP" ]; then
    rm -f "$BACKUP"
    echo "Backup failed; nothing was deployed."
    exit 1
  fi
  echo "Backup: $BACKUP ($(du -h "$BACKUP" | cut -f1))"
fi

git fetch --tags
git checkout "$VERSION"

export APP_VERSION="$VERSION"
docker compose build app
docker compose up -d

# Removes only dangling images; tagged versions stay for quick rollback
docker image prune -f
