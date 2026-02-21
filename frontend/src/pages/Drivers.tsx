import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { driversApi } from "@/lib/api";
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
  NeoBrutalBadge,
  NeoBrutalTable,
  NeoBrutalTHead,
  NeoBrutalTH,
  NeoBrutalTBody,
  NeoBrutalTR,
  NeoBrutalTD,
} from "@/components/ui/neo-brutual-card";

type Driver = {
  id: number;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseCategory: string;
  status: string;
  safetyScore: number | null;
  tripCompletionRate: number | null;
};

const newDriverSchema = z.object({
  name: z.string().min(1, "Name required"),
  licenseNumber: z.string().min(1, "License number required"),
  licenseExpiry: z.string().min(1, "Expiry date required"),
  licenseCategory: z.enum(["A", "B", "C"], { message: "Invalid category" }),
});

type NewDriverForm = z.infer<typeof newDriverSchema>;

export default function Drivers() {
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewDriverForm>({
    resolver: zodResolver(newDriverSchema),
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["drivers", statusFilter],
    queryFn: () =>
      driversApi.list({ status: statusFilter || undefined }) as Promise<Driver[]>,
  });

  const createMutation = useMutation({
    mutationFn: (body: NewDriverForm) => driversApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setModalOpen(false);
      reset();
      showSuccess("Driver added");
    },
    onError: showApiError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      driversApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      showSuccess("Driver updated");
    },
    onError: showApiError,
  });

  const isExpired = (dateStr: string) => new Date(dateStr) <= new Date();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <NeoBrutalPageHeader
            title="Driver Performance & Safety"
            subtitle="License expiry blocks assignment; trip completion and safety scores"
          />
          <NeoBrutalButton variant="primary" size="sm" type="button" onClick={() => setModalOpen(true)}>
            + Add Driver
          </NeoBrutalButton>
        </div>

        <div>
          <NeoBrutalLabel>Filter by Status</NeoBrutalLabel>
          <NeoBrutalSelectCompact
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="ON_DUTY">On Duty</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </NeoBrutalSelectCompact>
        </div>

        <NeoBrutalCardCompact>
          <NeoBrutalSectionTitle>Drivers</NeoBrutalSectionTitle>
          {isLoading ? (
            <p className="text-black/60 font-bold text-sm">Loading...</p>
          ) : (
            <NeoBrutalTable>
              <NeoBrutalTHead>
                <NeoBrutalTH>Name</NeoBrutalTH>
                <NeoBrutalTH>License</NeoBrutalTH>
                <NeoBrutalTH>Expiry</NeoBrutalTH>
                <NeoBrutalTH>Category</NeoBrutalTH>
                <NeoBrutalTH>Status</NeoBrutalTH>
                <NeoBrutalTH>{"Completion %"}</NeoBrutalTH>
                <NeoBrutalTH>Safety</NeoBrutalTH>
                <NeoBrutalTH>Set Status</NeoBrutalTH>
              </NeoBrutalTHead>
              <NeoBrutalTBody>
                {list.map((d) => (
                  <NeoBrutalTR key={d.id}>
                    <NeoBrutalTD>{d.name}</NeoBrutalTD>
                    <NeoBrutalTD className="font-mono">{d.licenseNumber}</NeoBrutalTD>
                    <NeoBrutalTD className={isExpired(d.licenseExpiry) ? "text-red-600" : ""}>
                      {new Date(d.licenseExpiry).toLocaleDateString()}
                      {isExpired(d.licenseExpiry) && (
                        <NeoBrutalBadge color="#FF6B6B"> Expired</NeoBrutalBadge>
                      )}
                    </NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalBadge color="#E0E7FF">{d.licenseCategory}</NeoBrutalBadge>
                    </NeoBrutalTD>
                    <NeoBrutalTD>
                      <NeoBrutalBadge color={
                        d.status === "ON_DUTY" ? "#4ADE80" :
                        d.status === "OFF_DUTY" ? "#FBBF24" : "#FF6B6B"
                      }>
                        {d.status}
                      </NeoBrutalBadge>
                    </NeoBrutalTD>
                    <NeoBrutalTD>{d.tripCompletionRate != null ? `${d.tripCompletionRate.toFixed(1)}%` : "—"}</NeoBrutalTD>
                    <NeoBrutalTD>{d.safetyScore != null ? d.safetyScore : "—"}</NeoBrutalTD>
                    <NeoBrutalTD>
                      <div className="flex gap-1 flex-wrap">
                        {d.status !== "ON_DUTY" && (
                          <NeoBrutalButton
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "ON_DUTY" } })}
                            variant="secondary"
                            size="xs"
                          >
                            On Duty
                          </NeoBrutalButton>
                        )}
                        {d.status !== "OFF_DUTY" && (
                          <NeoBrutalButton
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "OFF_DUTY" } })}
                            variant="outline"
                            size="xs"
                          >
                            Off Duty
                          </NeoBrutalButton>
                        )}
                        {d.status !== "SUSPENDED" && (
                          <NeoBrutalButton
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "SUSPENDED" } })}
                            variant="destructive"
                            size="xs"
                          >
                            Suspend
                          </NeoBrutalButton>
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

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Add Driver" size="md">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 font-mono">
          <div>
            <NeoBrutalLabel htmlFor="driverName">Name *</NeoBrutalLabel>
            <NeoBrutalInput {...register("name")} id="driverName" placeholder="ENTER DRIVER NAME" />
            {errors.name && <p className="text-red-600 text-xs font-bold mt-1 uppercase">{errors.name.message}</p>}
          </div>
          <div>
            <NeoBrutalLabel htmlFor="licenseNumber">License Number *</NeoBrutalLabel>
            <NeoBrutalInput {...register("licenseNumber")} id="licenseNumber" placeholder="DL123456" />
            {errors.licenseNumber && <p className="text-red-600 text-xs font-bold mt-1 uppercase">{errors.licenseNumber.message}</p>}
          </div>
          <div>
            <NeoBrutalLabel htmlFor="licenseExpiry">License Expiry *</NeoBrutalLabel>
            <NeoBrutalInput type="date" {...register("licenseExpiry")} id="licenseExpiry" />
            {errors.licenseExpiry && <p className="text-red-600 text-xs font-bold mt-1 uppercase">{errors.licenseExpiry.message}</p>}
          </div>
          <div>
            <NeoBrutalLabel htmlFor="licenseCategory">Category *</NeoBrutalLabel>
            <NeoBrutalSelect {...register("licenseCategory")} id="licenseCategory">
              <option value="">Select category</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </NeoBrutalSelect>
            {errors.licenseCategory && <p className="text-red-600 text-xs font-bold mt-1 uppercase">{errors.licenseCategory.message}</p>}
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
    </DashboardLayout>
  );
}
