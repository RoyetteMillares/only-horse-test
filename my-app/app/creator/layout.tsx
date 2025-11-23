import { CreatorSidebar } from '@/components/creator/CreatorSidebar'

export default function CreatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Sidebar */}
            <CreatorSidebar />

            {/* Main Content Area */}
            <main className="flex-1 ml-64 min-h-screen">
                {children}
            </main>
        </div>
    )
}
