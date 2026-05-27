import { FileText } from 'lucide-react';

export default function Documents() {
  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText size={24} /> Documents
      </h2>
      <p className="mt-2 text-muted-foreground">Generate Documents for students.</p>
    </div>
    
  );
}