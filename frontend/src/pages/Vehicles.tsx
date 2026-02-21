import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { vehiclesApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
import { FormModal } from "@/components/FormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  NeoBrutalBadge,
  NeoBrutalTable,
  NeoBrutalTHead,
  NeoBrutalTH,
  NeoBrutalTBody,
  NeoBrutalTR,
  NeoBrutalTD,
} from "@/components/ui/neo-brutual-card";

type Vehicle = {
  id: number;
  name: string;
  model: string | null;
  licensePlate: string;
  maxCapacityKg: number;
  odometer: number;
  status: string;
  vehicleType: string;
  region: string | null;
  retired: boolean;
};

const newVehicleSchema = z.object({
  name: z.string().min(1, "Name required"),
  licensePlate: z.string().min(1, "License plate required"),
  model: z.string().optional(),
  maxCapacityKg: z.coerce.number().positive("Must be positive"),
  odometer: z.coerce.number().min(0).optional(),
  vehicleType: z.enum(["TRUCK", "VAN", "BIKE"]),
  region: z.string().optional(),
});

type NewVehicleForm = z.infer<typeof newVehicleSchema>;

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmRetire, setConfirmRetire] = useState<{ id: number; retired: boolean } | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewVehicleForm>({
    resolver: zodResolver(newVehicleSchema),
    defaultValues: { vehicleType: "VAN", odometer: 0 },
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["vehicles", typeFilter, statusFilter],
    queryFn: () =>
      vehiclesApi.list({
        vehicleType: typeFilter || undefined,
        status: statusFilter || undefined,
      }) as Promise<Vehicle[]>,
  });

  const createMutation = useMutation({
    mutationFn: (body: NewVehicleForm) => vehiclesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setModalOpen(false);
      reset();
      showSuccess("Vehicle added");
    },
    onError: showApiError,
  });

  const retireMutation = useMutation({
    mutationFn: ({ id, retired }: { id: number; retired: boolean }) =>
      vehiclesApi.setOutOfService(id, retired),
    onSuccess: (_, { retired }) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setConfirmRetire(null);
      showSuccess(retired ? "Vehicle retired" : "Vehicle restored");
    },
    onError: showApiError,
  });

  const onRetireConfirm = () => {
    if (confirmRetire) retireMutation.mutate(confirmRetire);
  };

  const filteredList = (() => {
    let result = list;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (v) =>
          (v.name ?? "").toLowerCase().includes(q) ||
          (v.licensePlate ?? "").toLowerCase().includes(q) ||
          (v.model ?? "").toLowerCase().includes(q) ||
          (v.vehicleType ?? "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "odometer") result = [...result].sort((a, b) => a.odometer - b.odometer);
    return result;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <NeoBrutalPageHeader
            title="Vehicle Registry (Asset Management)"
            subtitle="Your digital garage — add, view, change, or remove every vehicle"
          />
          <NeoBrutalButton variant="primary" size="sm" type="button" onClick={() => setModalOpen(true)}>
            + New Vehicle
          </NeoBrutalButton>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <NeoBrutalLabel>Search</NeoBrutalLabel>
            <NeoBrutalInput
              type="search"
              placeholder="Search for..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <NeoBrutalLabel>Group by</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="">Group by</option>
              <option value="type">Vehicle Type</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Filter</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={filter || statusFilter} onChange={(e) => { setFilter(e.target.value); setStatusFilter(e.target.value); }}>
              <option value="">Filter</option>
              <option value="AVAILABLE">Ready</option>
              <option value="ON_TRIP">Busy</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Sort by</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Sort by...</option>
              <option value="odometer">Odometer</option>
            </NeoBrutalSelectCompact>
          </div>
          <div>
            <NeoBrutalLabel>Type</NeoBrutalLabel>
            <NeoBrutalSelectCompact value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              <option value="TRUCK">Truck</option>
              <option value="VAN">Van</option>
              <option value="BIKE">Bike</option>
            </NeoBrutalSelectCompact>
          </div>
        </div>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Vehicles</NeoBrutalSectionTitle>
          {isLoading ? (
            <p className="text-black/60 font-bold text-sm">Loading...</p>
          ) : (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>NO</NeoBrutalTH>
                <NeoBrutalTH>Plate</NeoBrutalTH>
                <NeoBrutalTH>Model</NeoBrutalTH>
                <NeoBrutalTH>Type</NeoBrutalTH>
                <NeoBrutalTH>Capacity</NeoBrutalTH>
                <NeoBrutalTH>Odometer</NeoBrutalTH>
                <NeoBrutalTH>Status</NeoBrutalTH>
                <NeoBrutalTH>Actions</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {filteredList.map((v, idx) => (
                  <NeoBrutalTR key={v.id}>
                    <NeoBrutalTD>{idx + 1}</NeoBrutalTD>
                    <NeoBrutalTD className="font-mono">{v.licensePlate}</NeoBrutalTD>
                    <NeoBrutalTD>{v.model ?? v.name}</NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalBadge color="#E0E7FF">{v.vehicleType}</NeoBrutalBadge>
                    </NeoBrutalTD>
                    <NeoBrutalTD>{v.maxCapacityKg} ton</NeoBrutalTD>
                    <NeoBrutalTD>{v.odometer}</NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalBadge color={
                        v.status === "AVAILABLE" ? "#4ADE80" :
                        v.status === "ON_TRIP" ? "#60A5FA" :
                        v.status === "IN_SHOP" ? "#FBBF24" : "#FF6B6B"
                      }>
                        {v.status}
                      </NeoBrutalBadge>
                    </NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmRetire({ id: v.id, retired: !v.retired });
                        }}
                        variant={v.retired ? "outline" : "destructive"}
                        size="xs"
                      >
                        {v.retired ? "Restore" : "×"}
                      </NeoBrutalButton>
                    </NeoBrutalTD>
                  </NeoBrutalTR>
                ))}
              </NeoBrutalTBody>
            </NeoBrutalTable>
          )}
        </NeoBrutalCardCompact>
      </div>

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="New Vehicle Registration" size="lg">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 font-mono">
          <div>
            <NeoBrutalLabel htmlFor="licensePlate">License Plate: *</NeoBrutalLabel>
            <NeoBrutalInput {...register("licensePlate")} id="licensePlate" placeholder="ENTER PLATE" />
            {errors.licensePlate && <p className="text-red-600 text-xs font-bold mt-1 uppercase">{errors.licensePlate.message}</p>}
          </div>
          <div>
            <NeoBrutalLabel htmlFor="maxCapacityKg">Max Payload: * (kg)</NeoBrutalLabel>
            <NeoBrutalInput type="number" {...register("maxCapacityKg")} id="maxCapacityKg" placeholder="ENTER CAPACITY" />
            {errors.maxCapacityKg && <p className="text-red-600 text-xs font-bold mt-1 uppercase">{errors.maxCapacityKg.message}</p>}
          </div>
          <div>
            <NeoBrutalLabel htmlFor="odometer">Initial Odometer:</NeoBrutalLabel>
            <NeoBrutalInput type="number" {...register("odometer")} id="odometer" placeholder="ENTER ODOMETER" />
          </div>
          <div>
            <NeoBrutalLabel htmlFor="vehicleType">Type: *</NeoBrutalLabel>
            <NeoBrutalSelect {...register("vehicleType")} id="vehicleType">
              <option value="VAN">Van</option>
              <option value="TRUCK">Truck</option>
              <option value="BIKE">Bike</option>
            </NeoBrutalSelect>
          </div>
          <div>
            <NeoBrutalLabel htmlFor="model">Model:</NeoBrutalLabel>
            <NeoBrutalInput {...register("model")} id="model" placeholder="ENTER MODEL" />
          </div>
          <div>
            <NeoBrutalLabel htmlFor="name">Name * (internal)</NeoBrutalLabel>
            <NeoBrutalInput {...register("name")} id="name" placeholder="ENTER NAME" />
            {errors.name && <p className="text-red-600 text-xs font-bold mt-1 uppercase">{errors.name.message}</p>}
          </div>
          <div>
            <NeoBrutalLabel htmlFor="region">Region</NeoBrutalLabel>
            <NeoBrutalInput {...register("region")} id="region" placeholder="ENTER REGION" />
          </div>
          <div className="flex gap-3 pt-2">
            <NeoBrutalButton type="submit" disabled={createMutation.isPending} size="sm">
              Save
            </NeoBrutalButton>
            <NeoBrutalButton type="button" onClick={() => setModalOpen(false)} variant="outline" size="sm">
              Cancel
            </NeoBrutalButton>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={confirmRetire != null}
        onClose={() => setConfirmRetire(null)}
        title={confirmRetire?.retired ? "Retire vehicle?" : "Restore vehicle?"}
        message={confirmRetire?.retired ? "This will remove the vehicle from the dispatch pool." : "This will make the vehicle available for dispatch again."}
        confirmLabel={confirmRetire?.retired ? "Retire" : "Restore"}
        variant="danger"
        onConfirm={onRetireConfirm}
      />
    </DashboardLayout>
  );
}
