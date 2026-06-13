import Sidebar from '@/components/layout/Sidebar'
import { ChatProvider } from '@/contexts/ChatContext'
import { ParticlesProvider } from '@/contexts/ParticlesContext'
import MagicParticlesLayer from '@/components/ui/MagicParticlesLayer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ParticlesProvider>
      <ChatProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto md:pt-0 pt-14">
            {children}
          </main>
        </div>
        <MagicParticlesLayer />
      </ChatProvider>
    </ParticlesProvider>
  )
}

