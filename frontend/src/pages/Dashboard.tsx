import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { dashboardApi, tripsApi } from "@/lib/api";
import { SideDrawer } from "@/components/SideDrawer";
import { StatusPill } from "@/components/StatusPill";
import { useUIStore } from "@/stores/uiStore";
import { Truck, Wrench, PieChart, Package } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  NeoBrutalPageHeader,
  NeoBrutalStatCard,
  NeoBrutalCardCompact,
  NeoBrutalSectionTitle,
  NeoBrutalButton,
  NeoBrutalBadge,
  NeoBrutalTable,
  NeoBrutalTHead,
  NeoBrutalTH,
  NeoBrutalTBody,
  NeoBrutalTR,
  NeoBrutalTD,
} from "@/components/ui/neo-brutual-card";

type TripRow = {  
  id: number;
  cargoWeightKg: number;
  status: string;
  origin: string | null;
  destination: string | null;
  vehicle: { name: string; licensePlate: string };
  driver: { name: string };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedTripId, setSelectedTripId } = useUIStore();

  const { data: kpis, isLoading: kpisLoading, error } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => dashboardApi.getKPIs(),
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips", "recent"],
    queryFn: () => tripsApi.list() as Promise<TripRow[]>,
  });

  const { data: selectedTrip } = useQuery({
    queryKey: ["trips", selectedTripId],
    queryFn: () => tripsApi.getById(selectedTripId!),
    enabled: selectedTripId != null,
  });

  if (kpisLoading) return <DashboardLayout><p className="text-black font-bold">Loading KPIs...</p></DashboardLayout>;
  if (error) return <DashboardLayout><p className="text-black font-bold">Failed to load dashboard.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <NeoBrutalPageHeader title="Command Center" subtitle="High-level fleet oversight" />
          <div className="flex gap-2">
            <NeoBrutalButton variant="primary" size="sm" type="button" onClick={() => navigate("/trips")}>
              New Trip
            </NeoBrutalButton>
            <NeoBrutalButton variant="outline" size="sm" type="button" onClick={() => navigate("/vehicles")}>
              New Vehicle
            </NeoBrutalButton>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <NeoBrutalStatCard
            label="Active Fleet"
            value={kpis?.activeFleetCount ?? 0}
            sub="On Trip"
            bg="#60A5FA"
            icon={<Truck size={28} />}
          />
          <NeoBrutalStatCard
            label="Maintenance Alerts"
            value={kpis?.maintenanceAlertsCount ?? 0}
            sub="In Shop"
            bg="#FBBF24"
            icon={<Wrench size={28} />}
          />
          <NeoBrutalStatCard
            label="Utilization Rate"
            value={`${kpis?.utilizationRatePct ?? 0}%`}
            sub="Fleet assigned vs idle"
            bg="#FFDE00"
            icon={<PieChart size={28} />}
          />
          <NeoBrutalStatCard
            label="Pending Cargo"
            value={kpis?.pendingCargoCount ?? 0}
            sub="Shipments waiting"
            bg="#4ADE80"
            icon={<Package size={28} />}
          />
        </div>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Recent Trips</NeoBrutalSectionTitle>
          {tripsLoading ? (
            <p className="text-black/60 font-bold text-sm">Loading...</p>
          ) : (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>Trip</NeoBrutalTH>
                <NeoBrutalTH>Vehicle</NeoBrutalTH>
                <NeoBrutalTH>Driver</NeoBrutalTH>
                <NeoBrutalTH>Status</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {trips.slice(0, 5).map((t) => (
                  <NeoBrutalTR key={t.id}>
                    <NeoBrutalTD>#{t.id}</NeoBrutalTD>
                    <NeoBrutalTD>{t.vehicle ? `${t.vehicle.name} (${t.vehicle.licensePlate})` : "—"}</NeoBrutalTD>
                    <NeoBrutalTD>{t.driver?.name ?? "—"}</NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalBadge color={
                        t.status === "COMPLETED" ? "#4ADE80" :
                        t.status === "DISPATCHED" ? "#60A5FA" :
                        t.status === "CANCELLED" ? "#FF6B6B" : "#FBBF24"
                      }>
                        {t.status}
                      </NeoBrutalBadge>
                    </NeoBrutalTD>
                  </NeoBrutalTR>
                ))}
              </NeoBrutalTBody>
            </NeoBrutalTable>
          )}
        </NeoBrutalCardCompact>
      </div>

      <SideDrawer
        open={selectedTripId != null}
        onClose={() => setSelectedTripId(null)}
        title={selectedTrip ? `Trip #${selectedTrip.id}` : "Trip detail"}
        width="md"
      >
        {selectedTrip && (
          <div className="space-y-3 text-sm font-bold font-mono text-black">
            <p><span className="text-black/50 uppercase text-xs">Vehicle:</span> {(selectedTrip as { vehicle?: { name: string; licensePlate: string } }).vehicle?.name} ({(selectedTrip as { vehicle?: { licensePlate: string } }).vehicle?.licensePlate})</p>
            <p><span className="text-black/50 uppercase text-xs">Driver:</span> {(selectedTrip as { driver?: { name: string } }).driver?.name}</p>
            <p><span className="text-black/50 uppercase text-xs">Status:</span> <StatusPill status={(selectedTrip as { status: string }).status} /></p>
            <p><span className="text-black/50 uppercase text-xs">Origin:</span> {(selectedTrip as { origin: string | null }).origin ?? "—"}</p>
            <p><span className="text-black/50 uppercase text-xs">Destination:</span> {(selectedTrip as { destination: string | null }).destination ?? "—"}</p>
            <p><span className="text-black/50 uppercase text-xs">Cargo:</span> {(selectedTrip as { cargoWeightKg: number }).cargoWeightKg} kg</p>
          </div>
        )}
      </SideDrawer>
    </DashboardLayout>
  );
}
