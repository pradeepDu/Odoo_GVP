import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fuelApi, vehiclesApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FuelExpense() {
  const [vehicleId, setVehicleId] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.list(),
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
    mutationFn: (body: { vehicleId: number; liters: number; cost: number; date: string }) =>
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
    createMutation.mutate({ vehicleId: vid, liters: l, cost: c, date });
    setLiters("");
    setCost("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Expense & Fuel Logging</h1>
        <p className="text-muted-foreground text-sm">Financial tracking per asset — Total Operational Cost (Fuel + Maintenance)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add fuel log</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              <label className="block text-sm font-medium mb-1">Liters</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
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
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                Add log
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {vehicleId && (
        <>
          {operationalCost && (
            <Card>
              <CardHeader>
                <CardTitle>Total operational cost (Vehicle #{vehicleId})</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Fuel: {operationalCost.fuelCost}</p>
                <p>Maintenance: {operationalCost.maintenanceCost}</p>
                <p className="font-semibold">Total: {operationalCost.totalOperationalCost}</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Fuel logs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2">Liters</th>
                        <th className="text-left py-2 px-2">Cost</th>
                        <th className="text-left py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(list as { liters: number; cost: number; date: string }[]).map((log, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 px-2">{log.liters}</td>
                          <td className="py-2 px-2">{log.cost}</td>
                          <td className="py-2 px-2">{new Date(log.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
