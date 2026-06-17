import { useState } from 'react'
import { Shield } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Users from './admin/Users'
import SigningOfficers from './admin/SigningOfficers'
import FeedbackDetails from './admin/FeedbackDetails'
import ManageStudents from './admin/ManageStudents'

const TABS = [
  { id: 'users', label: 'Users', component: Users },
  { id: 'officers', label: 'Signing Officers', component: SigningOfficers },
  { id: 'feedback', label: 'Add Feedback for students', component: FeedbackDetails },
  { id: 'students', label: 'Manage Students', component: ManageStudents },
]

export default function Admin() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Shield size={24} /> Admin
      </h2>
      <p className="mt-2 text-muted-foreground">Administration and management.</p>

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
