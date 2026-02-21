import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fuelApi, vehiclesApi, tripsApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  NeoBrutalPageHeader,
  NeoBrutalCard,
  NeoBrutalCardCompact,
  NeoBrutalSectionTitle,
  NeoBrutalLabel,
  NeoBrutalInput,
  NeoBrutalSelect,
  NeoBrutalButton,
  NeoBrutalStatCard,
  NeoBrutalTable,
  NeoBrutalTHead,
  NeoBrutalTH,
  NeoBrutalTBody,
  NeoBrutalTR,
  NeoBrutalTD,
} from "@/components/ui/neo-brutual-card";

export default function FuelExpense() {
  const [vehicleId, setVehicleId] = useState("");
  const [tripId, setTripId] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.list(),
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["trips", "for-fuel"],
    queryFn: () => tripsApi.list({ status: "COMPLETED" }) as Promise<{ id: number; vehicleId: number; destination: string | null }[]>,
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["fuel", vehicleId],
    queryFn: () => fuelApi.listByVehicle(Number(vehicleId)) as Promise<unknown[]>,
    enabled: !!vehicleId,
  });

  const { data: operationalCost } = useQuery({
    queryKey: ["fuel", "operational", vehicleId],
    queryFn: () => fuelApi.getOperationalCost(Number(vehicleId)),
    enabled: !!vehicleId,
  });

  const createMutation = useMutation({
    mutationFn: (body: { vehicleId: number; tripId?: number; liters: number; cost: number; date: string }) =>
      fuelApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel"] });
      showSuccess("Fuel log added");
    },
    onError: showApiError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vid = Number(vehicleId);
    const l = Number(liters);
    const c = Number(cost);
    if (!vid || !l || l <= 0 || c < 0) return;
    const tid = tripId ? Number(tripId) : undefined;
    createMutation.mutate({
      vehicleId: vid,
      tripId: tid,
      liters: l,
      cost: c,
      date: date.slice(0, 10),
    });
    setLiters("");
    setCost("");
    setTripId("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NeoBrutalPageHeader
          title="Expense & Fuel Logging"
          subtitle="Financial tracking per asset - Total Operational Cost (Fuel + Maintenance)"
        />

        <NeoBrutalCard>
          <NeoBrutalSectionTitle>Add Fuel Log</NeoBrutalSectionTitle>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <NeoBrutalLabel>Vehicle</NeoBrutalLabel>
              <NeoBrutalSelect
                value={vehicleId}
                onChange={(e) => { setVehicleId(e.target.value); setTripId(""); }}
                required
              >
                <option value="">Select</option>
                {(vehicles as { id: number; name: string; licensePlate: string }[]).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.licensePlate})
                  </option>
                ))}
              </NeoBrutalSelect>
            </div>
            <div>
              <NeoBrutalLabel>Link to trip (optional)</NeoBrutalLabel>
              <NeoBrutalSelect
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
              >
                <option value="">None</option>
                {(trips as { id: number; vehicleId: number; destination: string | null }[])
                  .filter((t) => !vehicleId || t.vehicleId === Number(vehicleId))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Trip #{t.id} {t.destination ? `→ ${t.destination}` : ""}
                    </option>
                  ))}
              </NeoBrutalSelect>
            </div>
            <div>
              <NeoBrutalLabel>Liters</NeoBrutalLabel>
              <NeoBrutalInput
                type="number"
                min="0"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                placeholder="ENTER LITERS"
                required
              />
            </div>
            <div>
              <NeoBrutalLabel>Cost</NeoBrutalLabel>
              <NeoBrutalInput
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="ENTER COST"
                required
              />
            </div>
            <div>
              <NeoBrutalLabel>Date</NeoBrutalLabel>
              <NeoBrutalInput
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <NeoBrutalButton type="submit" disabled={createMutation.isPending} size="sm">
                Add Log
              </NeoBrutalButton>
            </div>
          </form>
        </NeoBrutalCard>

        {vehicleId && (
          <>
            {operationalCost && (
              <div className="grid gap-4 md:grid-cols-3">
                <NeoBrutalStatCard
                  label="Fuel Cost"
                  value={operationalCost.fuelCost}
                  bg="#60A5FA"
                />
                <NeoBrutalStatCard
                  label="Maintenance Cost"
                  value={operationalCost.maintenanceCost}
                  bg="#FBBF24"
                />
                <NeoBrutalStatCard
                  label="Total Operational"
                  value={operationalCost.totalOperationalCost}
                  sub={`Vehicle #${vehicleId}`}
                  bg="#FF6B6B"
                />
              </div>
            )}

            <NeoBrutalCardCompact>
              <NeoBrutalSectionTitle>Fuel Logs</NeoBrutalSectionTitle>
              {isLoading ? (
                <p className="text-black/60 font-bold text-sm">Loading...</p>
              ) : (
                <NeoBrutalTable>
                  <NeoBrutalTHead>
                    <NeoBrutalTH>Liters</NeoBrutalTH>
                    <NeoBrutalTH>Cost</NeoBrutalTH>
                    <NeoBrutalTH>Date</NeoBrutalTH>
                  </NeoBrutalTHead>
                  <NeoBrutalTBody>
                    {(list as { liters: number; cost: number; date: string }[]).map((log, i) => (
                      <NeoBrutalTR key={i}>
                        <NeoBrutalTD>{log.liters}</NeoBrutalTD>
                        <NeoBrutalTD>{log.cost}</NeoBrutalTD>
                        <NeoBrutalTD>{new Date(log.date).toLocaleDateString()}</NeoBrutalTD>
                      </NeoBrutalTR>
                    ))}
                  </NeoBrutalTBody>
                </NeoBrutalTable>
              )}
            </NeoBrutalCardCompact>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
