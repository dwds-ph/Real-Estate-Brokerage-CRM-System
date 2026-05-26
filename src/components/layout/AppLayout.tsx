import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-card p-4">
        <nav className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Navigation</p>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
