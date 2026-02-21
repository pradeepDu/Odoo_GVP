import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, vehiclesApi, driversApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
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
  });
  const [completeOdometer, setCompleteOdometer] = useState<Record<number, string>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleId = Number(form.vehicleId);
    const driverId = Number(form.driverId);
    const cargoWeightKg = Number(form.cargoWeightKg);
    if (!vehicleId || !driverId || !cargoWeightKg) return;
    createMutation.mutate({
      vehicleId,
      driverId,
      cargoWeightKg,
      origin: form.origin || undefined,
      destination: form.destination || undefined,
    });
    setForm({ vehicleId: "", driverId: "", cargoWeightKg: "", origin: "", destination: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <NeoBrutalPageHeader title="Trip Dispatcher" subtitle="Create and manage trips" />

        <NeoBrutalCard>
          <NeoBrutalSectionTitle>Create Trip</NeoBrutalSectionTitle>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <NeoBrutalLabel>Vehicle</NeoBrutalLabel>
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
              <NeoBrutalLabel>Driver</NeoBrutalLabel>
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
            <div>
              <NeoBrutalLabel>Cargo (kg)</NeoBrutalLabel>
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
              <NeoBrutalLabel>Origin</NeoBrutalLabel>
              <NeoBrutalInput
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                placeholder="ENTER ORIGIN"
              />
            </div>
            <div>
              <NeoBrutalLabel>Destination</NeoBrutalLabel>
              <NeoBrutalInput
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                placeholder="ENTER DESTINATION"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <NeoBrutalButton type="submit" disabled={createMutation.isPending} size="sm">
                Create Trip (Draft)
              </NeoBrutalButton>
            </div>
          </form>
        </NeoBrutalCard>

        <div className="flex gap-3 items-end">
          <div>
            <NeoBrutalLabel>Filter by Status</NeoBrutalLabel>
            <NeoBrutalSelectCompact
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </NeoBrutalSelectCompact>
          </div>
        </div>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Trips</NeoBrutalSectionTitle>
          {isLoading ? (
            <p className="text-black/60 font-bold text-sm">Loading...</p>
          ) : (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>ID</NeoBrutalTH>
                <NeoBrutalTH>Vehicle</NeoBrutalTH>
                <NeoBrutalTH>Driver</NeoBrutalTH>
                <NeoBrutalTH>Cargo (kg)</NeoBrutalTH>
                <NeoBrutalTH>Status</NeoBrutalTH>
                <NeoBrutalTH>Actions</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {list.map((t) => (
                  <NeoBrutalTR key={t.id}>
                    <NeoBrutalTD>{t.id}</NeoBrutalTD>
                    <NeoBrutalTD>{t.vehicle?.name} ({t.vehicle?.licensePlate})</NeoBrutalTD>
                    <NeoBrutalTD>{t.driver?.name}</NeoBrutalTD>
                    <NeoBrutalTD>{t.cargoWeightKg}</NeoBrutalTD>
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
