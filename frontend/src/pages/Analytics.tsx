import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, vehiclesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  const [vehicleId, setVehicleId] = useState("");
  const vid = vehicleId ? Number(vehicleId) : undefined;

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.list(),
  });

  const { data: fuelEfficiency } = useQuery({
    queryKey: ["analytics", "fuel-efficiency", vid],
    queryFn: () => analyticsApi.getFuelEfficiency(vid!),
    enabled: !!vid,
  });

  const { data: vehicleROI } = useQuery({
    queryKey: ["analytics", "vehicle-roi", vid],
    queryFn: () => analyticsApi.getVehicleROI(vid!),
    enabled: !!vid,
  });

  const { data: monthlyFuel } = useQuery({
    queryKey: ["analytics", "monthly-fuel", vid],
    queryFn: () => analyticsApi.getMonthlyFuel(vid),
  });

  const { data: driverSafety = [] } = useQuery({
    queryKey: ["analytics", "driver-safety"],
    queryFn: () => analyticsApi.getDriverSafety() as Promise<unknown[]>,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Operational Analytics & Financial Reports</h1>
        <p className="text-muted-foreground text-sm">Fuel efficiency (km/L), Vehicle ROI, CSV/PDF exports</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Vehicle (for per-vehicle metrics)</label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Select vehicle</option>
          {(vehicles as { id: number; name: string; licensePlate: string }[]).map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.licensePlate})
            </option>
          ))}
        </select>
      </div>

      {vid && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Fuel efficiency (km / L)</CardTitle>
            </CardHeader>
            <CardContent>
              {fuelEfficiency ? (
                <p>
                  <strong>{fuelEfficiency.kmPerL.toFixed(2)}</strong> km/L
                  <span className="text-muted-foreground text-sm block">
                    Total km: {fuelEfficiency.totalKm}, Liters: {fuelEfficiency.totalLiters}
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vehicle cost summary (ROI inputs)</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleROI && typeof vehicleROI === "object" && "totalOperationalCost" in vehicleROI ? (
                <p>
                  Total operational cost: <strong>{(vehicleROI as { totalOperationalCost: number }).totalOperationalCost}</strong>
                  <span className="text-muted-foreground text-sm block">
                    (Revenue − (Maintenance + Fuel)) / Acquisition Cost — add revenue & acquisition in schema for full ROI
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Monthly fuel summary</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyFuel && Object.keys(monthlyFuel).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Month</th>
                    <th className="text-left py-2 px-2">Liters</th>
                    <th className="text-left py-2 px-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthlyFuel).map(([month, data]) => (
                    <tr key={month} className="border-b border-border/50">
                      <td className="py-2 px-2">{month}</td>
                      <td className="py-2 px-2">{(data as { liters: number }).liters}</td>
                      <td className="py-2 px-2">{(data as { cost: number }).cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No monthly fuel data</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Driver safety summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">License expiry</th>
                  <th className="text-left py-2 px-2">Safety score</th>
                  <th className="text-left py-2 px-2">Trip completion %</th>
                  <th className="text-left py-2 px-2">Trips</th>
                </tr>
              </thead>
              <tbody>
                {(driverSafety as { name: string; licenseExpiry: string; safetyScore: number | null; tripCompletionRate: number | null; _count: { trips: number } }[]).map((d: { id: number; name: string; licenseExpiry: string; safetyScore: number | null; tripCompletionRate: number | null; _count: { trips: number } }) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-2 px-2">{d.name}</td>
                    <td className="py-2 px-2">{new Date(d.licenseExpiry).toLocaleDateString()}</td>
                    <td className="py-2 px-2">{d.safetyScore ?? "—"}</td>
                    <td className="py-2 px-2">{d.tripCompletionRate != null ? `${d.tripCompletionRate.toFixed(1)}%` : "—"}</td>
                    <td className="py-2 px-2">{d._count?.trips ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
