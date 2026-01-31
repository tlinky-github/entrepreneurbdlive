import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="forgot-password-sent">
        <SEO title="Check Your Email | Entrepreneur BD" />
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-900" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Check Your Email</h1>
          <p className="text-stone-600 mb-8">
            If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <Link to="/login">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="forgot-password-page">
      <SEO
        title="Forgot Password | Entrepreneur BD"
        description="Reset your password to regain access to your Entrepreneur BD account."
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
            <CardTitle className="text-2xl font-bold text-stone-900">Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    data-testid="forgot-email-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-900 hover:bg-emerald-800"
                disabled={loading}
                data-testid="forgot-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-stone-600">
              Remember your password?{' '}
              <Link to="/login" className="text-emerald-900 hover:text-emerald-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
