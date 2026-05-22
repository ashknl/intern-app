import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <SettingsIcon size={24} /> Settings
      </h2>
      <p className="mt-2 text-muted-foreground">Configure your application preferences.</p>
    </div>
  );
}