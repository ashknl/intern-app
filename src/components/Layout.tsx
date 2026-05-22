import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { LayoutDashboard, PlusCircle, FileBarChart, FileText, Settings } from 'lucide-react';

// Navigation config
const navItems = [
    { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/add-data' as const, label: 'Add Data', icon: PlusCircle },
    { to: '/reports' as const, label: 'Reports', icon: FileBarChart },
    { to: '/documents' as const, label: 'Documents', icon: FileText },
    { to: '/settings' as const, label: 'Settings', icon: Settings },
];

export default function Layout() {
    const matchRoute = useMatchRoute();

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r flex flex-col p-4">
                <h1 className="text-xl font-bold mb-6 px-2">My Electron App</h1>

                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => {
                        const isActive = matchRoute({ to: item.to });

                        return (
                            <Link key={item.to} to={item.to}>
                                <Button
                                    variant={isActive ? 'secondary' : 'ghost'}
                                    className="w-full justify-start gap-2"
                                >
                                    <div>
                                        <item.icon size={18} />
                                        {item.label}
                                    </div>
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground px-2">
                    Electron + React + TanStack
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}