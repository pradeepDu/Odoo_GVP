import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi, vehiclesApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
import { FormModal } from "@/components/FormModal";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  NeoBrutalPageHeader,
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
  NeoBrutalBadge,
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
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [listVehicleId, setListVehicleId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehiclesApi.list(),
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["maintenance", listVehicleId || "all"],
    queryFn: () =>
      maintenanceApi.list(listVehicleId ? Number(listVehicleId) : undefined) as Promise<Log[]>,
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
    setModalOpen(false);
    setVehicleId("");
    setDescription("");
    setServiceType("");
    setCost("");
    setServiceDate("");
  };

  const resetModal = () => {
    setModalOpen(false);
    setVehicleId("");
    setDescription("");
    setServiceType("");
    setCost("");
    setServiceDate("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <NeoBrutalPageHeader
            title="Maintenance & Service Logs"
            subtitle="Keep vehicles healthy — log check-ups and repairs; vehicle is auto-marked In Shop"
          />
          <NeoBrutalButton variant="primary" size="sm" type="button" onClick={() => setModalOpen(true)}>
            Create New Service
          </NeoBrutalButton>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <NeoBrutalLabel>Search</NeoBrutalLabel>
            <NeoBrutalInput
              type="search"
              placeholder="Search for ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <NeoBrutalLabel>Group by</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="">Group by</option>
              <option value="vehicle">Vehicle</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Filter</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Filter</option>
              <option value="new">New</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Sort by</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Sort by...</option>
              <option value="date">Date</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Filter by vehicle</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={listVehicleId} onChange={(e) => setListVehicleId(e.target.value)}>
              <option value="">All vehicles</option>
              {(vehicles as { id: number; name: string; licensePlate: string }[]).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.licensePlate})
                </option>
              ))}
            </NeoBrutalSelectCompact>
          </div>
        </div>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Service logs</NeoBrutalSectionTitle>
          {isLoading ? (
            <p className="text-black/60 font-bold text-sm">Loading...</p>
          ) : (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>Log ID</NeoBrutalTH>
                <NeoBrutalTH>Vehicle</NeoBrutalTH>
                <NeoBrutalTH>Issue/Service</NeoBrutalTH>
                <NeoBrutalTH>Date</NeoBrutalTH>
                <NeoBrutalTH>Cost</NeoBrutalTH>
                <NeoBrutalTH>Status</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {list.map((log) => (
                  <NeoBrutalTR key={log.id}>
                    <NeoBrutalTD>{log.id}</NeoBrutalTD>
                    <NeoBrutalTD>
                      {log.vehicle ? log.vehicle.name : `Vehicle #${log.vehicleId}`}
                    </NeoBrutalTD>
                    <NeoBrutalTD>{log.description}</NeoBrutalTD>
                    <NeoBrutalTD>{new Date(log.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })}</NeoBrutalTD>
                    <NeoBrutalTD>{log.cost != null ? (log.cost >= 1000 ? `${log.cost / 1000}k` : log.cost) : "—"}</NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalBadge color="#60A5FA">New</NeoBrutalBadge>
                    </NeoBrutalTD>
                  </NeoBrutalTR>
                ))}
              </NeoBrutalTBody>
            </NeoBrutalTable>
          )}
        </NeoBrutalCardCompact>
      </div>

      <FormModal open={modalOpen} onClose={resetModal} title="New Service" size="md">
        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          <div>
            <NeoBrutalLabel>Vehicle Name:</NeoBrutalLabel>
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
            <NeoBrutalLabel>Issue/service:</NeoBrutalLabel>
            <NeoBrutalInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ENTER ISSUE OR SERVICE"
              required
            />
          </div>
          <div>
            <NeoBrutalLabel>Date:</NeoBrutalLabel>
            <NeoBrutalInput
              type="date"
              value={serviceDate || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>
          <div>
            <NeoBrutalLabel>Cost (optional)</NeoBrutalLabel>
            <NeoBrutalInput
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="ENTER COST"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <NeoBrutalButton type="submit" disabled={createMutation.isPending} size="sm">
              Create
            </NeoBrutalButton>
            <NeoBrutalButton type="button" onClick={resetModal} variant="outline" size="sm">
              Cancel
            </NeoBrutalButton>
          </div>
        </form>
      </FormModal>
    </DashboardLayout>
  );
}
