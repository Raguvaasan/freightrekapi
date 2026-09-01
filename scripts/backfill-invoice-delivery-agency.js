/**
 * Migration: give existing invoices the fields the destination agency needs.
 *
 * `deliveryAgency` is now snapshotted onto every invoice so the agency
 * delivering a parcel it did not book can list and print the invoice. Invoices
 * raised before that carry the destination only on their parcel order, so they
 * would keep reading as empty on that agency's screen until backfilled.
 *
 * The pickup / delivery addresses are copied across at the same time, for
 * orders that have them.
 *
 * Safe to run more than once — only documents that still need it are touched,
 * so a second run reports 0 changes.
 *
 *   node scripts/backfill-invoice-delivery-agency.js            # apply
 *   node scripts/backfill-invoice-delivery-agency.js --dry-run  # report only
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

  const invoices = db.collection('invoices');
  const orders = db.collection('parcelorders');

  // ------------------------------------------------- invoices -> deliveryAgency
  const incomplete = await invoices
    .find({
      $or: [
        { deliveryAgency: { $exists: false } },
        { pickupAddress: { $exists: false } },
        { deliveryAddress: { $exists: false } },
      ],
    })
    .project({ order: 1, deliveryAgency: 1, pickupAddress: 1, deliveryAddress: 1 })
    .toArray();

  let updated = 0;
  let orphaned = 0;

  for (const invoice of incomplete) {
    const order = await orders.findOne(
      { _id: invoice.order },
      {
        projection: {
          'deliveryCustomer.deliveryAgency': 1,
          pickupAddress: 1,
          deliveryAddress: 1,
        },
      }
    );

    // The parcel order was deleted; the invoice is kept for the numbering only
    if (!order) {
      orphaned++;
      continue;
    }

    const set = {};
    const destination = order.deliveryCustomer && order.deliveryCustomer.deliveryAgency;
    if (!invoice.deliveryAgency && destination) set.deliveryAgency = destination;
    if (invoice.pickupAddress === undefined && order.pickupAddress !== undefined) {
      set.pickupAddress = order.pickupAddress;
    }
    if (invoice.deliveryAddress === undefined && order.deliveryAddress !== undefined) {
      set.deliveryAddress = order.deliveryAddress;
    }

    if (!Object.keys(set).length) continue;

    if (!DRY_RUN) await invoices.updateOne({ _id: invoice._id }, { $set: set });
    updated++;
  }

  // ------------------------------------------- orders that were never invoiced
  // Not fixed here: raising an invoice has to allocate a number through the
  // API. Reported so they can be picked up with
  //   POST /admin/invoice/order/{orderId}/generate
  const invoicedOrderIds = await invoices.distinct('order');
  const uninvoiced = await orders.countDocuments({ _id: { $nin: invoicedOrderIds } });

  console.log(
    [
      `  ${updated} invoices backfilled${DRY_RUN && updated ? ' (would change)' : ''}`,
      `  ${orphaned} invoices skipped — their parcel order no longer exists`,
      `  ${uninvoiced} parcel orders have no invoice at all (use the generate endpoint)`,
    ].join('\n')
  );
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
