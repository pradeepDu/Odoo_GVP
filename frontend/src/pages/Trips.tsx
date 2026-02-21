import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, vehiclesApi, driversApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";

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
    queryKey: ["drivers", "available"],
    queryFn: () => driversApi.listAvailable(),
  });

  const createMutation = useMutation({
    mutationFn: (body: { vehicleId: number; driverId: number; cargoWeightKg: number; origin?: string; destination?: string }) =>
      tripsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: number) => tripsApi.dispatch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, endOdometer }: { id: number; endOdometer: number }) =>
      tripsApi.complete(id, endOdometer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] }),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trip Dispatcher</h1>
        <p className="text-muted-foreground text-sm">Create and manage trips</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select</option>
                {(vehicles as { id: number; name: string; licensePlate: string }[]).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver</label>
              <select
                value={form.driverId}
                onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select</option>
                {(drivers as { id: number; name: string }[]).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cargo (kg)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cargoWeightKg}
                onChange={(e) => setForm((f) => ({ ...f, cargoWeightKg: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Origin</label>
              <input
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination</label>
              <input
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Create trip (Draft)
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Vehicle</th>
                    <th className="text-left py-2 px-2">Driver</th>
                    <th className="text-left py-2 px-2">Cargo (kg)</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{t.id}</td>
                      <td className="py-2 px-2">{t.vehicle?.name} ({t.vehicle?.licensePlate})</td>
                      <td className="py-2 px-2">{t.driver?.name}</td>
                      <td className="py-2 px-2">{t.cargoWeightKg}</td>
                      <td className="py-2 px-2">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="py-2 px-2 flex gap-1 flex-wrap">
                        {t.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => dispatchMutation.mutate(t.id)}
                            className="rounded bg-blue-500/20 text-blue-600 px-2 py-1 text-xs hover:bg-blue-500/30"
                          >
                            Dispatch
                          </button>
                        )}
                        {(t.status === "DISPATCHED" || t.status === "DRAFT") && (
                          <>
                            <input
                              type="number"
                              min="0"
                              placeholder="End odometer"
                              value={completeOdometer[t.id] ?? ""}
                              onChange={(e) =>
                                setCompleteOdometer((o) => ({ ...o, [t.id]: e.target.value }))
                              }
                              className="w-24 rounded border border-input bg-background px-2 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const end = Number(completeOdometer[t.id]);
                                if (!Number.isNaN(end)) completeMutation.mutate({ id: t.id, endOdometer: end });
                              }}
                              className="rounded bg-emerald-500/20 text-emerald-600 px-2 py-1 text-xs"
                            >
                              Complete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
