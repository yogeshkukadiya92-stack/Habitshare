'use client';

import { useEffect, useState, type FocusEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Sparkles, ShieldCheck, Users, ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const handleFieldFocus = (event: FocusEvent<HTMLInputElement>) => {
    const section = event.currentTarget.closest('section');
    setIsTyping(true);
    window.setTimeout(() => {
      section?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 50);
  };

  const handleFieldBlur = () => {
    window.setTimeout(() => setIsTyping(false), 220);
  };

  const highlights = [
    { title: 'Social accountability', description: 'Share habits with trusted friends and keep consistency visible.', icon: Users },
    { title: 'Premium reporting', description: 'Daily, monthly, and yearly insight views built for momentum.', icon: Sparkles },
    { title: 'Secure sync', description: 'Your habits and profile stay backed by Supabase authentication.', icon: ShieldCheck },
  ] as const;

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [authLoading, router, user]);

  const getAuthErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Authentication failed. Please try again.';

    if (message.toLowerCase().includes('invalid login credentials')) {
      return 'Email or password is incorrect.';
    }
    if (message.toLowerCase().includes('email not confirmed')) {
      return 'Please confirm your email before signing in.';
    }
    if (message.toLowerCase().includes('password should be at least')) {
      return 'Password must be at least 6 characters.';
    }

    return message;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      toast({ title: 'Login Successful', description: 'Welcome back to Habit Share.' });
    } catch (error) {
      toast({ title: 'Login Failed', description: getAuthErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: email.trim().split('@')[0],
          },
        },
      });
      if (error) throw error;
      toast({ title: 'Sign Up Successful', description: 'Your Supabase account has been created.' });
    } catch (error) {
      toast({ title: 'Sign Up Failed', description: getAuthErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100svh] overflow-x-hidden overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-6 sm:py-6 lg:px-8">
      <div className="hero-orb left-0 top-20 h-40 w-40 bg-violet-300/40" />
      <div className="hero-orb right-10 top-10 h-44 w-44 bg-sky-300/40" />

      <div className="mx-auto grid w-full max-w-6xl gap-3 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <section className={`glass-panel relative order-2 overflow-hidden rounded-[28px] p-4 sm:rounded-[34px] sm:p-8 lg:order-1 ${isTyping ? 'hidden sm:block' : 'hidden sm:block'}`}>
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),transparent_62%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 sm:px-4 sm:text-[11px] sm:tracking-[0.3em]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Premium social habit system
            </div>

            <div className="mt-4 flex items-center gap-3 sm:mt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary text-white shadow-xl shadow-primary/20 sm:h-14 sm:w-14 sm:rounded-[20px]">
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tighter text-slate-950 sm:text-5xl">Habit Share</div>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 sm:text-sm sm:tracking-[0.28em]">Consistency that feels premium</p>
              </div>
            </div>

            <h1 className="mt-5 max-w-2xl text-2xl font-black leading-tight tracking-tight text-slate-950 sm:mt-8 sm:text-5xl">
              Build routines people actually keep, not resolutions they forget.
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
              Habit Share blends private discipline, social accountability, and beautiful analytics into one mobile-first habit experience built to scale.
            </p>

            <div className="mt-8 hidden gap-4 sm:grid">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-base font-black text-slate-900">{item.title}</div>
                        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
              <div className="rounded-[22px] bg-white/80 p-4 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Focus</div>
                <div className="mt-2 text-2xl font-black text-slate-900">Daily</div>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Reports</div>
                <div className="mt-2 text-2xl font-black text-slate-900">360°</div>
              </div>
              <div className="rounded-[22px] bg-white/80 p-4 shadow-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Momentum</div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-900">
                  <Flame className="h-5 w-5 text-amber-500" />
                  Streaks
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`glass-panel order-1 rounded-[28px] p-3 sm:rounded-[34px] sm:p-6 lg:order-2 ${isTyping ? 'fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 shadow-2xl shadow-primary/15 sm:static sm:shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)]' : ''}`}>
          <Tabs defaultValue="signin" className="w-full">
            <div className={`mb-3 flex items-center gap-3 rounded-[24px] bg-gradient-to-r from-primary/10 via-white to-sky-400/10 p-3 sm:hidden ${isTyping ? 'hidden' : ''}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary to-sky-400 text-white shadow-lg shadow-primary/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-950">Habit Share</div>
                <div className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">Coach for Life</div>
              </div>
            </div>
            <TabsList className={`grid h-auto w-full grid-cols-2 gap-2 rounded-[24px] border border-slate-200/60 bg-white/75 p-2 shadow-sm ${isTyping ? 'rounded-[20px] p-1.5' : ''}`}>
              <TabsTrigger value="signin" className={`rounded-[18px] text-sm font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-violet-500 data-[state=active]:text-white ${isTyping ? 'py-2' : 'py-3'}`}>
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className={`rounded-[18px] text-sm font-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-sky-500 data-[state=active]:text-white ${isTyping ? 'py-2' : 'py-3'}`}>
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className={`px-2 sm:pt-6 ${isTyping ? 'py-2 sm:pt-6' : 'pt-4'}`}>
                  <CardTitle className={`${isTyping ? 'text-xl' : 'text-2xl'} font-black tracking-tight text-slate-950 sm:text-3xl`}>Welcome back</CardTitle>
                  <CardDescription className={`text-sm font-medium text-slate-500 ${isTyping ? 'hidden sm:block' : ''}`}>
                    Sign in and continue the streaks, reports, and shared accountability you already started.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <form onSubmit={handleSignIn} className={`${isTyping ? 'space-y-3' : 'space-y-4'} sm:space-y-5`}>
                    <div className={`${isTyping ? 'space-y-1.5' : 'space-y-2'}`}>
                      <Label htmlFor="signin-email" className={`${isTyping ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.24em] text-slate-400`}>Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={`${isTyping ? 'h-12' : 'h-14'} rounded-2xl border-white/80 bg-white/90 text-sm font-semibold shadow-sm`}
                      />
                    </div>
                    <div className={`${isTyping ? 'space-y-1.5' : 'space-y-2'}`}>
                      <Label htmlFor="signin-password" className={`${isTyping ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.24em] text-slate-400`}>Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onFocus={handleFieldFocus}
                          onBlur={handleFieldBlur}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={`${isTyping ? 'h-12' : 'h-14'} rounded-2xl border-white/80 bg-white/90 pr-12 text-sm font-semibold shadow-sm`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-11 w-11 rounded-2xl hover:bg-slate-100"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className={`${isTyping ? 'h-12' : 'h-14'} w-full rounded-2xl font-black shadow-xl shadow-primary/20`} disabled={loading}>
                      {loading ? 'Signing in...' : 'Enter Habit Share'}
                      {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className={`px-2 sm:pt-6 ${isTyping ? 'py-2 sm:pt-6' : 'pt-4'}`}>
                  <CardTitle className={`${isTyping ? 'text-xl' : 'text-2xl'} font-black tracking-tight text-slate-950 sm:text-3xl`}>Create your system</CardTitle>
                  <CardDescription className={`text-sm font-medium text-slate-500 ${isTyping ? 'hidden sm:block' : ''}`}>
                    Start with your first habit today, then grow into shared streaks, reports, and social momentum.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <form onSubmit={handleSignUp} className={`${isTyping ? 'space-y-3' : 'space-y-4'} sm:space-y-5`}>
                    <div className={`${isTyping ? 'space-y-1.5' : 'space-y-2'}`}>
                      <Label htmlFor="signup-email" className={`${isTyping ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.24em] text-slate-400`}>Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onFocus={handleFieldFocus}
                        onBlur={handleFieldBlur}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={`${isTyping ? 'h-12' : 'h-14'} rounded-2xl border-white/80 bg-white/90 text-sm font-semibold shadow-sm`}
                      />
                    </div>
                    <div className={`${isTyping ? 'space-y-1.5' : 'space-y-2'}`}>
                      <Label htmlFor="signup-password" className={`${isTyping ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.24em] text-slate-400`}>Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          onFocus={handleFieldFocus}
                          onBlur={handleFieldBlur}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={`${isTyping ? 'h-12' : 'h-14'} rounded-2xl border-white/80 bg-white/90 pr-12 text-sm font-semibold shadow-sm`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-11 w-11 rounded-2xl hover:bg-slate-100"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        </Button>
                      </div>
                    </div>
                    <div className={`rounded-[22px] bg-slate-950/5 p-4 ${isTyping ? 'hidden sm:block' : ''}`}>
                      <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">What you unlock</div>
                      <div className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                        <div>Private and shared habits</div>
                        <div>Analytics and streak tracking</div>
                        <div>Friend requests by email and QR</div>
                      </div>
                    </div>
                    <Button type="submit" className={`${isTyping ? 'h-12' : 'h-14'} w-full rounded-2xl font-black shadow-xl shadow-primary/20`} disabled={loading}>
                      {loading ? 'Creating account...' : 'Create account'}
                      {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
