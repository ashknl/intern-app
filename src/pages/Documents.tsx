import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GatePass from './documents/GatePass'
import InternshipOffer from './documents/InternshipOffer'
import SectionAttachment from './documents/SectionAttachment'
import Certificate from './documents/Certificate'

const TABS = [
  { id: 'gatepass', label: 'Gate Pass', component: GatePass },
  { id: 'offer', label: 'Internship Offer', component: InternshipOffer },
  { id: 'attachment', label: 'Section Attachment', component: SectionAttachment },
  { id: 'certificate', label: 'Certificate', component: Certificate },
]

export default function Documents() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <FileText size={24} /> Documents
      </h2>
      <p className="mt-2 text-muted-foreground">Generate and manage documents.</p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((tab) => {
          const TabComponent = tab.component
          return (
            <TabsContent key={tab.id} value={tab.id}>
              <TabComponent />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
