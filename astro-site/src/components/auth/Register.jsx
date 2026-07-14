import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowRight, Building2, Users, Loader2 } from 'lucide-react';
import { useAuth, AuthProvider } from '../../lib/auth';

const Register = () => {
  const [accountType, setAccountType] = useState('user');
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      await loginWithGoogle(accountType);
      toast.success('Successfully created your account!');
      window.location.href = '/admin';
    } catch (error) {
      toast.error('Failed to create account with Google', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="register-page">
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
            <CardTitle className="text-2xl font-bold text-stone-900">Create Account</CardTitle>
            <CardDescription>Join Bangladesh's entrepreneur community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Account Type Selection */}
              <div className="space-y-3">
                <Label>I am a...</Label>
                <RadioGroup
                  value={accountType}
                  onValueChange={setAccountType}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="user"
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${accountType === 'user'
                      ? 'border-emerald-900 bg-emerald-50'
                      : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    <RadioGroupItem value="user" id="user" className="sr-only" />
                    <Users className="w-5 h-5 text-emerald-900" />
                    <div>
                      <div className="font-medium text-stone-900">User</div>
                      <div className="text-sm text-stone-500">Reader & Community</div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="entrepreneur"
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${accountType === 'entrepreneur'
                      ? 'border-emerald-900 bg-emerald-50'
                      : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    <RadioGroupItem value="entrepreneur" id="entrepreneur" className="sr-only" />
                    <Building2 className="w-5 h-5 text-emerald-900" />
                    <div>
                      <div className="font-medium text-stone-900">Entrepreneur</div>
                      <div className="text-sm text-stone-500">Profile & Listing</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={loading}
                  className="w-full bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-sm mt-4"
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
                  Sign up with Google
                  {!loading && <ArrowRight className="w-4 h-4 ml-2 opacity-50" />}
                </Button>
              </div>

            </div>

            <div className="mt-6 text-center text-sm text-stone-600">
              Already have an account?{' '}
              <a href="/login" className="text-emerald-900 hover:text-emerald-700 font-medium">
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-stone-500">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-emerald-900 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-emerald-900 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default function RegisterWithAuth() {
  return (
    <AuthProvider>
      <Register />
    </AuthProvider>
  );
}
