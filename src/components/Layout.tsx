import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from './ui/sidebar';
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
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <h1 className="text-xl font-bold px-2">Intern App</h1>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => {
                                    const isActive = !!matchRoute({ to: item.to });

                                    return (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton isActive={isActive}>
                                                <div className="flex gap-2">
                                                    <item.icon />
                                                    <Link to={item.to}>
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <p className="text-xs text-muted-foreground px-2">
                        Electron + React + TanStack
                    </p>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-12 items-center px-4">
                    <SidebarTrigger />
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}