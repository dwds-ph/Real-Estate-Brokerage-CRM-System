import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/leads", label: "Leads", icon: "👥" },
  { to: "/deals", label: "Deals", icon: "🏆" },
  { to: "/listings", label: "Listings", icon: "🏠" },
  { to: "/viewings", label: "Viewings", icon: "📅" },
  { to: "/commissions", label: "Commissions", icon: "💰" },
  { to: "/payouts", label: "Payouts", icon: "💸" },
  { to: "/import", label: "Import", icon: "📥" },
  { to: "/tasks", label: "Tasks", icon: "✅" },
  { to: "/agents", label: "Agents", icon: "👤" },
  { to: "/offices", label: "Offices", icon: "🏢" },
  { to: "/expenses", label: "Expenses", icon: "💳" },
  { to: "/ph-tools", label: "PH Tools", icon: "🇵🇭" },
  { to: "/vault", label: "Vault", icon: "📁" },
  { to: "/mortgages", label: "Mortgages", icon: "🏦" },
  { to: "/analytics", label: "Analytics", icon: "📈" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/checklist-templates", label: "Checklists", icon: "✅" },
  { to: "/activity", label: "Activity", icon: "🔄" },
  { to: "/projects", label: "Projects", icon: "🏗️" },
  { to: "/market", label: "Market", icon: "📈" },
  { to: "/licenses", label: "Licenses", icon: "🆔" },
  { to: "/tours", label: "Tours", icon: "📍" },
  { to: "/leaderboard", label: "Leaderboard", icon: "🏆" },
];
export default function AppLayout() {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          sidebarOpen ? "w-56" : "w-16",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              RE
            </span>
          </div>
          {sidebarOpen && (
            <span className="text-sm font-semibold">Real Estate CRM</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t p-2 space-y-1">
          <button
            onClick={() => navigate("/settings")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="text-lg">⚙️</span>
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
            {sidebarOpen && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>

          {sidebarOpen && userProfile && (
            <div className="px-3 py-2">
              <p className="text-xs font-medium truncate">
                {userProfile.displayName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {userProfile.role}
              </p>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute bottom-4 left-4 hidden rounded-full border bg-background p-1 text-xs lg:block"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-2 border-b bg-card px-6 py-2">
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
