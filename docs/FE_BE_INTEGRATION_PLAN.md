# FE–BE Integration Plan (Non-Auth)

## Current BE Routes (no config/setup changes)

| Area        | Routes | Notes |
|------------|--------|--------|
| Dashboard  | `GET /dashboard/kpis` | KPIs: activeFleetCount, maintenanceAlertsCount, utilizationRatePct, pendingCargoCount |
| Vehicles   | `GET/POST /vehicles`, `GET/PATCH /vehicles/:id`, `POST /vehicles/:id/out-of-service`, `GET /vehicles/available` | Query: vehicleType, status, region, retired. Create: name, model, licensePlate, maxCapacityKg, odometer, vehicleType, region |
| Trips      | `GET/POST /trips`, `GET /trips/:id`, `POST /trips/validate`, `POST /trips/:id/dispatch`, `POST /trips/:id/complete`, `POST /trips/:id/cancel` | Create: vehicleId, driverId, cargoWeightKg, origin?, destination?. Query: status, vehicleId, driverId |
| Maintenance| `GET /maintenance?vehicleId=`, `POST /maintenance`, `POST /maintenance/vehicle/:id/release` | Create: vehicleId, description, serviceType?, cost? |
| Drivers    | `GET/POST /drivers`, `GET/PATCH /drivers/:id`, `GET /drivers/available` | Query: status. Create: name, licenseNumber, licenseExpiry (ISO/YYYY-MM-DD), licenseCategory |
| Fuel       | `POST /fuel`, `GET /fuel/vehicle/:id`, `GET /fuel/vehicle/:id/operational-cost`, `GET /fuel/vehicle/:id/cost-per-km` | Create: vehicleId, tripId?, liters, cost, date (ISO or YYYY-MM-DD) |
| Analytics  | `GET /analytics/fuel-efficiency/vehicle/:id`, `GET /analytics/vehicle-roi/:id`, `GET /analytics/monthly-fuel?vehicleId=`, `GET /analytics/driver-safety` | Requires FLEET_MANAGER or FINANCIAL_ANALYST (RBAC) |

## FE Integration Status

- **Dashboard**: Uses `dashboardApi.getKPIs()`, `tripsApi.list()` — integrated. Toolbar: client-side filter/sort/search on trips.
- **Vehicles**: Uses `vehiclesApi.list(typeFilter, statusFilter)`, create, setOutOfService — integrated. Toolbar: client-side search; Filter/Type wired to API.
- **Trips**: Uses tripsApi list, create, dispatch, complete — integrated. Create body matches BE (estimatedFuelCost is FE-only). Validate before create for instant “Too heavy!” feedback.
- **Maintenance**: Uses maintenanceApi.list(vehicleId), create — integrated. Toolbar: “Filter by vehicle” for list.
- **Drivers**: Uses driversApi.list(status), create, update — integrated. Complaints column: FE shows 0 (no BE field yet).
- **FuelExpense**: Uses fuelApi.create, listByVehicle, getOperationalCost — integrated. Optional: link fuel log to trip (tripId).
- **Analytics**: Uses all four analytics endpoints — integrated. Charts use real/derived data; placeholders when no data.

## Optional Schema Changes (later, if needed)

- **Driver**: `complaints Int @default(0)` — for “Complaints” column.
- **MaintenanceLog**: `status String @default("New")` — for “New”/“Done” etc.
- **Trip**: `estimatedFuelCost Float?` — if we want to store estimated fuel on trip.

No schema or config changes required for current integration.

## RBAC Note

- Analytics routes require `FLEET_MANAGER` or `FINANCIAL_ANALYST`. DISPATCHER gets 403. FE can show a friendly message on 403 (e.g. “You don’t have access to this section”).
