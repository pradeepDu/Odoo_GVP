import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  selectedTripId: number | null;
  setSelectedTripId: (id: number | null) => void;
  selectedDriverId: number | null;
  setSelectedDriverId: (id: number | null) => void;
  selectedVehicleId: number | null;
  setSelectedVehicleId: (id: number | null) => void;
  // Page-level filter state (optional, pages can use URL or local state instead)
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  selectedTripId: null,
  setSelectedTripId: (id) => set({ selectedTripId: id }),
  selectedDriverId: null,
  setSelectedDriverId: (id) => set({ selectedDriverId: id }),
  selectedVehicleId: null,
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
