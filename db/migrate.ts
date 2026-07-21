import { join } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql as pg } from './index';

// Wrapped rather than top-level await: the package is CJS-by-default, and
// tsx cannot transform top-level await for a "cjs" output format.
async function main() {
  await migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });
  console.log('migrations applied');
  await pg.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
