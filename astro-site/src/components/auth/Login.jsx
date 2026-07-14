import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, AuthProvider } from '../../lib/auth';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success('Successfully logged in!');
      window.location.href = '/admin';
    } catch (error) {
      toast.error('Failed to log in with Google', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-emerald-900 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">e</span>
          </div>
          <div>
            <span className="font-bold text-xl text-stone-900">entrepreneurs</span>
            <span className="text-emerald-900 font-bold">.bd</span>
          </div>
        </a>

        <Card className="border-stone-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-stone-900">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                )}
                Sign in with Google
                {!loading && <ArrowRight className="w-4 h-4 ml-2 opacity-50" />}
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-stone-600">
              Don't have an account?{' '}
              <a href="/register" className="text-emerald-900 hover:text-emerald-700 font-medium">
                Create one now
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-stone-500">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-emerald-900 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-emerald-900 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default function LoginWithAuth() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}
