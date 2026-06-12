import Sidebar from '@/components/layout/Sidebar'
import { ChatProvider } from '@/contexts/ChatContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ChatProvider>
  )
}
