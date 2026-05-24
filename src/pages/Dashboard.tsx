import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  console.log(window.ipcRenderer.node())
  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard size={24} /> Dashboard
      </h2>
      <p className="mt-2 text-muted-foreground">Welcome to your dashboard overview.</p>
    </div>
  );
}