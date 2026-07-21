import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql as pg } from './index.js';

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

await migrate(db, { migrationsFolder });
console.log('migrations applied');
await pg.end();
