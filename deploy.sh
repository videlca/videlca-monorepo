#!/bin/sh
set -e

VERSION="$1"
if [ -z "$VERSION" ]; then
  echo "Usage: ./deploy.sh <tag>   e.g. ./deploy.sh v1.4.0"
  exit 1
fi

# Back up the database before changing anything
mkdir -p backups
if [ -n "$(docker compose ps -q db)" ]; then
  docker compose exec -T db sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
    > "backups/$(date +%F-%H%M)-before-$VERSION.sql"
fi

git fetch --tags
git checkout "$VERSION"

export APP_VERSION="$VERSION"
docker compose build app
docker compose up -d

# Removes only dangling images; tagged versions stay for quick rollback
docker image prune -f
