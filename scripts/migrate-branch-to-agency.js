/**
 * Migration: rename the "branch" fields to "agency", and backfill the charge
 * breakdown + agency ownership type.
 *
 * Safe to run more than once — every step only touches documents that still
 * need it, so a second run reports 0 changes.
 *
 *   node scripts/migrate-branch-to-agency.js            # apply
 *   node scripts/migrate-branch-to-agency.js --dry-run  # report only
 *
 * What it does:
 *   parcelorders       branch -> agency
 *                      deliveryCustomer.deliveryBranch -> ...deliveryAgency
 *                      backfills loadingCharge / miscellaneousCharge / totalAmount
 *   parcelsettlements  branch -> agency
 *                      branchProfitAmount -> agencyProfitAmount
 *                      branchDebitTransactionId -> agencyDebitTransactionId
 *                      branchRefundTransactionId -> agencyRefundTransactionId
 *                      adjustments[].branchTransactionId -> agencyTransactionId
 *   agencies           sets type = 'Third Party' where missing, the default
 *                      loading / miscellaneous percentages (10%), and the
 *                      boolean agencyType mirror of `type`
 */
require('dotenv').config();
const mongoose = require('mongoose');

const DRY_RUN = process.argv.includes('--dry-run');
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`Connected to "${mongoose.connection.name}"${DRY_RUN ? ' (dry run)' : ''}\n`);

  const report = [];
  const step = async (label, count, apply) => {
    if (DRY_RUN || count === 0) {
      report.push(`${count} ${label}${DRY_RUN && count ? ' (would change)' : ''}`);
      return;
    }
    const result = await apply();
    report.push(`${result} ${label}`);
  };

  // ---------------------------------------------------------- parcel orders
  const orders = db.collection('parcelorders');

  const ordersToRename = await orders.countDocuments({ branch: { $exists: true } });
  await step('parcel orders: branch -> agency', ordersToRename, async () => {
    const r = await orders.updateMany(
      { branch: { $exists: true } },
      { $rename: { branch: 'agency' } }
    );
    return r.modifiedCount;
  });

  const deliveryToRename = await orders.countDocuments({
    'deliveryCustomer.deliveryBranch': { $exists: true },
  });
  await step(
    'parcel orders: deliveryBranch -> deliveryAgency',
    deliveryToRename,
    async () => {
      const r = await orders.updateMany(
        { 'deliveryCustomer.deliveryBranch': { $exists: true } },
        {
          $rename: {
            'deliveryCustomer.deliveryBranch': 'deliveryCustomer.deliveryAgency',
          },
        }
      );
      return r.modifiedCount;
    }
  );

  // Backfill the charge breakdown. Orders booked before loading/miscellaneous
  // existed keep their transportation charge as the total, so no settlement or
  // invoice figure shifts underneath them.
  const needCharges = await orders
    .find({ totalAmount: { $exists: false } })
    .project({ transportationCharge: 1 })
    .toArray();

  await step('parcel orders: charge breakdown backfilled', needCharges.length, async () => {
    let changed = 0;
    for (const order of needCharges) {
      const base = round2(order.transportationCharge || 0);
      await orders.updateOne(
        { _id: order._id },
        {
          $set: {
            loadingChargePercentage: 0,
            loadingCharge: 0,
            miscChargePercentage: 0,
            miscellaneousCharge: 0,
            totalAmount: base,
          },
        }
      );
      changed++;
    }
    return changed;
  });

  // ------------------------------------------------------------ settlements
  const settlements = db.collection('parcelsettlements');

  const settlementRenames = {
    branch: 'agency',
    branchProfitAmount: 'agencyProfitAmount',
    branchDebitTransactionId: 'agencyDebitTransactionId',
    branchRefundTransactionId: 'agencyRefundTransactionId',
  };

  for (const [from, to] of Object.entries(settlementRenames)) {
    const count = await settlements.countDocuments({ [from]: { $exists: true } });
    await step(`settlements: ${from} -> ${to}`, count, async () => {
      const r = await settlements.updateMany(
        { [from]: { $exists: true } },
        { $rename: { [from]: to } }
      );
      return r.modifiedCount;
    });
  }

  // $rename cannot reach into array elements, so adjustments are rewritten
  const withAdjustments = await settlements
    .find({ 'adjustments.branchTransactionId': { $exists: true } })
    .project({ adjustments: 1 })
    .toArray();

  await step(
    'settlements: adjustments[].branchTransactionId -> agencyTransactionId',
    withAdjustments.length,
    async () => {
      let changed = 0;
      for (const doc of withAdjustments) {
        const adjustments = (doc.adjustments || []).map((a) => {
          if (!a || a.branchTransactionId === undefined) return a;
          const { branchTransactionId, ...rest } = a;
          return { ...rest, agencyTransactionId: branchTransactionId };
        });
        await settlements.updateOne({ _id: doc._id }, { $set: { adjustments } });
        changed++;
      }
      return changed;
    }
  );

  // --------------------------------------------------------------- agencies
  const agencies = db.collection('agencies');

  const needType = await agencies.countDocuments({ type: { $exists: false } });
  await step("agencies: type defaulted to 'Third Party'", needType, async () => {
    const r = await agencies.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'Third Party' } }
    );
    return r.modifiedCount;
  });

  const needLoading = await agencies.countDocuments({
    loadingChargePercentage: { $exists: false },
  });
  await step('agencies: loading charge % defaulted to 10', needLoading, async () => {
    const r = await agencies.updateMany(
      { loadingChargePercentage: { $exists: false } },
      { $set: { loadingChargePercentage: 10 } }
    );
    return r.modifiedCount;
  });

  const needMisc = await agencies.countDocuments({
    miscChargePercentage: { $exists: false },
  });
  await step('agencies: miscellaneous charge % defaulted to 10', needMisc, async () => {
    const r = await agencies.updateMany(
      { miscChargePercentage: { $exists: false } },
      { $set: { miscChargePercentage: 10 } }
    );
    return r.modifiedCount;
  });

  // `agencyType` is the boolean spelling of `type` that the create/edit form
  // sends (true = Own). Older agencies either lack it or still hold the old
  // free-text descriptor, so it is rewritten from `type` either way.
  const needAgencyType = await agencies.countDocuments({
    $or: [{ agencyType: { $exists: false } }, { agencyType: { $type: 'string' } }],
  });
  await step('agencies: agencyType set from type', needAgencyType, async () => {
    const own = await agencies.updateMany(
      {
        type: 'Own',
        $or: [{ agencyType: { $exists: false } }, { agencyType: { $type: 'string' } }],
      },
      { $set: { agencyType: true } }
    );
    const third = await agencies.updateMany(
      {
        type: { $ne: 'Own' },
        $or: [{ agencyType: { $exists: false } }, { agencyType: { $type: 'string' } }],
      },
      { $set: { agencyType: false } }
    );
    return own.modifiedCount + third.modifiedCount;
  });

  // An "Own" agency must never carry a commission
  const ownWithCommission = await agencies.countDocuments({
    type: 'Own',
    profitPercentage: { $gt: 0 },
  });
  await step(
    'agencies: commission cleared on Own agencies',
    ownWithCommission,
    async () => {
      const r = await agencies.updateMany(
        { type: 'Own', profitPercentage: { $gt: 0 } },
        { $set: { profitPercentage: 0 } }
      );
      return r.modifiedCount;
    }
  );

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
