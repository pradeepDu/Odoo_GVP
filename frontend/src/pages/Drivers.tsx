import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { driversApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";
import { FormModal } from "@/components/FormModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/StatusPill";

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
    <div className="space-y-6">
      <PageHeader
        title="Driver Performance & Safety Profiles"
        subtitle="License expiry blocks assignment; trip completion and safety scores"
        actions={[{ label: "+ Add Driver", onClick: () => setModalOpen(true), primary: true }]}
      />
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ON_DUTY">On Duty</option>
          <option value="OFF_DUTY">Off Duty</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
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
                    <th className="text-left py-2 px-2">License</th>
                    <th className="text-left py-2 px-2">Expiry</th>
                    <th className="text-left py-2 px-2">Category</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Completion %</th>
                    <th className="text-left py-2 px-2">Safety</th>
                    <th className="text-left py-2 px-2">Set status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((d) => (
                    <tr key={d.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{d.name}</td>
                      <td className="py-2 px-2 font-mono">{d.licenseNumber}</td>
                      <td className={`py-2 px-2 ${isExpired(d.licenseExpiry) ? "text-destructive" : ""}`}>
                        {new Date(d.licenseExpiry).toLocaleDateString()}
                        {isExpired(d.licenseExpiry) && " (Expired)"}
                      </td>
                      <td className="py-2 px-2">{d.licenseCategory}</td>
                      <td className="py-2 px-2">
                        <StatusPill status={d.status} />
                      </td>
                      <td className="py-2 px-2">{d.tripCompletionRate != null ? `${d.tripCompletionRate.toFixed(1)}%` : "—"}</td>
                      <td className="py-2 px-2">{d.safetyScore != null ? d.safetyScore : "—"}</td>
                      <td className="py-2 px-2 flex gap-1">
                        {d.status !== "ON_DUTY" && (
                          <Button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "ON_DUTY" } })}
                            variant="secondary"
                            size="xs"
                          >
                            On Duty
                          </Button>
                        )}
                        {d.status !== "OFF_DUTY" && (
                          <Button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "OFF_DUTY" } })}
                            variant="outline"
                            size="xs"
                          >
                            Off Duty
                          </Button>
                        )}
                        {d.status !== "SUSPENDED" && (
                          <Button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "SUSPENDED" } })}
                            variant="destructive"
                            size="xs"
                          >
                            Suspend
                          </Button>
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
      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Add Driver" size="md">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input {...register("name")} placeholder="Driver name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">License Number *</label>
            <input {...register("licenseNumber")} placeholder="DL123456" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.licenseNumber && <p className="text-destructive text-xs mt-1">{errors.licenseNumber.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">License Expiry *</label>
            <input type="date" {...register("licenseExpiry")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.licenseExpiry && <p className="text-destructive text-xs mt-1">{errors.licenseExpiry.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select {...register("licenseCategory")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select category</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
            {errors.licenseCategory && <p className="text-destructive text-xs mt-1">{errors.licenseCategory.message}</p>}
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
    </div>
  );
}
