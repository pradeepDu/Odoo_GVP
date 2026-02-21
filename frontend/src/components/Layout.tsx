import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Wrench,
  Fuel,
  Users,
  BarChart3,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vehicles", label: "Vehicle Registry", icon: Truck },
  { to: "/trips", label: "Trip Dispatcher", icon: MapPin },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/fuel", label: "Trip & Expense", icon: Fuel },
  { to: "/drivers", label: "Performance", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "flex w-55 shrink-0 flex-col border-r border-border",
          "bg-zinc-900 text-zinc-100"
        )}
      >
        <div className="border-b border-zinc-700 p-4">
          <span className="font-semibold text-lg text-white">FleetFlow</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                isActive(to) && "border-l-4 border-l-primary bg-zinc-800 text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-700 p-2">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="inline-flex rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              {user?.role ?? "—"}
            </span>
          </div>
          <div className="px-3 py-1 text-xs text-zinc-500 truncate" title={user?.email}>
            {user?.email}
          </div>
          <Button
            type="button"
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
