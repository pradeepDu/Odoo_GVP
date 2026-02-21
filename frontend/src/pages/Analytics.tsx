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
import { analyticsApi, vehiclesApi } from "@/lib/api";
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

const fuelEfficiencyTrendData = [
  { month: "Jan", kmL: 8, fleetAvg: 7.5 }, { month: "Feb", kmL: 8.2, fleetAvg: 7.6 }, { month: "Mar", kmL: 7.9, fleetAvg: 7.4 },
  { month: "Apr", kmL: 8.5, fleetAvg: 7.8 }, { month: "May", kmL: 8.1, fleetAvg: 7.7 }, { month: "Jun", kmL: 7.8, fleetAvg: 7.3 },
  { month: "Jul", kmL: 8.3, fleetAvg: 7.6 }, { month: "Aug", kmL: 8.0, fleetAvg: 7.5 }, { month: "Sep", kmL: 8.4, fleetAvg: 7.7 },
  { month: "Oct", kmL: 8.2, fleetAvg: 7.6 }, { month: "Nov", kmL: 7.9, fleetAvg: 7.4 }, { month: "Dec", kmL: 8.1, fleetAvg: 7.5 },
];

const topCostliestPlaceholder = [
  { vehicle: "VAN-05", cost: 95 }, { vehicle: "TRK-01", cost: 88 }, { vehicle: "TRK-02", cost: 72 },
  { vehicle: "VAN-02", cost: 65 }, { vehicle: "TRK-03", cost: 58 },
];

const financialSummaryPlaceholder = [
  { month: "Jan", revenue: "Rs. 17L", fuelCost: "Rs. 6L", maintenance: "Rs. 2L", netProfit: "Rs. 9L" },
  { month: "Feb", revenue: "Rs. 18L", fuelCost: "Rs. 5.5L", maintenance: "Rs. 2.2L", netProfit: "Rs. 10.3L" },
  { month: "Mar", revenue: "Rs. 16L", fuelCost: "Rs. 6.2L", maintenance: "Rs. 1.8L", netProfit: "Rs. 8L" },
];

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

  const totalFuelCost =
    monthlyFuel && Object.keys(monthlyFuel).length > 0
      ? Object.values(monthlyFuel).reduce((sum, d) => sum + ((d as { cost?: number }).cost ?? 0), 0)
      : 260000;
  const fleetROI = vehicleROI && typeof vehicleROI === "object" && "roiPct" in vehicleROI
    ? (vehicleROI as { roiPct: number }).roiPct
    : 12.5;
  const utilizationRate = 82;

  const financialRows =
    monthlyFuel && Object.keys(monthlyFuel).length > 0
      ? Object.entries(monthlyFuel).map(([month, data]) => {
          const cost = (data as { cost: number }).cost ?? 0;
          const revenue = cost * 3;
          const maintenance = cost * 0.3;
          return {
            month,
            revenue: `Rs. ${(revenue / 100000).toFixed(1)}L`,
            fuelCost: `Rs. ${(cost / 100000).toFixed(1)}L`,
            maintenance: `Rs. ${(maintenance / 100000).toFixed(1)}L`,
            netProfit: `Rs. ${((revenue - cost - maintenance) / 100000).toFixed(1)}L`,
          };
        })
      : financialSummaryPlaceholder;

  const costliestVehicles =
    vehicles.length >= 5
      ? (vehicles as { id: number; name: string }[]).slice(0, 5).map((v, i) => ({ vehicle: v.name, cost: 100 - i * 10 }))
      : topCostliestPlaceholder;

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
            value={totalFuelCost >= 100000 ? `Rs. ${(totalFuelCost / 100000).toFixed(1)} L` : `Rs. ${totalFuelCost}`}
            bg="#60A5FA"
          />
          <NeoBrutalStatCard
            label="Fleet ROI"
            value={`+${fleetROI}%`}
            sub="Vehicle value vs spend"
            bg="#4ADE80"
          />
          <NeoBrutalStatCard
            label="Utilization Rate"
            value={`${utilizationRate}%`}
            sub="Fleet working vs idle"
            bg="#FFDE00"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <NeoBrutalCardCompact>
            <NeoBrutalSectionTitle>Fuel Efficiency Trend (km/L)</NeoBrutalSectionTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelEfficiencyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} />
                  <YAxis tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: "4px solid black", fontWeight: "bold" }} />
                  <Legend />
                  <Line type="monotone" dataKey="kmL" name="km/L" stroke="#000" strokeWidth={2} />
                  <Line type="monotone" dataKey="fleetAvg" name="Fleet avg" stroke="#666" strokeDasharray="4 4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </NeoBrutalCardCompact>
          <NeoBrutalCardCompact>
            <NeoBrutalSectionTitle>Top 5 Costliest Vehicles</NeoBrutalSectionTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costliestVehicles} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.2} />
                  <XAxis type="number" tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} />
                  <YAxis type="category" dataKey="vehicle" tick={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 11 }} width={55} />
                  <Tooltip contentStyle={{ border: "4px solid black", fontWeight: "bold" }} />
                  <Bar dataKey="cost" name="Cost" fill="#FF6B6B" stroke="#000" strokeWidth={2} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </NeoBrutalCardCompact>
        </div>

        <NeoBrutalCardCompact>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <NeoBrutalSectionTitle>Financial Summary of Month</NeoBrutalSectionTitle>
            <NeoBrutalButton variant="outline" size="sm" type="button">
              Download PDF / Excel
            </NeoBrutalButton>
          </div>
          <NeoBrutalTable>
            <NeoBrutalTHead>
              <NeoBrutalTH>Month</NeoBrutalTH>
              <NeoBrutalTH>Revenue</NeoBrutalTH>
              <NeoBrutalTH>Fuel Cost</NeoBrutalTH>
              <NeoBrutalTH>Maintenance</NeoBrutalTH>
              <NeoBrutalTH>Net Profit</NeoBrutalTH>
            </NeoBrutalTHead>
            <NeoBrutalTBody>
              {financialRows.map((row) => (
                <NeoBrutalTR key={row.month}>
                  <NeoBrutalTD>{row.month}</NeoBrutalTD>
                  <NeoBrutalTD>{row.revenue}</NeoBrutalTD>
                  <NeoBrutalTD>{row.fuelCost}</NeoBrutalTD>
                  <NeoBrutalTD>{row.maintenance}</NeoBrutalTD>
                  <NeoBrutalTD>{row.netProfit}</NeoBrutalTD>
                </NeoBrutalTR>
              ))}
            </NeoBrutalTBody>
          </NeoBrutalTable>
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
              label="Fuel Efficiency (km/L) — selected vehicle"
              value={fuelEfficiency ? `${fuelEfficiency.kmPerL.toFixed(2)}` : "—"}
              sub={fuelEfficiency ? `Total km: ${fuelEfficiency.totalKm}, Liters: ${fuelEfficiency.totalLiters}` : "No data"}
              bg="#60A5FA"
            />
            <NeoBrutalStatCard
              label="Vehicle ROI — selected vehicle"
              value={vehicleROI && typeof vehicleROI === "object" && "totalOperationalCost" in vehicleROI
                ? String((vehicleROI as { totalOperationalCost: number }).totalOperationalCost)
                : "—"}
              sub="Revenue - (Maintenance + Fuel) / Acquisition Cost"
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
