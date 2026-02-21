import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { vehiclesApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { FormModal } from "@/components/FormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Registry"
        subtitle="CRUD for physical assets"
        actions={[{ label: "+ New Vehicle", onClick: () => setModalOpen(true), primary: true }]}
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={cn(
            "rounded-md border border-input bg-background px-3 py-1.5 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        >
          <option value="">All types</option>
          <option value="TRUCK">Truck</option>
          <option value="VAN">Van</option>
          <option value="BIKE">Bike</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            "rounded-md border border-input bg-background px-3 py-1.5 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Plate</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Capacity (kg)</th>
                    <th className="text-left py-2 px-2">Odometer</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((v) => (
                    <tr key={v.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{v.name}</td>
                      <td className="py-2 px-2 font-mono">{v.licensePlate}</td>
                      <td className="py-2 px-2">{v.vehicleType}</td>
                      <td className="py-2 px-2">{v.maxCapacityKg}</td>
                      <td className="py-2 px-2">{v.odometer} km</td>
                      <td className="py-2 px-2">
                        <StatusPill status={v.status} />
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRetire({ id: v.id, retired: !v.retired });
                          }}
                          variant={v.retired ? "ghost" : "destructive"}
                          size="xs"
                        >
                          {v.retired ? "Restore" : "Retire"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="New Vehicle Registration" size="lg">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">License Plate *</label>
            <input {...register("licensePlate")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.licensePlate && <p className="text-destructive text-xs mt-1">{errors.licensePlate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input {...register("name")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <input {...register("model")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Payload (kg) *</label>
            <input type="number" {...register("maxCapacityKg")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.maxCapacityKg && <p className="text-destructive text-xs mt-1">{errors.maxCapacityKg.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Initial Odometer (km)</label>
            <input type="number" {...register("odometer")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select {...register("vehicleType")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="VAN">Van</option>
              <option value="TRUCK">Truck</option>
              <option value="BIKE">Bike</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <input {...register("region")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={createMutation.isPending}>
              Save
            </Button>
            <Button type="button" onClick={() => setModalOpen(false)} variant="outline">
              Cancel
            </Button>
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
    </div>
  );
}
