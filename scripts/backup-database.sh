#!/usr/bin/env bash
set -euo pipefail
umask 077
test "${GITHUB_REPOSITORY:-}" = 'muknan/smile-please-backups'
test -n "${SUPABASE_DB_URL:-}"
test -n "${SUPABASE_CA_CERT:-}"
test -n "${BACKUP_PASSPHRASE:-}"
# Hard destination guard: a typo must never restore over production.
test "${RESTORE_DB_URL:-}" = 'postgresql://postgres:isolated-restore-only@restore:5432/recovery_check'
export PGCONNECT_TIMEOUT=20
export GNUPGHOME
GNUPGHOME="$(mktemp -d)"
work="$(mktemp -d)"
trap 'rm -rf "$work" "$GNUPGHOME"' EXIT
# GitHub-hosted runners cannot reach the project's IPv6-only direct endpoint.
# Require the project's IPv4 session pooler and verify its TLS identity against
# the CA downloaded from Supabase Database Settings.
case "$SUPABASE_DB_URL" in
  postgresql://*@*.pooler.supabase.com:5432/*|postgres://*@*.pooler.supabase.com:5432/*) ;;
  *) echo '::error::SUPABASE_DB_URL must use the Supabase IPv4 session pooler on port 5432.' >&2; exit 1 ;;
esac
if [[ "$SUPABASE_DB_URL" == *\?* ]]; then
  query="${SUPABASE_DB_URL#*\?}"
  IFS='&' read -r -a parameters <<< "$query"
  safe_parameters=()
  for parameter in "${parameters[@]}"; do
    case "$parameter" in
      sslmode=*|sslrootcert=*) ;; # Replaced by verified settings below.
      host=*|port=*)
        echo '::error::SUPABASE_DB_URL contains a host or port override.' >&2
        exit 1 ;;
      *) safe_parameters+=("$parameter") ;;
    esac
  done
  SUPABASE_DB_URL="${SUPABASE_DB_URL%%\?*}"
  if ((${#safe_parameters[@]})); then
    SUPABASE_DB_URL+="?$(IFS='&'; echo "${safe_parameters[*]}")"
  fi
fi
export PGSSLMODE=verify-full
export PGSSLROOTCERT="$work/supabase-ca.crt"
printf '%s\n' "$SUPABASE_CA_CERT" > "$PGSSLROOTCERT"
openssl x509 -in "$PGSSLROOTCERT" -noout > /dev/null
server_version="$(psql "$SUPABASE_DB_URL" -XAtc 'show server_version_num')"
migration_016="$(psql "$SUPABASE_DB_URL" -XAtc "select exists(select 1 from supabase_migrations.schema_migrations where version = '016')" 2>/dev/null)" || migration_016=unknown
day_block_table="$(psql "$SUPABASE_DB_URL" -XAtc "select to_regclass('public.availability_day_blocks') is not null" 2>/dev/null)" || day_block_table=unknown
echo "Production migration 016 history: $migration_016; day-block table present: $day_block_table."
client_major="$(pg_dump --version | sed -E 's/.* ([0-9]+)(\..*)?$/\1/')"
server_major="$((server_version / 10000))"
if [ "$client_major" -lt "$server_major" ]; then
  echo "::error::PostgreSQL client $client_major is older than server $server_major" >&2
  exit 1
fi
# Retain grants in the archive. Restore diagnostics can contain patient values
# and are never uploaded or printed.
pg_dump "$SUPABASE_DB_URL" --no-owner --format=custom --file="$work/backup.dump"
test "$(stat -c %s "$work/backup.dump")" -gt 1024
gpg --batch --yes --pinentry-mode loopback --passphrase-fd 3 \
  --symmetric --cipher-algo AES256 --s2k-count 65011712 \
  --output backup.dump.gpg "$work/backup.dump" 3<<<"$BACKUP_PASSPHRASE"
gpg --batch --yes --pinentry-mode loopback --passphrase-fd 3 \
  --output "$work/recovered.dump" --decrypt backup.dump.gpg 3<<<"$BACKUP_PASSPHRASE"
cmp "$work/backup.dump" "$work/recovered.dump"
pg_restore --list "$work/recovered.dump" > "$work/toc"
for table in profiles patients appointments availability_slots consents; do
  grep -q "TABLE DATA public $table " "$work/toc"
done
# Decode every archive entry, including platform-managed schemas.
pg_restore --file=/dev/null "$work/recovered.dump"
env PGSSLMODE=prefer psql "$RESTORE_DB_URL" -Xv ON_ERROR_STOP=1 > "$work/restore.log" 2>&1 <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create role supabase_auth_admin nologin;
create role supabase_admin nologin;
create schema auth;
create schema extensions;
create extension if not exists btree_gist with schema public;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
SQL
if ! env PGSSLMODE=prefer pg_restore --verbose --dbname="$RESTORE_DB_URL" --schema=auth --schema=public \
  --no-owner --no-privileges --exit-on-error "$work/recovered.dump" >> "$work/restore.log" 2>&1; then
  # Report only the archive object type/name, never SQL errors or row values.
  grep -E '^pg_restore: (creating|processing|restoring) ' "$work/restore.log" | tail -1 >&2 || true
  if grep -Eiq 'extension .* is not available|could not open extension control file' "$work/restore.log"; then
    echo '::error::Restore requires an unavailable extension.' >&2
  elif grep -Eiq 'role .* does not exist' "$work/restore.log"; then
    echo '::error::Restore requires an unavailable database role.' >&2
  elif grep -Eiq 'schema .* does not exist' "$work/restore.log"; then
    echo '::error::Restore requires an unavailable schema.' >&2
  elif grep -Eiq 'function .* does not exist' "$work/restore.log"; then
    echo '::error::Restore requires an unavailable function.' >&2
  elif grep -Eiq 'type .* does not exist' "$work/restore.log"; then
    echo '::error::Restore requires an unavailable type.' >&2
  fi
  echo '::error::Isolated auth/public restore failed. Sensitive restore diagnostics were withheld.' >&2
  exit 1
fi
env PGSSLMODE=prefer psql "$RESTORE_DB_URL" -Xv ON_ERROR_STOP=1 > "$work/check.log" 2>&1 <<'SQL'
do $$ begin
  if exists (select 1 from public.appointments a left join public.patients p on p.profile_id=a.patient_id where p.profile_id is null) then
    raise exception 'Recovery contains orphan appointments';
  end if;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
             where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) then
    raise exception 'Recovery contains an application table without RLS';
  end if;
end $$;
SQL
bytes="$(stat -c %s backup.dump.gpg)"
tables="$(grep -c 'TABLE DATA public ' "$work/toc")"
echo "Verified encrypted archive: $bytes bytes; $tables application tables; PostgreSQL $server_major."
echo 'Full archive decoded; auth/public schema, data, constraints and RLS restored into an isolated PostgreSQL service.'
echo 'Platform-managed schemas and Storage object bytes require the separate recovery procedure.'
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  printf 'Encrypted backup: %s bytes. Application tables: %s. Encryption round trip and isolated auth/public restore passed. Retention: 90 days.\n' "$bytes" "$tables" >> "$GITHUB_STEP_SUMMARY"
fi
