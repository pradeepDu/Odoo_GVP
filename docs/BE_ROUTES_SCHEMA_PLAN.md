# Backend Routes, Schema & Data Relations Plan

**Guardrails:** No changes to Prisma config (datasource/generator), env, or app entry. Only: controllers, services, routes, and minimal schema additions if needed.

---

## 1. Existing BE Routes (all wired to FE)

| Method | Path | Controller | Purpose | FE usage |
|--------|------|------------|---------|----------|
| **Auth** | | | | |
| POST | `/auth/login` | AuthController | Login | Login page |
| POST | `/auth/register` | AuthController | Register | Register page |
| POST | `/auth/forgot-password` | AuthController | Forgot password | ForgotPassword |
| POST | `/auth/reset-password` | AuthController | Reset password | ResetPassword |
| POST | `/auth/verify-reset-token` | AuthController | Verify token | ResetPassword |
| **Dashboard** | | | | |
| GET | `/dashboard/kpis` | DashboardController | KPIs (active fleet, maintenance, utilization, pending cargo) | Dashboard page |
| **Vehicles** | | | | |
| GET | `/vehicles` | VehicleController | List (query: vehicleType, status, region, retired) | Vehicles page |
| GET | `/vehicles/available` | VehicleController | Available for dispatch | Trips form, Fuel form |
| GET | `/vehicles/:id` | VehicleController | Get one | Detail |
| POST | `/vehicles` | VehicleController | Create | New Vehicle form |
| PATCH | `/vehicles/:id` | VehicleController | Update | - |
| POST | `/vehicles/:id/out-of-service` | VehicleController | Retire/restore | Vehicles table |
| **Trips** | | | | |
| GET | `/trips` | TripController | List (query: status, vehicleId, driverId) | Dashboard, Trips, FuelExpense |
| GET | `/trips/:id` | TripController | Get one (with vehicle, driver, fuelLogs) | Dashboard drawer |
| POST | `/trips/validate` | TripController | Validate create (capacity, driver) | Trips form |
| POST | `/trips` | TripController | Create | Trips form |
| POST | `/trips/:id/dispatch` | TripController | Dispatch | Trips table |
| POST | `/trips/:id/complete` | TripController | Complete (body: endOdometer) | Trips table |
| POST | `/trips/:id/cancel` | TripController | Cancel | - |
| **Maintenance** | | | | |
| GET | `/maintenance` | MaintenanceController | List (query: vehicleId) | Maintenance page |
| GET | `/maintenance/vehicle/:vehicleId` | MaintenanceController | List by vehicle | - |
| POST | `/maintenance` | MaintenanceController | Create (vehicle → IN_SHOP) | New Service form |
| POST | `/maintenance/vehicle/:vehicleId/release` | MaintenanceController | Release vehicle | - |
| **Drivers** | | | | |
| GET | `/drivers` | DriverController | List (query: status) | Trips form, Drivers page, Analytics |
| GET | `/drivers/available` | DriverController | Available for assignment | Trips form |
| GET | `/drivers/:id` | DriverController | Get one | - |
| POST | `/drivers` | DriverController | Create | Add Driver form |
| PATCH | `/drivers/:id` | DriverController | Update (status, etc.) | Drivers table |
| **Fuel** | | | | |
| POST | `/fuel` | FuelController | Create (vehicleId, tripId?, liters, cost, date) | FuelExpense form |
| GET | `/fuel/vehicle/:vehicleId` | FuelController | List by vehicle | FuelExpense |
| GET | `/fuel/vehicle/:vehicleId/operational-cost` | FuelController | Fuel + maintenance cost | FuelExpense |
| GET | `/fuel/vehicle/:vehicleId/cost-per-km` | FuelController | Cost per km | - |
| **Analytics** | | | | |
| GET | `/analytics/fuel-efficiency/vehicle/:vehicleId` | AnalyticsController | km/L, totalKm, totalLiters | Analytics |
| GET | `/analytics/vehicle-roi/:vehicleId` | AnalyticsController | Cost summary | Analytics |
| GET | `/analytics/monthly-fuel` | AnalyticsController | Monthly fuel (query: vehicleId) | Analytics |
| GET | `/analytics/driver-safety` | AnalyticsController | Drivers with safety/completion | Analytics |

All above routes are implemented and connected to FE. No new routes required for current features.

---

## 2. Schema (current – no config change)

- **User, Role, PasswordReset** – Auth.
- **Vehicle** – status, type, odometer, capacity; relations: trips, maintenanceLogs, fuelLogs.
- **Driver** – license, status; **safetyScore**, **tripCompletionRate** (nullable, can be stored or computed).
- **Trip** – vehicle, driver, cargo, status, origin, destination, odometer; relations: fuelLogs.
- **Shipment** – pending cargo (dashboard KPIs).
- **MaintenanceLog** – vehicle, description, cost; vehicle set to IN_SHOP on create.
- **FuelLog** – vehicle, optional trip, liters, cost, date.
- **FleetStats** – cached KPIs (refreshed on trip/maintenance changes).

Optional future schema (only if needed later):

- `Driver.complaints Int @default(0)` – for Complaints column.
- `MaintenanceLog.status String @default("New")` – for log status.
- `Trip.estimatedFuelCost Float?` – if storing estimate.

Not adding these now; no schema change in this pass.

---

## 3. Data relations (consistency)

- **Dashboard KPIs** – From `Vehicle` (ON_TRIP, IN_SHOP, retired), `Shipment` (PENDING_ASSIGNMENT). StatsService.getDashboardKPIs() + refresh on trip/maintenance. **Related.**
- **Trips list** – Includes `vehicle` and `driver`. **Related.**
- **Trip getById** – Includes `vehicle`, `driver`, `fuelLogs`. **Related.**
- **Maintenance list** – Includes `vehicle`. **Related.**
- **Fuel list by vehicle** – Includes `trip`. **Related.**
- **Drivers list** – Returns drivers; **Completion Rate** and **Safety Score** are **calculated** from Trip data (completed vs total non-cancelled) so Performance page is consistent with BE data.
- **Analytics driver-safety** – Uses same computed driver stats. **Related.**

---

## 4. Calculated fields: Completion Rate & Safety Score

- **Completion Rate** = (completed trips / total non-cancelled trips) × 100 per driver.
- **Safety Score** = derived from completion (e.g. same as completion rate until incidents exist).

Implementation:

- **DriverService**: On `list()` and `getById()`, compute completion rate and safety score from Trip counts (groupBy driverId). Return these in the response so FE always gets BE-calculated values.
- **TripService.complete** – Already calls `driverService.recalcTripCompletionRate(driverId)`; keeps DB in sync.
- **TripService.cancel** – After cancel, recalc that driver’s completion rate so list stays consistent.
- **Analytics getDriverSafetySummary** – Use drivers with the same computed stats (e.g. call DriverService or shared helper) so Analytics and Performance page share one source of truth.

---

## 5. FE ↔ BE mapping

- All pages use `frontend/src/lib/api.ts`; base URL from `VITE_API_URL`.
- Dashboard: `dashboardApi.getKPIs()`, `tripsApi.list()`.
- Vehicles: `vehiclesApi.list()`, create, setOutOfService.
- Trips: list, validate, create, dispatch, complete (and cancel if exposed).
- Maintenance: list(vehicleId), create.
- Drivers: list(status), create, update; list returns **computed** completion rate & safety score.
- FuelExpense: fuelApi create, listByVehicle, getOperationalCost; tripsApi.list for “link to trip”.
- Analytics: fuel-efficiency, vehicle-roi, monthly-fuel, driver-safety (all from BE).

No new FE routes needed. Drivers and Analytics both use BE-calculated Completion Rate and Safety Score.

---

## 6. Implementation summary (done)

- **DriverService**
  - `getComputedStatsForAllDrivers()`: groupBy trips (COMPLETED vs non-CANCELLED) per driverId; compute `tripCompletionRate` and `safetyScore` (same value until incidents exist).
  - `list()`: merges computed stats into each driver so FE always gets calculated values.
  - `getById()`: same merge for single driver.
- **TripService.cancel()**: calls `driverService.recalcTripCompletionRate(trip.driverId)` after cancel so driver stats stay consistent.
- **AnalyticsService.getDriverSafetySummary()**: uses `DriverService.list({})` and maps to analytics shape so Analytics and Performance page share the same computed stats.
- **FE**: Drivers page and Analytics already consume `driversApi.list()` and analytics driver-safety; no change needed beyond BE returning computed fields.
