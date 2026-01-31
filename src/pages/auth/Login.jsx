import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const handleSignIn = () => {
    toast.info('Coming Soon! Authentication will be implemented soon.', {
      style: {
        background: '#065f46',
        border: '1px solid #047857',
        color: '#ecfdf5'
      }
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="login-page">
      <SEO pageKey="login" />
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
            <CardTitle className="text-2xl font-bold text-stone-900">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    data-testid="login-email-input"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-emerald-900 hover:text-emerald-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    data-testid="login-password-input"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSignIn}
                className="w-full bg-emerald-900 hover:bg-emerald-800"
                data-testid="login-submit-btn"
              >
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-stone-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-900 hover:text-emerald-700 font-medium">
                Create one now
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-stone-500">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-emerald-900 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-emerald-900 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
