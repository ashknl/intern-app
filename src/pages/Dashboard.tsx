import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard size={24} /> Dashboard
      </h2>
      <p className="mt-2 text-muted-foreground">Welcome to your dashboard overview.</p>
    </div>
  );
}