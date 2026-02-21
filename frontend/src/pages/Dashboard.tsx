import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { dashboardApi, tripsApi } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { KPICard } from "@/components/KPICard";
import { DataTable } from "@/components/DataTable";
import { SideDrawer } from "@/components/SideDrawer";
import { StatusPill } from "@/components/StatusPill";
import { useUIStore } from "@/stores/uiStore";
import type { ColumnDef } from "@tanstack/react-table";
import { Truck, Wrench, PieChart, Package } from "lucide-react";

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

  if (kpisLoading) return <div className="text-muted-foreground">Loading KPIs…</div>;
  if (error) return <div className="text-destructive">Failed to load dashboard.</div>;

  const columns: ColumnDef<TripRow, unknown>[] = [
    { id: "id", header: "Trip", accessorFn: (r) => r.id, cell: (c) => c.getValue() },
    {
      id: "vehicle",
      header: "Vehicle",
      accessorFn: (r) => r.vehicle?.name,
      cell: (c) => {
        const r = c.row.original;
        return r.vehicle ? `${r.vehicle.name} (${r.vehicle.licensePlate})` : "—";
      },
    },
    {
      id: "driver",
      header: "Driver",
      accessorFn: (r) => r.driver?.name,
      cell: (c) => c.row.original.driver?.name ?? "—",
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (r) => r.status,
      cell: (c) => <StatusPill status={String(c.getValue())} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        subtitle="High-level fleet oversight"
        actions={[
          { label: "New Trip", onClick: () => navigate("/trips"), primary: true },
          { label: "New Vehicle", onClick: () => navigate("/vehicles") },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Active Fleet"
          value={kpis?.activeFleetCount ?? 0}
          sub="On Trip"
          icon={Truck}
          accent="blue"
        />
        <KPICard
          label="Maintenance Alerts"
          value={kpis?.maintenanceAlertsCount ?? 0}
          sub="In Shop"
          icon={Wrench}
          accent="amber"
        />
        <KPICard
          label="Utilization Rate"
          value={`${kpis?.utilizationRatePct ?? 0}%`}
          sub="Fleet assigned vs idle"
          icon={PieChart}
        />
        <KPICard
          label="Pending Cargo"
          value={kpis?.pendingCargoCount ?? 0}
          sub="Shipments waiting"
          icon={Package}
          accent="green"
        />
      </div>
      <div>
        <h2 className="mb-2 text-lg font-medium">Recent trips</h2>
        {tripsLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <DataTable<TripRow>
            columns={columns}
            data={trips}
            onRowClick={(row) => setSelectedTripId(row.id)}
            pageSize={5}
          />
        )}
      </div>
      <SideDrawer
        open={selectedTripId != null}
        onClose={() => setSelectedTripId(null)}
        title={selectedTrip ? `Trip #${selectedTrip.id}` : "Trip detail"}
        width="md"
      >
        {selectedTrip && (
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Vehicle:</span> {(selectedTrip as { vehicle?: { name: string; licensePlate: string } }).vehicle?.name} ({(selectedTrip as { vehicle?: { licensePlate: string } }).vehicle?.licensePlate})</p>
            <p><span className="text-muted-foreground">Driver:</span> {(selectedTrip as { driver?: { name: string } }).driver?.name}</p>
            <p><span className="text-muted-foreground">Status:</span> <StatusPill status={(selectedTrip as { status: string }).status} /></p>
            <p><span className="text-muted-foreground">Origin:</span> {(selectedTrip as { origin: string | null }).origin ?? "—"}</p>
            <p><span className="text-muted-foreground">Destination:</span> {(selectedTrip as { destination: string | null }).destination ?? "—"}</p>
            <p><span className="text-muted-foreground">Cargo:</span> {(selectedTrip as { cargoWeightKg: number }).cargoWeightKg} kg</p>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
