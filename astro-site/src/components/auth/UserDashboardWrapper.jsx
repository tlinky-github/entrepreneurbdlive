import React from 'react';
import { AuthProvider } from '../../lib/auth.jsx';
import UserDashboard from './UserDashboard.jsx';

const UserDashboardWrapper = () => {
  return (
    <AuthProvider>
      <UserDashboard />
    </AuthProvider>
  );
};

export default UserDashboardWrapper;
