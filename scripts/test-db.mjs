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
