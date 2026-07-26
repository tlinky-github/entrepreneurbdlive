import React from 'react';
import { AuthProvider } from '../../lib/auth.jsx';
import SubmissionPage from './SubmissionPage.jsx';

const SubmissionPageWrapper = () => {
  return (
    <AuthProvider>
      <SubmissionPage />
    </AuthProvider>
  );
};

export default SubmissionPageWrapper;
