'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success('Successfully logged in!');
      router.push('/admin');
    } catch (error) {
      toast.error('Failed to log in with Google', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* 🛡️ Aesthetic Background Deck */}
      <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none text-emerald-900">
         <ShieldCheck size={400} />
      </div>
      <div className="absolute bottom-0 left-0 p-24 opacity-5 pointer-events-none text-emerald-900">
         <Sparkles size={400} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* 🛡️ Premium Logo Interaction */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-12 group">
          <div className="w-14 h-14 bg-emerald-900 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20 group-hover:scale-110 transition-transform duration-500">
            <span className="text-white font-black text-3xl">e</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl text-stone-900 tracking-tighter leading-none uppercase">entrepreneurs</span>
            <span className="text-emerald-900 font-black text-lg tracking-widest uppercase leading-none opacity-80">.bd</span>
          </div>
        </Link>

        <Card className="border-none shadow-2xl shadow-stone-200/60 bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pt-12 pb-8 px-10">
            <CardTitle className="text-3xl font-black text-stone-900 tracking-tight mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-stone-400 font-medium tracking-tight">Sign in with your professional identity</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <div className="space-y-6">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-16 bg-white text-stone-700 hover:bg-stone-50 border border-stone-100 rounded-2xl shadow-sm flex items-center justify-center gap-4 group transition-all duration-300"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-900" />
                ) : (
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                <span className="font-black text-xs uppercase tracking-widest">Sign in with Google</span>
                {!loading && <ArrowRight className="w-4 h-4 ml-2 opacity-30 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </div>

            <div className="mt-10 text-center text-xs font-black text-stone-300 uppercase tracking-widest">
              Don't have an account?{' '}
              <Link href="/register" className="text-emerald-900 hover:text-emerald-700 ml-1 transition-colors">
                Create Identity
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-emerald-900/60 hover:text-emerald-900 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-emerald-900/60 hover:text-emerald-900 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
