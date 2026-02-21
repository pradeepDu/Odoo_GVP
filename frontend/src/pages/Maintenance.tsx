import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi, vehiclesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Log = {
  id: number;
  vehicleId: number;
  description: string;
  serviceType: string | null;
  cost: number | null;
  createdAt: string;
  vehicle?: { name: string; licensePlate: string };
};

export default function Maintenance() {
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.list(),
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["maintenance", vehicleId || "all"],
    queryFn: () =>
      maintenanceApi.list(vehicleId ? Number(vehicleId) : undefined) as Promise<Log[]>,
  });

  const createMutation = useMutation({
    mutationFn: (body: { vehicleId: number; description: string; serviceType?: string; cost?: number }) =>
      maintenanceApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vid = Number(vehicleId);
    if (!vid || !description) return;
    createMutation.mutate({
      vehicleId: vid,
      description,
      serviceType: serviceType || undefined,
      cost: cost ? Number(cost) : undefined,
    });
    setDescription("");
    setServiceType("");
    setCost("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Maintenance & Service Logs</h1>
        <p className="text-muted-foreground text-sm">Vehicle health tracking — adding a log sets vehicle to In Shop</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add service log</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
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
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service type</label>
              <input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add log
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div>
        <label className="block text-sm font-medium mb-1">Filter by vehicle</label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All vehicles</option>
          {(vehicles as { id: number; name: string; licensePlate: string }[]).map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.licensePlate})
            </option>
          ))}
        </select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Service logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Vehicle</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Cost</th>
                    <th className="text-left py-2 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 px-2">
                        {log.vehicle
                          ? `${log.vehicle.name} (${log.vehicle.licensePlate})`
                          : `Vehicle #${log.vehicleId}`}
                      </td>
                      <td className="py-2 px-2">{log.description}</td>
                      <td className="py-2 px-2">{log.serviceType ?? "—"}</td>
                      <td className="py-2 px-2">{log.cost != null ? log.cost : "—"}</td>
                      <td className="py-2 px-2">{new Date(log.createdAt).toLocaleDateString()}</td>
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
