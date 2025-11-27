import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

/**
 * Role-based Dashboard Router
 *
 * Routes users to different dashboards based on their role:
 * - SUPER_ADMIN & COMPANY_ADMIN → AdminDashboard (company-wide view)
 * - MANAGER → ManagerDashboard (team management view)
 * - EMPLOYEE → EmployeeDashboard (personal view)
 */
export const Dashboard = () => {
  const { user } = useAuth();

  // Route to appropriate dashboard based on role
  if (!user) {
    return <EmployeeDashboard />;
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'COMPANY_ADMIN':
      return <AdminDashboard />;

    case 'MANAGER':
      return <ManagerDashboard />;

    case 'EMPLOYEE':
    default:
      return <EmployeeDashboard />;
  }
};
