/**
 * Migration: let hubs exist without a username.
 *
 * A hub signs in by phone OTP now, so username / password are optional on
 * POST /admin/hub. The unique index on hubs.username was created without
 * `sparse`, which indexes a missing field as null — so the first hub created
 * without a username works and the second fails with E11000. Mongoose will not
 * alter an index that already exists, so it is dropped and rebuilt here.
 *
 * Any hub carrying username: null or "" is cleared to "field absent" first,
 * otherwise those rows collide with each other under the rebuilt index too.
 *
 * Safe to run more than once — a second run finds the index already sparse and
 * reports 0 changes.
 *
 *   node scripts/make-hub-username-sparse.js            # apply
 *   node scripts/make-hub-username-sparse.js --dry-run  # report only
 */
require('dotenv').config();
const mongoose = require('mongoose');

const DRY_RUN = process.argv.includes('--dry-run');
const INDEX_NAME = 'username_1';

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  await mongoose.connect(uri);
  const hubs = mongoose.connection.db.collection('hubs');
  console.log(`Connected to "${mongoose.connection.name}"${DRY_RUN ? ' (dry run)' : ''}\n`);

  const report = [];

  // ------------------------------------------------- blank usernames -> unset
  const blankFilter = { $or: [{ username: null }, { username: '' }] };
  const blanks = await hubs.countDocuments(blankFilter);

  if (blanks && !DRY_RUN) {
    const r = await hubs.updateMany(blankFilter, { $unset: { username: '' } });
    report.push(`${r.modifiedCount} hubs: blank username removed`);
  } else {
    report.push(`${blanks} hubs: blank username removed${DRY_RUN && blanks ? ' (would change)' : ''}`);
  }

  // ------------------------------------------------------ rebuild as sparse
  const indexes = await hubs.indexes();
  const existing = indexes.find((i) => i.name === INDEX_NAME);

  if (!existing) {
    report.push(`index ${INDEX_NAME} does not exist — creating it sparse`);
    if (!DRY_RUN) await hubs.createIndex({ username: 1 }, { unique: true, sparse: true });
  } else if (existing.sparse) {
    report.push(`index ${INDEX_NAME} is already sparse — nothing to do`);
  } else {
    report.push(
      `index ${INDEX_NAME} rebuilt as unique + sparse${DRY_RUN ? ' (would change)' : ''}`
    );
    if (!DRY_RUN) {
      await hubs.dropIndex(INDEX_NAME);
      await hubs.createIndex({ username: 1 }, { unique: true, sparse: true });
    }
  }

  console.log(report.map((line) => `  ${line}`).join('\n'));
  console.log(
    DRY_RUN
      ? '\nDry run — nothing was written. Re-run without --dry-run to apply.'
      : '\nMigration complete.'
  );

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Migration failed:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
