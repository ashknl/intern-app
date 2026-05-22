import { PlusCircle } from 'lucide-react';

export default function AddData() {
  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <PlusCircle size={24} /> Add Data
      </h2>
      <p className="mt-2 text-muted-foreground">Forms and inputs for adding new data.</p>
    </div>
  );
}