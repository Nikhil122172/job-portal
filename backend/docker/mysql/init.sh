#!/bin/sh
set -eu

APP_USER="${MYSQL_USER:-talentbridge}"
APP_PASSWORD="${MYSQL_PASSWORD:-}"

if [ -z "$APP_PASSWORD" ]; then
  echo "MYSQL_PASSWORD is not set; cannot initialize application DB user." >&2
  exit 1
fi

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
  CREATE USER IF NOT EXISTS '${APP_USER}'@'%' IDENTIFIED BY '${APP_PASSWORD}';
  GRANT ALL PRIVILEGES ON auth_db.* TO '${APP_USER}'@'%';
  GRANT ALL PRIVILEGES ON job_db.* TO '${APP_USER}'@'%';
  GRANT ALL PRIVILEGES ON application_db.* TO '${APP_USER}'@'%';
  GRANT ALL PRIVILEGES ON notification_db.* TO '${APP_USER}'@'%';
  FLUSH PRIVILEGES;
EOSQL
