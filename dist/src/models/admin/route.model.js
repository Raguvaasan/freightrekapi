"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
const mongoose_1 = require("mongoose");
const routeSchema = new mongoose_1.Schema({
    routeName: {
        type: String,
        required: [true, 'Route name is required'],
        trim: true,
    },
    from: {
        type: String,
        required: [true, 'Origin location is required'],
        trim: true,
    },
    to: {
        type: String,
        required: [true, 'Destination location is required'],
        trim: true,
    },
    branches: {
        type: [String],
        default: [],
    },
    transportationCharge: {
        type: Number,
        default: 0,
        min: [0, 'Transportation charge cannot be negative'],
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
}, {
    timestamps: true,
});
// Prevent duplicate routes for the same origin/destination pair
routeSchema.index({ from: 1, to: 1 }, { unique: true });
routeSchema.index({ status: 1 });
exports.Route = (0, mongoose_1.model)('Route', routeSchema);
