import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "@/lib/api";
import { showSuccess, showApiError } from "@/lib/toast";
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

export default function Drivers() {
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["drivers", statusFilter],
    queryFn: () =>
      driversApi.list({ status: statusFilter || undefined }) as Promise<Driver[]>,
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
      <div>
        <h1 className="text-2xl font-semibold">Driver Performance & Safety Profiles</h1>
        <p className="text-muted-foreground text-sm">License expiry blocks assignment; trip completion and safety scores</p>
      </div>
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
                          <button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "ON_DUTY" } })}
                            className="rounded bg-emerald-500/20 text-emerald-600 px-2 py-1 text-xs"
                          >
                            On Duty
                          </button>
                        )}
                        {d.status !== "OFF_DUTY" && (
                          <button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "OFF_DUTY" } })}
                            className="rounded bg-slate-500/20 text-slate-600 px-2 py-1 text-xs"
                          >
                            Off Duty
                          </button>
                        )}
                        {d.status !== "SUSPENDED" && (
                          <button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: d.id, body: { status: "SUSPENDED" } })}
                            className="rounded bg-red-500/20 text-red-600 px-2 py-1 text-xs"
                          >
                            Suspend
                          </button>
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
