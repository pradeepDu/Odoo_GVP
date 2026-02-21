import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { analyticsApi, dashboardApi, vehiclesApi } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  NeoBrutalPageHeader,
  NeoBrutalCardCompact,
  NeoBrutalSectionTitle,
  NeoBrutalLabel,
  NeoBrutalSelectCompact,
  NeoBrutalButton,
  NeoBrutalTable,
  NeoBrutalTHead,
  NeoBrutalTH,
  NeoBrutalTBody,
  NeoBrutalTR,
  NeoBrutalTD,
  NeoBrutalStatCard,
} from "@/components/ui/neo-brutual-card";

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

  const { data: kpis } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => dashboardApi.getKPIs(),
  });

  const { data: topCostliest = [] } = useQuery({
    queryKey: ["analytics", "top-costliest"],
    queryFn: () => analyticsApi.getTopCostliestVehicles(5),
  });

  const { data: monthlyFinancial = [] } = useQuery({
    queryKey: ["analytics", "monthly-financial", vid],
    queryFn: () => analyticsApi.getMonthlyFinancial(vid),
  });

  const totalFuelCost =
    monthlyFinancial.length > 0
      ? monthlyFinancial.reduce((sum, row) => sum + row.fuelCost, 0)
      : 0;
  const totalOperationalCost =
    monthlyFinancial.length > 0
      ? monthlyFinancial.reduce((sum, row) => sum + row.totalCost, 0)
      : 0;
  const utilizationRate = kpis?.utilizationRatePct ?? 0;

  const fuelCostTrendData =
    monthlyFinancial.length > 0
      ? monthlyFinancial.map((row) => ({ month: row.month, fuelCost: row.fuelCost, totalCost: row.totalCost }))
      : [];

  const costliestChartData = topCostliest.map((v) => ({ vehicle: v.vehicleName, cost: v.totalOperationalCost }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NeoBrutalPageHeader
          title="Operational Analytics & Financial Reports"
          subtitle="Big picture — charts and reports for smarter decisions; fuel efficiency, ROI, dead stock alerts"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <NeoBrutalStatCard
            label="Total Fuel Cost"
            value={totalFuelCost >= 100000 ? `₹${(totalFuelCost / 100000).toFixed(1)}L` : `₹${totalFuelCost.toLocaleString()}`}
            sub="From fuel logs"
            bg="#60A5FA"
          />
          <NeoBrutalStatCard
            label="Total Operational Cost"
            value={totalOperationalCost >= 100000 ? `₹${(totalOperationalCost / 100000).toFixed(1)}L` : `₹${totalOperationalCost.toLocaleString()}`}
            sub="Fuel + Maintenance"
            bg="#4ADE80"
          />
          <NeoBrutalStatCard
            label="Utilization Rate"
            value={`${utilizationRate}%`}
            sub="Fleet working vs idle (from DB)"
            bg="#FFDE00"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <NeoBrutalCardCompact>
            <NeoBrutalSectionTitle>Monthly Fuel & Operational Cost Trend</NeoBrutalSectionTitle>
            <div className="h-64">
              {fuelCostTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelCostTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} />
                    <YAxis tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} />
                    <Tooltip contentStyle={{ border: "4px solid black", fontWeight: "bold" }} />
                    <Legend />
                    <Line type="monotone" dataKey="fuelCost" name="Fuel (₹)" stroke="#000" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalCost" name="Total ops (₹)" stroke="#666" strokeDasharray="4 4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-black/60 font-bold text-sm flex items-center justify-center h-full">No fuel/maintenance data yet. Add fuel logs and maintenance to see trend.</p>
              )}
            </div>
          </NeoBrutalCardCompact>
          <NeoBrutalCardCompact>
            <NeoBrutalSectionTitle>Top 5 Costliest Vehicles (operational cost)</NeoBrutalSectionTitle>
            <div className="h-64">
              {costliestChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costliestChartData} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.2} />
                    <XAxis type="number" tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} />
                    <YAxis type="category" dataKey="vehicle" tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} width={55} />
                    <Tooltip contentStyle={{ border: "4px solid black", fontWeight: "bold" }} />
                    <Bar dataKey="cost" name="Cost (₹)" fill="#FF6B6B" stroke="#000" strokeWidth={2} radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-black/60 font-bold text-sm flex items-center justify-center h-full">No vehicle cost data. Add fuel and maintenance logs.</p>
              )}
            </div>
          </NeoBrutalCardCompact>
        </div>

        <NeoBrutalCardCompact>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <NeoBrutalSectionTitle>Monthly Financial Summary (Fuel + Maintenance)</NeoBrutalSectionTitle>
            <NeoBrutalButton variant="outline" size="sm" type="button">
              Download PDF / Excel
            </NeoBrutalButton>
          </div>
          {monthlyFinancial.length > 0 ? (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>Month</NeoBrutalTH>
                <NeoBrutalTH>Fuel Cost (₹)</NeoBrutalTH>
                <NeoBrutalTH>Maintenance (₹)</NeoBrutalTH>
                <NeoBrutalTH>Total (₹)</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {monthlyFinancial.map((row) => (
                  <NeoBrutalTR key={row.month}>
                    <NeoBrutalTD>{row.month}</NeoBrutalTD>
                    <NeoBrutalTD>{row.fuelCost.toLocaleString()}</NeoBrutalTD>
                    <NeoBrutalTD>{row.maintenanceCost.toLocaleString()}</NeoBrutalTD>
                    <NeoBrutalTD>{row.totalCost.toLocaleString()}</NeoBrutalTD>
                  </NeoBrutalTR>
                ))}
              </NeoBrutalTBody>
            </NeoBrutalTable>
          ) : (
            <p className="text-black/60 font-bold text-sm">No monthly financial data. Add fuel and maintenance logs.</p>
          )}
        </NeoBrutalCardCompact>

        <div>
          <NeoBrutalLabel>Vehicle (for per-vehicle metrics)</NeoBrutalLabel>
          <NeoBrutalSelectCompact value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select vehicle</option>
            {(vehicles as { id: number; name: string; licensePlate: string }[]).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.licensePlate})
              </option>
            ))}
          </NeoBrutalSelectCompact>
        </div>

        {vid && (
          <div className="grid gap-4 md:grid-cols-2">
            <NeoBrutalStatCard
              label={fuelEfficiency ? `Fuel Efficiency (km/L) — ${fuelEfficiency.vehicleName}` : "Fuel Efficiency (km/L) — selected vehicle"}
              value={fuelEfficiency
                ? (fuelEfficiency.totalLiters > 0 ? `${fuelEfficiency.kmPerL.toFixed(2)}` : "—")
                : "—"}
              sub={
                fuelEfficiency
                  ? fuelEfficiency.totalLiters > 0
                    ? `Total km: ${fuelEfficiency.totalKm.toFixed(1)}, Liters: ${fuelEfficiency.totalLiters.toFixed(1)} (${fuelEfficiency.completedTripsCount} trips, ${fuelEfficiency.fuelLogsCount} fuel logs)`
                    : "No fuel logs or completed trips with odometer data"
                  : "Loading…"
              }
              bg="#60A5FA"
            />
            <NeoBrutalStatCard
              label={vehicleROI ? `Vehicle cost — ${vehicleROI.vehicleName}` : "Vehicle cost — selected vehicle"}
              value={
                vehicleROI
                  ? `₹${vehicleROI.totalOperationalCost.toLocaleString()}`
                  : "—"
              }
              sub={
                vehicleROI
                  ? `Fuel: ₹${vehicleROI.totalFuelCost.toLocaleString()} (${vehicleROI.fuelLogsCount} logs) · Maintenance: ₹${vehicleROI.totalMaintenanceCost.toLocaleString()} (${vehicleROI.maintenanceLogsCount} logs)`
                  : "Loading…"
              }
              bg="#FBBF24"
            />
          </div>
        )}

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Monthly Fuel Summary</NeoBrutalSectionTitle>
          {monthlyFuel && Object.keys(monthlyFuel).length > 0 ? (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>Month</NeoBrutalTH>
                <NeoBrutalTH>Liters</NeoBrutalTH>
                <NeoBrutalTH>Cost</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {Object.entries(monthlyFuel).map(([month, data]) => (
                  <NeoBrutalTR key={month}>
                    <NeoBrutalTD>{month}</NeoBrutalTD>
                    <NeoBrutalTD>{(data as { liters: number }).liters}</NeoBrutalTD>
                    <NeoBrutalTD>{(data as { cost: number }).cost}</NeoBrutalTD>
                  </NeoBrutalTR>
                ))}
              </NeoBrutalTBody>
            </NeoBrutalTable>
          ) : (
            <p className="text-black/60 font-bold text-sm">No monthly fuel data</p>
          )}
        </NeoBrutalCardCompact>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Driver Safety Summary</NeoBrutalSectionTitle>
          <NeoBrutalTable>
            <NeoBrutalTHead>
              <NeoBrutalTH>Name</NeoBrutalTH>
              <NeoBrutalTH>License Expiry</NeoBrutalTH>
              <NeoBrutalTH>Safety Score</NeoBrutalTH>
              <NeoBrutalTH>{"Trip Completion %"}</NeoBrutalTH>
              <NeoBrutalTH>Trips</NeoBrutalTH>
            </NeoBrutalTHead>
            <NeoBrutalTBody>
              {(driverSafety as { id: number; name: string; licenseExpiry: string; safetyScore: number | null; tripCompletionRate: number | null; _count: { trips: number } }[]).map((d) => (
                <NeoBrutalTR key={d.id}>
                  <NeoBrutalTD>{d.name}</NeoBrutalTD>
                  <NeoBrutalTD>{new Date(d.licenseExpiry).toLocaleDateString()}</NeoBrutalTD>
                  <NeoBrutalTD>{d.safetyScore ?? "—"}</NeoBrutalTD>
                  <NeoBrutalTD>{d.tripCompletionRate != null ? `${d.tripCompletionRate.toFixed(1)}%` : "—"}</NeoBrutalTD>
                  <NeoBrutalTD>{d._count?.trips ?? 0}</NeoBrutalTD>
                </NeoBrutalTR>
              ))}
            </NeoBrutalTBody>
          </NeoBrutalTable>
        </NeoBrutalCardCompact>
      </div>
    </DashboardLayout>
  );
}
