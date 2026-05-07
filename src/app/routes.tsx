import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { ModuleRouteGuard } from '../components/auth/ModuleRouteGuard';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CustomersPage from '../pages/CustomersPage';
import CustomerDetailPage from '../pages/CustomerDetailPage';
import OffersPage from '../pages/OffersPage';
import JobsPage from '../pages/JobsPage';
import JobDetailPage from '../pages/JobDetailPage';
import TasksPage from '../pages/TasksPage';
import OperationsPage from '../pages/OperationsPage';
import DeliveryServicePage from '../pages/DeliveryServicePage';
import ComplaintsPage from '../pages/ComplaintsPage';
import FinancePage from '../pages/FinancePage';
import ReportsPage from '../pages/ReportsPage';
import FilesPage from '../pages/FilesPage';
import ModulesPage from '../pages/ModulesPage';
import SettingsPage from '../pages/SettingsPage';
import NotificationsPage from '../pages/NotificationsPage';
import InventoryPage from '../pages/InventoryPage';
import DataImportPage from '../pages/DataImportPage';
import PlatformDashboard from '../pages/platform/PlatformDashboard';
import PlatformWorkspaces from '../pages/platform/PlatformWorkspaces';
import PlatformWorkspaceCreate from '../pages/platform/PlatformWorkspaceCreate';
import PlatformAuditLogs from '../pages/platform/PlatformAuditLogs';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
          <ProtectedRoute requiredRoles={['owner', 'manager', 'finance', 'staff']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="customers" element={
          <ProtectedRoute requiredRoles={['owner', 'manager', 'finance']}>
            <CustomersPage />
          </ProtectedRoute>
        } />
        
        <Route path="customers/:id" element={
          <ProtectedRoute requiredRoles={['owner', 'manager', 'finance']}>
            <CustomerDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="offers" element={
          <ProtectedRoute requiredRoles={['owner', 'manager']}>
            <ModuleRouteGuard moduleKey="offers">
              <OffersPage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />
        
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        
        <Route path="operations" element={
          <ProtectedRoute requiredRoles={['owner', 'manager', 'staff']}>
            <ModuleRouteGuard moduleKey="operations">
              <OperationsPage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />
        
        <Route path="delivery-service" element={
          <ProtectedRoute requiredRoles={['owner', 'manager', 'field']}>
            <ModuleRouteGuard moduleKey="delivery_service">
              <DeliveryServicePage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />
        
        <Route path="complaints" element={
          <ProtectedRoute requiredRoles={['owner', 'manager']}>
            <ModuleRouteGuard moduleKey="complaints_requests">
              <ComplaintsPage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />
        
        <Route path="finance" element={
          <ProtectedRoute requiredRoles={['owner', 'finance']}>
            <ModuleRouteGuard moduleKey="finance">
              <FinancePage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />
        
        <Route path="reports" element={
          <ProtectedRoute requiredRoles={['owner', 'manager', 'finance']}>
            <ModuleRouteGuard moduleKey="reports">
              <ReportsPage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />
        
        <Route path="files" element={
          <ModuleRouteGuard moduleKey="files">
            <FilesPage />
          </ModuleRouteGuard>
        } />

        <Route path="inventory" element={
          <ProtectedRoute requiredRoles={['owner', 'manager', 'finance', 'staff']}>
            <ModuleRouteGuard moduleKey="inventory">
              <InventoryPage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />

        <Route path="data-import" element={
          <ProtectedRoute requiredRoles={['owner', 'manager']}>
            <ModuleRouteGuard moduleKey="data_import">
              <DataImportPage />
            </ModuleRouteGuard>
          </ProtectedRoute>
        } />
        
        <Route path="modules" element={
          <ProtectedRoute requiredRoles={['owner']}>
            <ModulesPage />
          </ProtectedRoute>
        } />
        
        <Route path="settings" element={
          <ProtectedRoute requiredRoles={['owner']}>
            <SettingsPage />
          </ProtectedRoute>
        } />
        
        <Route path="notifications" element={
          <ModuleRouteGuard moduleKey="notifications">
            <NotificationsPage />
          </ModuleRouteGuard>
        } />

        {/* Platform Admin Routes */}
        <Route path="platform" element={
          <ProtectedRoute requiredSuperAdmin>
            <PlatformDashboard />
          </ProtectedRoute>
        } />
        <Route path="platform/workspaces" element={
          <ProtectedRoute requiredSuperAdmin>
            <PlatformWorkspaces />
          </ProtectedRoute>
        } />
        <Route path="platform/workspaces/new" element={
          <ProtectedRoute requiredSuperAdmin>
            <PlatformWorkspaceCreate />
          </ProtectedRoute>
        } />
        <Route path="platform/audit-logs" element={
          <ProtectedRoute requiredSuperAdmin>
            <PlatformAuditLogs />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
