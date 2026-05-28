import { useState, useEffect } from "react";
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
  { to: "/map", label: "Map", icon: "🗺️" },
  { to: "/loans", label: "Loans", icon: "🏦" },
  { to: "/cobrokerage", label: "Co-Brokerage", icon: "🤝" },
  { to: "/documents", label: "Documents", icon: "📑" },
  { to: "/compliance", label: "Compliance", icon: "✅" },
  { to: "/cma", label: "CMA", icon: "📊" },
  { to: "/seed-data", label: "Seed Data", icon: "🌱" },
];

export default function AppLayout() {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile vs desktop on mount and adjust sidebar
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {setSidebarOpen(false);}
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    if (isMobile) {setSidebarOpen(false);}
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 z-50",
          sidebarOpen
            ? "w-56 translate-x-0"
            : "w-56 -translate-x-full lg:w-16 lg:translate-x-0",
          isMobile && "fixed inset-y-0 left-0 shadow-xl",
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
        <nav
          aria-label="Sidebar pages"
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {(sidebarOpen || !isMobile) && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t p-2 space-y-1">
          <button
            onClick={() => {
              navigate("/settings");
              handleNavClick();
            }}
            aria-label="Settings"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="text-lg shrink-0">⚙️</span>
            {(sidebarOpen || !isMobile) && <span>Settings</span>}
          </button>
          <button
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="text-lg shrink-0">
              {theme === "dark" ? "☀️" : "🌙"}
            </span>
            {(sidebarOpen || !isMobile) && (
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <span className="text-lg shrink-0">🚪</span>
            {(sidebarOpen || !isMobile) && <span>Logout</span>}
          </button>

          {(sidebarOpen || !isMobile) && userProfile && (
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

        {/* Desktop collapse button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute bottom-4 left-4 hidden rounded-full border bg-background p-1 text-xs lg:block hover:bg-muted transition-colors"
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 border-b bg-card px-4 py-2 lg:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </div>
        <div className="mx-auto max-w-7xl p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
