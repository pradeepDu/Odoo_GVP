import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, vehiclesApi, driversApi } from "@/lib/api";
import { showSuccess, showError, showApiError } from "@/lib/toast";
import { StatusPill } from "@/components/StatusPill";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  NeoBrutalPageHeader,
  NeoBrutalCard,
  NeoBrutalCardCompact,
  NeoBrutalSectionTitle,
  NeoBrutalLabel,
  NeoBrutalInput,
  NeoBrutalSelect,
  NeoBrutalSelectCompact,
  NeoBrutalButton,
  NeoBrutalInputCompact,
  NeoBrutalBadge,
  NeoBrutalTable,
  NeoBrutalTHead,
  NeoBrutalTH,
  NeoBrutalTBody,
  NeoBrutalTR,
  NeoBrutalTD,
} from "@/components/ui/neo-brutual-card";

type Trip = {
  id: number;
  cargoWeightKg: number;
  status: string;
  origin: string | null;
  destination: string | null;
  vehicle: { id: number; name: string; licensePlate: string };
  driver: { id: number; name: string };
};

export default function Trips() {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["trips", statusFilter],
    queryFn: () =>
      tripsApi.list({ status: statusFilter || undefined }) as Promise<Trip[]>,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", "available"],
    queryFn: () => vehiclesApi.listAvailable(),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => driversApi.list() as Promise<any[]>,
  });

  const createMutation = useMutation({
    mutationFn: (body: { vehicleId: number; driverId: number; cargoWeightKg: number; origin?: string; destination?: string }) =>
      tripsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      showSuccess("Trip created");
    },
    onError: showApiError,
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: number) => tripsApi.dispatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      showSuccess("Trip dispatched");
    },
    onError: showApiError,
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, endOdometer }: { id: number; endOdometer: number }) =>
      tripsApi.complete(id, endOdometer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      showSuccess("Trip completed");
    },
    onError: showApiError,
  });

  const [form, setForm] = useState({
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    origin: "",
    destination: "",
    estimatedFuelCost: "",
  });
  const [completeOdometer, setCompleteOdometer] = useState<Record<number, string>>({});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleId = Number(form.vehicleId);
    const driverId = Number(form.driverId);
    const cargoWeightKg = Number(form.cargoWeightKg);
    if (!vehicleId || !driverId || !cargoWeightKg) return;
    try {
      const validation = await tripsApi.validate({ vehicleId, driverId, cargoWeightKg });
      if (!validation.ok) {
        showError(validation.error ?? "Validation failed");
        return;
      }
    } catch (err) {
      showApiError(err);
      return;
    }
    createMutation.mutate(
      {
        vehicleId,
        driverId,
        cargoWeightKg,
        origin: form.origin || undefined,
        destination: form.destination || undefined,
      },
      {
        onSuccess: () => {
          setForm({ vehicleId: "", driverId: "", cargoWeightKg: "", origin: "", destination: "", estimatedFuelCost: "" });
        },
      }
    );
  };

  const tripFleetType = (t: Trip) =>
    t.vehicle?.name ?? (t.vehicle as { vehicleType?: string })?.vehicleType ?? "—";

  const filteredTrips = (() => {
    let result = list;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          String(t.id).includes(q) ||
          (t.origin ?? "").toLowerCase().includes(q) ||
          (t.destination ?? "").toLowerCase().includes(q) ||
          (t.vehicle?.name ?? "").toLowerCase().includes(q) ||
          (t.driver?.name ?? "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "origin") result = [...result].sort((a, b) => (a.origin ?? "").localeCompare(b.origin ?? ""));
    if (sortBy === "status") result = [...result].sort((a, b) => a.status.localeCompare(b.status));
    return result;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NeoBrutalPageHeader
          title="Trip Dispatcher & Management"
          subtitle="Set up deliveries and move goods — pick vehicle & driver, track status"
        />

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <NeoBrutalLabel>Search</NeoBrutalLabel>
            <NeoBrutalInput
              type="search"
              placeholder="Search bar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <NeoBrutalLabel>Group by</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="">Group by</option>
              <option value="status">Status</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Filter</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={filter || statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Filter</option>
              <option value="DRAFT">Draft</option>
              <option value="DISPATCHED">On way</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Sort by</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Sort by...</option>
              <option value="origin">Origin</option>
            </NeoBrutalSelectCompact>
          </div>
        </div>

        <NeoBrutalCard>
          <NeoBrutalSectionTitle>New Trip Form</NeoBrutalSectionTitle>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div>
              <NeoBrutalLabel>Select Vehicle:</NeoBrutalLabel>
              <NeoBrutalSelect
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
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
              <NeoBrutalLabel>Cargo Weight (Kg):</NeoBrutalLabel>
              <NeoBrutalInput
                type="number"
                min="0"
                step="0.01"
                value={form.cargoWeightKg}
                onChange={(e) => setForm((f) => ({ ...f, cargoWeightKg: e.target.value }))}
                placeholder="ENTER WEIGHT"
                required
              />
            </div>
            <div>
              <NeoBrutalLabel>Select Driver:</NeoBrutalLabel>
              <NeoBrutalSelect
                value={form.driverId}
                onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                required
              >
                <option value="">Select</option>
                {(drivers as { id: number; name: string }[]).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NeoBrutalSelect>
            </div>
            <div className="sm:col-span-2">
              <NeoBrutalLabel>Origin Address:</NeoBrutalLabel>
              <NeoBrutalInput
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                placeholder="e.g. Mumbai"
              />
            </div>
            <div className="sm:col-span-2">
              <NeoBrutalLabel>Destination:</NeoBrutalLabel>
              <NeoBrutalInput
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                placeholder="e.g. Pune"
              />
            </div>
            <div>
              <NeoBrutalLabel>Estimated Fuel Cost:</NeoBrutalLabel>
              <NeoBrutalInput
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedFuelCost}
                onChange={(e) => setForm((f) => ({ ...f, estimatedFuelCost: e.target.value }))}
                placeholder="ENTER COST"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <NeoBrutalButton type="submit" disabled={createMutation.isPending} size="sm">
                Confirm & Dispatch Trip
              </NeoBrutalButton>
            </div>
          </form>
        </NeoBrutalCard>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Trip list</NeoBrutalSectionTitle>
          {isLoading ? (
            <p className="text-black/60 font-bold text-sm">Loading...</p>
          ) : (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>Trip</NeoBrutalTH>
                <NeoBrutalTH>Trip Fleet Type</NeoBrutalTH>
                <NeoBrutalTH>Origin</NeoBrutalTH>
                <NeoBrutalTH>Destination</NeoBrutalTH>
                <NeoBrutalTH>Status</NeoBrutalTH>
                <NeoBrutalTH>Actions</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {filteredTrips.map((t) => (
                  <NeoBrutalTR key={t.id}>
                    <NeoBrutalTD>#{t.id}</NeoBrutalTD>
                    <NeoBrutalTD>{tripFleetType(t)}</NeoBrutalTD>
                    <NeoBrutalTD>{t.origin ?? "—"}</NeoBrutalTD>
                    <NeoBrutalTD>{t.destination ?? "—"}</NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalBadge color={
                        t.status === "COMPLETED" ? "#4ADE80" :
                        t.status === "DISPATCHED" ? "#60A5FA" :
                        t.status === "CANCELLED" ? "#FF6B6B" : "#FBBF24"
                      }>
                        {t.status}
                      </NeoBrutalBadge>
                    </NeoBrutalTD>
                    <NeoBrutalTD>
                      <div className="flex gap-1 flex-wrap items-center">
                        {t.status === "DRAFT" && (
                          <NeoBrutalButton
                            type="button"
                            onClick={() => dispatchMutation.mutate(t.id)}
                            variant="secondary"
                            size="xs"
                          >
                            Dispatch
                          </NeoBrutalButton>
                        )}
                        {(t.status === "DISPATCHED" || t.status === "DRAFT") && (
                          <>
                            <NeoBrutalInputCompact
                              type="number"
                              min="0"
                              placeholder="End odo"
                              value={completeOdometer[t.id] ?? ""}
                              onChange={(e) =>
                                setCompleteOdometer((o) => ({ ...o, [t.id]: e.target.value }))
                              }
                              className="w-20"
                            />
                            <NeoBrutalButton
                              type="button"
                              onClick={() => {
                                const end = Number(completeOdometer[t.id]);
                                if (!Number.isNaN(end)) completeMutation.mutate({ id: t.id, endOdometer: end });
                              }}
                              variant="outline"
                              size="xs"
                            >
                              Complete
                            </NeoBrutalButton>
                          </>
                        )}
                      </div>
                    </NeoBrutalTD>
                  </NeoBrutalTR>
                ))}
              </NeoBrutalTBody>
            </NeoBrutalTable>
          )}
        </NeoBrutalCardCompact>
      </div>
    </DashboardLayout>
  );
}
