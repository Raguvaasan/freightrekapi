"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteB2bVehicle = exports.deactivateB2bVehicle = exports.updateB2bVehicle = exports.getB2bVehicle = exports.listB2bVehicles = exports.createB2bVehicle = void 0;
const vehicle_service_1 = require("../../services/b2b/vehicle.service");
const createB2bVehicle = async (req, res) => res.status(201).json(await vehicle_service_1.b2bVehicleService.create(req.body));
exports.createB2bVehicle = createB2bVehicle;
const listB2bVehicles = async (req, res) => res.json(await vehicle_service_1.b2bVehicleService.list(req.query));
exports.listB2bVehicles = listB2bVehicles;
const getB2bVehicle = async (req, res) => {
    const result = await vehicle_service_1.b2bVehicleService.getById(String(req.params.id));
    return res.status(result.success ? 200 : 404).json(result);
};
exports.getB2bVehicle = getB2bVehicle;
const updateB2bVehicle = async (req, res) => res.json(await vehicle_service_1.b2bVehicleService.update(String(req.params.id), req.body));
exports.updateB2bVehicle = updateB2bVehicle;
const deactivateB2bVehicle = async (req, res) => res.json(await vehicle_service_1.b2bVehicleService.deactivate(String(req.params.id)));
exports.deactivateB2bVehicle = deactivateB2bVehicle;
const deleteB2bVehicle = async (req, res) => res.json(await vehicle_service_1.b2bVehicleService.delete(String(req.params.id)));
exports.deleteB2bVehicle = deleteB2bVehicle;
