import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Building2, Users } from 'lucide-react';

const Register = () => {
  const [accountType, setAccountType] = useState('user');

  const handleCreateAccount = () => {
    toast.info('Coming Soon! Registration will be implemented soon.', {
      style: {
        background: '#065f46',
        border: '1px solid #047857',
        color: '#ecfdf5'
      }
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4" data-testid="register-page">
      <SEO pageKey="register" />
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
            <CardTitle className="text-2xl font-bold text-stone-900">Create Account</CardTitle>
            <CardDescription>Join Bangladesh's entrepreneur community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
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
                      <div className="text-xs text-stone-500">Reader & Community</div>
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
                      <div className="text-xs text-stone-500">Profile & Listing</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    className="pl-10"
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    className="pl-10"
                    data-testid="register-password-input"
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
                    placeholder="Confirm your password"
                    className="pl-10"
                    data-testid="register-confirm-password-input"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleCreateAccount}
                className="w-full bg-emerald-900 hover:bg-emerald-800"
                data-testid="register-submit-btn"
              >
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-stone-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-900 hover:text-emerald-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-stone-500">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-emerald-900 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-emerald-900 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
