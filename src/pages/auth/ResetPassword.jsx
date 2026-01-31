import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setSuccess(true);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4">
        <SEO title="Invalid Reset Link | Entrepreneur BD" />
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Invalid Reset Link</h1>
          <p className="text-stone-600 mb-8">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password">
            <Button className="bg-emerald-900 hover:bg-emerald-800">
              Request New Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="reset-success">
        <SEO title="Password Reset Successful | Entrepreneur BD" />
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-900" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Password Reset Successful</h1>
          <p className="text-stone-600 mb-8">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link to="/login">
            <Button className="bg-emerald-900 hover:bg-emerald-800">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="reset-password-page">
      <SEO
        title="Reset Password | Entrepreneur BD"
        description="Choose a new password for your account."
      />
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-emerald-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">e</span>
          </div>
          <div>
            <span className="font-bold text-xl text-stone-900">entrepreneurs</span>
            <span className="text-emerald-900 font-bold">.bd</span>
          </div>
        </Link>

        <Card className="border-stone-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-stone-900">Reset Password</CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    data-testid="reset-password-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    data-testid="reset-confirm-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-900 hover:bg-emerald-800"
                disabled={loading}
                data-testid="reset-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
