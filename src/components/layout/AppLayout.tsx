import { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { t } = useTranslation();
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const navItems = useMemo(
    () => [
      { to: "/dashboard", label: t("navigation.dashboard"), icon: "📊" },
      { to: "/leads", label: t("navigation.leads"), icon: "👥" },
      { to: "/deals", label: t("navigation.deals"), icon: "🏆" },
      { to: "/listings", label: t("navigation.listings"), icon: "🏠" },
      { to: "/viewings", label: t("navigation.viewings"), icon: "📅" },
      { to: "/commissions", label: t("navigation.commissions"), icon: "💰" },
      { to: "/payouts", label: t("navigation.payouts"), icon: "💸" },
      { to: "/import", label: t("navigation.import"), icon: "📥" },
      { to: "/tasks", label: t("navigation.tasks"), icon: "✅" },
      { to: "/agents", label: t("navigation.agents"), icon: "👤" },
      { to: "/offices", label: t("navigation.offices"), icon: "🏢" },
      { to: "/expenses", label: t("navigation.expenses"), icon: "💳" },
      { to: "/ph-tools", label: t("navigation.phTools"), icon: "🇵🇭" },
      { to: "/vault", label: t("navigation.vault"), icon: "📁" },
      { to: "/mortgages", label: t("navigation.mortgages"), icon: "🏦" },
      { to: "/analytics", label: t("navigation.analytics"), icon: "📈" },
      { to: "/calendar", label: t("navigation.calendar"), icon: "📅" },
      { to: "/checklist-templates", label: t("navigation.checklists"), icon: "✅" },
      { to: "/activity", label: t("navigation.activity"), icon: "🔄" },
      { to: "/projects", label: t("navigation.projects"), icon: "🏗️" },
      { to: "/market", label: t("navigation.market"), icon: "📈" },
      { to: "/licenses", label: t("navigation.licenses"), icon: "🆔" },
      { to: "/tours", label: t("navigation.tours"), icon: "📍" },
      { to: "/leaderboard", label: t("navigation.leaderboard"), icon: "🏆" },
      { to: "/map", label: t("navigation.map"), icon: "🗺️" },
      { to: "/loans", label: t("navigation.loans"), icon: "🏦" },
      { to: "/cobrokerage", label: t("navigation.coBrokerage"), icon: "🤝" },
      { to: "/documents", label: t("navigation.documents"), icon: "📑" },
      { to: "/compliance", label: t("navigation.compliance"), icon: "✅" },
      { to: "/cma", label: t("navigation.cma"), icon: "📊" },
      { to: "/seed-data", label: t("navigation.seedData"), icon: "🌱" },
      { to: "/audit", label: t("navigation.auditTrail"), icon: "🔍" },
      { to: "/reports", label: t("navigation.reports"), icon: "📊" },
    ],
    [t],
  );

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
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label={t("common.sidebarNavigation")}
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
            <span className="text-sm font-semibold">{t("app.name")}</span>
          )}
        </div>

        {/* Navigation */}
        <nav
          aria-label={t("common.sidebarPages")}
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
            aria-label={t("navigation.settings")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="text-lg shrink-0">⚙️</span>
            {(sidebarOpen || !isMobile) && <span>{t("navigation.settings")}</span>}
          </button>
          <button
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span className="text-lg shrink-0">
              {theme === "dark" ? "☀️" : "🌙"}
            </span>
            {(sidebarOpen || !isMobile) && (
              <span>{theme === "dark" ? t("theme.light") : t("theme.dark")}</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            aria-label={t("auth.logout")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <span className="text-lg shrink-0">🚪</span>
            {(sidebarOpen || !isMobile) && <span>{t("auth.logout")}</span>}
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
          aria-label={sidebarOpen ? t("common.collapseSidebar") : t("common.expandSidebar")}
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
            aria-label={t("common.openMenu")}
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
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </div>
        <div className="mx-auto max-w-7xl p-4 lg:p-6 animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
