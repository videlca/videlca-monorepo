#!/bin/sh
set -eu

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: ./deploy.sh <tag>   e.g. ./deploy.sh v1.4.0"
  exit 1
fi

# Stop early if there are uncommitted changes (git checkout would fail or discard them)
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "ERROR: uncommitted changes on the server. Commit them to the repo or run 'git stash' first."
  git status --short
  exit 1
fi

# Make sure the db is running and wait until it's healthy
docker compose up -d db
echo "Waiting for database..."
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q db)")" = "healthy" ]; do
  i=$((i+1))
  if [ "$i" -gt 30 ]; then
    echo "ERROR: database not healthy after 60s"
    docker compose logs db --tail 30
    exit 1
  fi
  sleep 2
done

# Back up the database
mkdir -p backups
BACKUP="backups/$(date +%F-%H%M)-before-$VERSION.sql"
docker compose exec -T db sh -c \
  'exec mysqldump --single-transaction -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "$BACKUP"
echo "Backup written to $BACKUP"

# Check out the release
git fetch --tags
git checkout "$VERSION"

# Rebuild and restart only the app (the db is left alone)
export APP_VERSION="$VERSION"
docker compose build app
docker compose up -d --no-deps app

# Remove only dangling images; tagged versions stay for rollback
docker image prune -f
echo "Deployed $VERSION"