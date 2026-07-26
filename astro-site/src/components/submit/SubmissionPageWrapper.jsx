import React from 'react';
import { AuthProvider } from '../../lib/auth.jsx';
import SubmissionPage from './SubmissionPage.jsx';

const SubmissionPageWrapper = ({ initialMetadata }) => {
  return (
    <AuthProvider>
      <SubmissionPage initialMetadata={initialMetadata} />
    </AuthProvider>
  );
};

export default SubmissionPageWrapper;
