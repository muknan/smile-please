import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import EmbeddedPostgres from 'embedded-postgres';

const root = path.resolve(import.meta.dirname, '..');
const migrationDir = path.join(root, 'supabase', 'migrations');
const testDir = path.join(root, 'supabase', 'tests');
const bootstrapPath = path.join(testDir, 'bootstrap.sql');
const seedPath = path.join(root, 'supabase', 'seed.sql');
const database = 'smile_please_test';
const tempDir = path.join(os.tmpdir(), `smile-please-db-${process.pid}-${Date.now()}`);
const port = randomInt(54_000, 55_000);

let postgres;
let client;

async function runSql(filePath, label) {
  const sql = await readFile(filePath, 'utf8');
  process.stdout.write(`  ${label}\n`);
  try {
    await client.query(sql);
  } catch (error) {
    error.message = `${label} failed: ${error.message}`;
    throw error;
  }
}

/** Verify block-day refuses immediately when a booking transaction owns a slot. */
async function runBlockDayContentionTest() {
  const slotId = '70000000-0000-0000-0000-000000000001';
  const dentistId = '10000000-0000-0000-0000-000000000001';
  const locker = postgres.getPgClient(database, '127.0.0.1');
  await locker.connect();
  try {
    await client.query(
      `insert into public.availability_slots (id, dentist_id, starts_at, ends_at, created_by)
       values ($1, $2,
         (((now() at time zone 'Asia/Kolkata')::date + 20) + time '16:00') at time zone 'Asia/Kolkata',
         (((now() at time zone 'Asia/Kolkata')::date + 20) + time '16:30') at time zone 'Asia/Kolkata',
         $2)`,
      [slotId, dentistId],
    );
    await locker.query('begin');
    await locker.query('select id from public.availability_slots where id = $1 for update', [slotId]);

    await client.query('begin');
    try {
      await client.query('set local role authenticated');
      await client.query(`set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001"}'`);
      await client.query(
        `select public.block_availability_day($1, (now() at time zone 'Asia/Kolkata')::date + 20)`,
        [dentistId],
      );
      throw new Error('contention test failed: block-day waited for a locked booking slot');
    } catch (error) {
      if (!String(error.message ?? error).includes('DAY_BUSY')) throw error;
    } finally {
      await client.query('rollback').catch(() => {});
    }
    process.stdout.write('  contention: block-day returns DAY_BUSY for a locked booking slot\n');
  } finally {
    await locker.query('rollback').catch(() => {});
    await locker.end().catch(() => {});
    await client.query('delete from public.availability_slots where id = $1', [slotId]).catch(() => {});
  }
}

async function main() {
  await mkdir(tempDir, { recursive: true });
  postgres = new EmbeddedPostgres({
    databaseDir: tempDir,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: false,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    onError: (error) => process.stderr.write(`${String(error)}\n`),
  });

  let primaryError;
  try {
    await postgres.initialise();
    await postgres.start();
    await postgres.createDatabase(database);
    client = postgres.getPgClient(database, '127.0.0.1');
    client.on('notice', ({ message }) => process.stdout.write(`  NOTICE: ${message}\n`));
    await client.connect();

    await runSql(bootstrapPath, 'bootstrap');
    const migrations = (await readdir(migrationDir))
      .filter((name) => name.endsWith('.sql'))
      .sort();
    for (const name of migrations) {
      await runSql(path.join(migrationDir, name), `migration ${name}`);
    }

    // rls.test.sql verifies the public view against the four published seed
    // dentists, so the disposable database follows the documented migration
    // + seed test precondition.
    await runSql(seedPath, 'seed');
    await runBlockDayContentionTest();
    const tests = (await readdir(testDir))
      .filter((name) => name.endsWith('.test.sql'))
      .sort();
    for (const name of tests) {
      await runSql(path.join(testDir, name), `test ${name}`);
    }
    process.stdout.write(`Database tests passed (${tests.length} suites).\n`);
  } catch (error) {
    primaryError = error;
  } finally {
    if (client) await client.end().catch(() => {});
    if (postgres) await postgres.stop().catch(() => {});
    // A Windows file-handle race during best-effort cleanup must not mask the
    // SQL error that caused this run to fail.
    await rm(tempDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    }).catch(() => {});
  }

  // Cleanup must never turn a failed SQL suite into a successful process.
  if (primaryError) throw primaryError;
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  // Some embedded-postgres shutdown hooks reset exitCode on Windows. Exit
  // explicitly after all cleanup so a SQL failure can never look green in CI.
  process.exit(1);
});
