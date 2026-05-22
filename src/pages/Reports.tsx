import { FileBarChart } from 'lucide-react';

export default function Reports() {
  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileBarChart size={24} /> Reports
      </h2>
      <p className="mt-2 text-muted-foreground">View and generate reports.</p>
    </div>
  );
}