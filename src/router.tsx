import { createMemoryHistory, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddData from './pages/AddData';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

// 1. Create the Root Route (uses our Layout with Sidebar)
const rootRoute = createRootRoute({
    component: Layout,
});

// 2. Create the Child Routes
const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Dashboard,
});

const addDataRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/add-data',
    component: AddData,
});

const reportsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/reports',
    component: Reports,
});

const documentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/documents',
    component: Documents,
});

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: Settings,
});

const adminRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin',
    component: Admin,
});

// 3. Create the Route Tree
const routeTree = rootRoute.addChildren([
    dashboardRoute,
    addDataRoute,
    reportsRoute,
    documentsRoute,
    settingsRoute,
    adminRoute,
]);

// 4. Create the Memory History (Perfect for Electron!)
const memoryHistory = createMemoryHistory({
    initialEntries: ['/'], // Start at the dashboard
});

// 5. Create and Export the Router
export const router = createRouter({
    routeTree,
    history: memoryHistory,
});

// Type safety for TypeScript
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}