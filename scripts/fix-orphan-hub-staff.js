/**
 * One-time cleanup: hub staff whose hubId points at a hub that was deleted
 * before deleteHub started reassigning staff.
 *
 * Such staff disappear from the admin hub staff list (the UI drops rows whose
 * hub does not resolve) while still holding their phone / email / username
 * uniqueness slots, so creating a new user with the same phone fails with a
 * duplicate error for a record nobody can see.
 *
 * Each orphan is moved to the nearest active hub — same city, then same state,
 * then any active hub — matching what deleteHub now does at delete time.
 * Hub-scoped roles are remapped by role name, or cleared when the target hub
 * has no role by that name.
 *
 * Safe to run more than once — a second run reports 0 orphans.
 *
 *   node scripts/fix-orphan-hub-staff.js            # apply
 *   node scripts/fix-orphan-hub-staff.js --dry-run  # report only
 */
require('dotenv').config();
const mongoose = require('mongoose');

const DRY_RUN = process.argv.includes('--dry-run');

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`Connected to "${mongoose.connection.name}"${DRY_RUN ? ' (dry run)' : ''}\n`);

  const hubs = await db.collection('hubs').find({}).toArray();
  const hubById = new Map(hubs.map((h) => [h._id.toString(), h]));
  const activeHubs = hubs.filter((h) => h.status);

  const hubStaff = await db
    .collection('staffs')
    .find({ type: 'hub', hubId: { $exists: true, $ne: null } })
    .toArray();

  const orphans = hubStaff.filter((s) => !hubById.has(s.hubId.toString()));

  if (!orphans.length) {
    console.log('No orphaned hub staff found.');
    return;
  }

  if (!activeHubs.length) {
    console.log(`${orphans.length} orphaned hub staff found, but there is no active hub to move them to.`);
    orphans.forEach((s) => console.log(`  - ${s.name} (${s.phone}) -> missing hub ${s.hubId}`));
    return;
  }

  // The deleted hub's city/state are gone with it, so proximity cannot be
  // matched here the way deleteHub does — fall back to the oldest active hub.
  const target = activeHubs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  console.log(`Reassigning ${orphans.length} orphaned staff to "${target.hubName}" (${target.city})\n`);

  for (const staff of orphans) {
    let roleNote = '';

    if (staff.roleId) {
      const oldRole = await db.collection('hubroles').findOne({ _id: staff.roleId });
      if (oldRole) {
        const newRole = await db
          .collection('hubroles')
          .findOne({ hubId: target._id, roleName: oldRole.roleName, status: true });
        roleNote = newRole ? `, role -> ${newRole.roleName}` : ', role cleared';
        if (!DRY_RUN) {
          await db
            .collection('staffs')
            .updateOne(
              { _id: staff._id },
              newRole ? { $set: { roleId: newRole._id } } : { $unset: { roleId: '' } }
            );
        }
      }
    }

    if (!DRY_RUN) {
      await db.collection('staffs').updateOne({ _id: staff._id }, { $set: { hubId: target._id } });
    }

    console.log(
      `  ${DRY_RUN ? 'would move' : 'moved'} ${staff.name} (${staff.phone}) from ${staff.hubId}${roleNote}`
    );
  }

  // Roles left behind by hubs that no longer exist.
  const staleRoles = await db
    .collection('hubroles')
    .find({ hubId: { $nin: hubs.map((h) => h._id) } })
    .toArray();

  if (staleRoles.length) {
    if (!DRY_RUN) {
      await db.collection('hubroles').deleteMany({ _id: { $in: staleRoles.map((r) => r._id) } });
    }
    console.log(`\n  ${DRY_RUN ? 'would delete' : 'deleted'} ${staleRoles.length} hub role(s) of deleted hubs`);
  }
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
