import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi, vehiclesApi } from "@/lib/api";
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
  NeoBrutalSelectCompact,
  NeoBrutalButton,
  NeoBrutalTable,
  NeoBrutalTHead,
  NeoBrutalTH,
  NeoBrutalTBody,
  NeoBrutalTR,
  NeoBrutalTD,
} from "@/components/ui/neo-brutual-card";

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
      showSuccess("Maintenance log added");
    },
    onError: showApiError,
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
    <DashboardLayout>
      <div className="space-y-6">
        <NeoBrutalPageHeader
          title="Maintenance & Service Logs"
          subtitle="Vehicle health tracking - adding a log sets vehicle to In Shop"
        />

        <NeoBrutalCard>
          <NeoBrutalSectionTitle>Add Service Log</NeoBrutalSectionTitle>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <NeoBrutalLabel>Vehicle</NeoBrutalLabel>
              <NeoBrutalSelect
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
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
              <NeoBrutalLabel>Description</NeoBrutalLabel>
              <NeoBrutalInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ENTER DESCRIPTION"
                required
              />
            </div>
            <div>
              <NeoBrutalLabel>Service Type</NeoBrutalLabel>
              <NeoBrutalInput
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="ENTER TYPE"
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
              />
            </div>
            <div>
              <NeoBrutalButton type="submit" disabled={createMutation.isPending} size="sm">
                Add Log
              </NeoBrutalButton>
            </div>
          </form>
        </NeoBrutalCard>

        <div>
          <NeoBrutalLabel>Filter by Vehicle</NeoBrutalLabel>
          <NeoBrutalSelectCompact
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">All vehicles</option>
            {(vehicles as { id: number; name: string; licensePlate: string }[]).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.licensePlate})
              </option>
            ))}
          </NeoBrutalSelectCompact>
        </div>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Service Logs</NeoBrutalSectionTitle>
          {isLoading ? (
            <p className="text-black/60 font-bold text-sm">Loading...</p>
          ) : (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>Vehicle</NeoBrutalTH>
                <NeoBrutalTH>Description</NeoBrutalTH>
                <NeoBrutalTH>Type</NeoBrutalTH>
                <NeoBrutalTH>Cost</NeoBrutalTH>
                <NeoBrutalTH>Date</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {list.map((log) => (
                  <NeoBrutalTR key={log.id}>
                    <NeoBrutalTD>
                      {log.vehicle
                        ? `${log.vehicle.name} (${log.vehicle.licensePlate})`
                        : `Vehicle #${log.vehicleId}`}
                    </NeoBrutalTD>
                    <NeoBrutalTD>{log.description}</NeoBrutalTD>
                    <NeoBrutalTD>{log.serviceType ?? "—"}</NeoBrutalTD>
                    <NeoBrutalTD>{log.cost != null ? log.cost : "—"}</NeoBrutalTD>
                    <NeoBrutalTD>{new Date(log.createdAt).toLocaleDateString()}</NeoBrutalTD>
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
