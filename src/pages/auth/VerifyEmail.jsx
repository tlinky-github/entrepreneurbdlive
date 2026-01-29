import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setErrorMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await api.post('/auth/verify-email', { token });
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || 'Verification failed');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="verify-loading">
        <div className="w-full max-w-md text-center">
          <Loader2 className="w-16 h-16 text-emerald-900 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Verifying Your Email</h1>
          <p className="text-stone-600">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="verify-success">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-900" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Email Verified!</h1>
          <p className="text-stone-600 mb-8">
            Your email has been verified successfully. Welcome to entrepreneurs.bd!
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard">
              <Button className="w-full bg-emerald-900 hover:bg-emerald-800">
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">
                Explore Platform
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="verify-error">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Verification Failed</h1>
        <p className="text-stone-600 mb-8">{errorMessage}</p>
        <div className="flex flex-col gap-3">
          <Link to="/login">
            <Button className="w-full bg-emerald-900 hover:bg-emerald-800">
              <Mail className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
