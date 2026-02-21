const API_BASE = import.meta.env.VITE_API_URL || "https://carpet-declare-applicable-cancer.trycloudflare.com/api";

export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  message: string;
};

function getToken(): string | null {
  return localStorage.getItem("fleetflow_token");
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "string"
  ) {
    return (body as { error: string }).error;
  }
  return fallback;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(getErrorMessage(body, res.statusText));
  }

  if (body && typeof body === "object" && "success" in body) {
    const envelope = body as ApiEnvelope<T>;
    if (envelope.success === true && "data" in envelope) {
      return envelope.data as T;
    }
    if (envelope.success === false) {
      throw new Error(envelope.message || "Request failed");
    }
  }

  return body as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{
      user: { id: number; email: string; name: string | null; role: string };
      token: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name?: string, role?: string) =>
    api<{
      user: { id: number; email: string; name: string | null; role: string };
      token: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    }),
  forgotPassword: (email: string) =>
    api<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    api<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
  verifyResetToken: (token: string) =>
    api<{ valid: boolean; message: string }>("/auth/verify-reset-token", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};

export const dashboardApi = {
  getKPIs: () =>
    api<{
      activeFleetCount: number;
      maintenanceAlertsCount: number;
      utilizationRatePct: number;
      pendingCargoCount: number;
    }>("/dashboard/kpis"),
};

export const vehiclesApi = {
  list: (params?: {
    vehicleType?: string;
    status?: string;
    region?: string;
    retired?: string;
  }) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "")
    );
    const q = new URLSearchParams(filteredParams as Record<string, string>).toString();
    return api<unknown[]>(`/vehicles${q ? `?${q}` : ""}`);
  },
  listAvailable: (vehicleType?: string) =>
    api<unknown[]>(
      `/vehicles/available${vehicleType ? `?vehicleType=${vehicleType}` : ""}`,
    ),
  getById: (id: number) => api<unknown>(`/vehicles/${id}`),
  create: (body: Record<string, unknown>) =>
    api<unknown>("/vehicles", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    api<unknown>(`/vehicles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  setOutOfService: (id: number, retired: boolean) =>
    api<unknown>(`/vehicles/${id}/out-of-service`, {
      method: "POST",
      body: JSON.stringify({ retired }),
    }),
};

export const driversApi = {
  list: (params?: { status?: string }) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "")
    );
    const q = new URLSearchParams(filteredParams as Record<string, string>).toString();
    return api<unknown[]>(`/drivers${q ? `?${q}` : ""}`);
  },
  listAvailable: (licenseCategory?: string) =>
    api<unknown[]>(
      `/drivers/available${licenseCategory ? `?licenseCategory=${licenseCategory}` : ""}`,
    ),
  getById: (id: number) => api<unknown>(`/drivers/${id}`),
  create: (body: Record<string, unknown>) =>
    api<unknown>("/drivers", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    api<unknown>(`/drivers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const tripsApi = {
  list: (params?: {
    status?: string;
    vehicleId?: number;
    driverId?: number;
  }) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params || {}).filter(([, v]) => v != null) as [
          string,
          string,
        ][],
      ),
    ).toString();
    return api<unknown[]>(`/trips${q ? `?${q}` : ""}`);
  },
  getById: (id: number) => api<unknown>(`/trips/${id}`),
  validate: (body: {
    vehicleId: number;
    driverId: number;
    cargoWeightKg: number;
  }) =>
    api<{ ok: boolean; error?: string }>("/trips/validate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  create: (body: Record<string, unknown>) =>
    api<unknown>("/trips", { method: "POST", body: JSON.stringify(body) }),
  dispatch: (id: number) =>
    api<unknown>(`/trips/${id}/dispatch`, { method: "POST" }),
  complete: (id: number, endOdometer: number) =>
    api<unknown>(`/trips/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ endOdometer }),
    }),
  cancel: (id: number) =>
    api<unknown>(`/trips/${id}/cancel`, { method: "POST" }),
};

export const maintenanceApi = {
  list: (vehicleId?: number) =>
    api<unknown[]>(`/maintenance${vehicleId ? `?vehicleId=${vehicleId}` : ""}`),
  listByVehicle: (vehicleId: number) =>
    api<unknown[]>(`/maintenance/vehicle/${vehicleId}`),
  create: (body: Record<string, unknown>) =>
    api<unknown>("/maintenance", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  releaseVehicle: (vehicleId: number) =>
    api<unknown>(`/maintenance/vehicle/${vehicleId}/release`, {
      method: "POST",
    }),
};

export const fuelApi = {
  create: (body: Record<string, unknown>) =>
    api<unknown>("/fuel", { method: "POST", body: JSON.stringify(body) }),
  listByVehicle: (vehicleId: number) =>
    api<unknown[]>(`/fuel/vehicle/${vehicleId}`),
  getOperationalCost: (vehicleId: number) =>
    api<{
      vehicleId: number;
      fuelCost: number;
      maintenanceCost: number;
      totalOperationalCost: number;
    }>(`/fuel/vehicle/${vehicleId}/operational-cost`),
  getCostPerKm: (vehicleId: number) =>
    api<{ costPerKm: number; totalCost: number; totalKm: number }>(
      `/fuel/vehicle/${vehicleId}/cost-per-km`,
    ),
};

export const analyticsApi = {
  getFuelEfficiency: (vehicleId: number) =>
    api<{ kmPerL: number; totalKm: number; totalLiters: number }>(
      `/analytics/fuel-efficiency/vehicle/${vehicleId}`,
    ),
  getVehicleROI: (vehicleId: number) =>
    api<unknown>(`/analytics/vehicle-roi/${vehicleId}`),
  getMonthlyFuel: (vehicleId?: number) =>
    api<Record<string, { liters: number; cost: number }>>(
      `/analytics/monthly-fuel${vehicleId ? `?vehicleId=${vehicleId}` : ""}`,
    ),
  getDriverSafety: () => api<unknown[]>("/analytics/driver-safety"),
};
