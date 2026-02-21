import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, vehiclesApi } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  NeoBrutalPageHeader,
  NeoBrutalCardCompact,
  NeoBrutalSectionTitle,
  NeoBrutalLabel,
  NeoBrutalSelectCompact,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NeoBrutalPageHeader
          title="Operational Analytics & Financial Reports"
          subtitle="Fuel efficiency (km/L), Vehicle ROI, CSV/PDF exports"
        />

        <div>
          <NeoBrutalLabel>Vehicle (for per-vehicle metrics)</NeoBrutalLabel>
          <NeoBrutalSelectCompact
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
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
              label="Fuel Efficiency (km/L)"
              value={fuelEfficiency ? `${fuelEfficiency.kmPerL.toFixed(2)}` : "—"}
              sub={fuelEfficiency ? `Total km: ${fuelEfficiency.totalKm}, Liters: ${fuelEfficiency.totalLiters}` : "No data"}
              bg="#60A5FA"
            />
            <NeoBrutalStatCard
              label="Vehicle Cost Summary (ROI)"
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
