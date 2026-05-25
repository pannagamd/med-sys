import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lock, Phone, Sparkles, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_NAME, MEDICAL_DISCLAIMER } from '@/lib/constants';
import { login, register, getCurrentUser } from '@/services/api/auth';
import { useAuthStore } from '@/store/auth-store';
import { getApiErrorMessage } from '@/services/api/client';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z
    .string()
    .min(7, 'Enter your phone number')
    .regex(/^\+[1-9]\d{6,14}$/, 'Use international format, e.g. +14155552671'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name').max(255),
  phone_number: z
    .string()
    .min(7, 'Enter your phone number')
    .regex(/^\+[1-9]\d{6,14}$/, 'Use international format, e.g. +14155552671'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export function AuthPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '+1', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', phone_number: '+1', password: '', confirm_password: '' },
  });

  async function handleLogin(values: LoginValues) {
    try {
      const session = await login({ username: values.username, password: values.password });
      setSession(session, session.user);
      const user = await getCurrentUser();
      setUser(user);
      toast.success('Signed in successfully.');
      navigate('/app');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleRegister(values: RegisterValues) {
    try {
      const session = await register({
        full_name: values.full_name,
        phone_number: values.phone_number,
        password: values.password,
      });
      setSession(session, session.user);
      const user = await getCurrentUser();
      setUser(user);
      toast.success('Account created. Welcome!');
      navigate('/app');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md border-white/70 bg-white/90 shadow-[0_30px_100px_-50px_rgba(15,118,110,0.4)] backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-teal-700">
              <Sparkles className="h-4 w-4" />
              {APP_NAME}
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Home</Link>
            </Button>
          </div>
          <CardTitle className="text-2xl">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Sign in with your phone number and password.'
              : 'Register with your phone number to get started.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              id="tab-login"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-teal-600 text-white'
                  : 'bg-transparent text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-register"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-teal-600 text-white'
                  : 'bg-transparent text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          {/* ── Login Form ── */}
          {mode === 'login' && (
            <form className="space-y-5" onSubmit={loginForm.handleSubmit(handleLogin)}>
              <div className="space-y-2">
                <Label htmlFor="login-username">Phone number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-username"
                    type="tel"
                    className="pl-10"
                    placeholder="+14155552671"
                    autoComplete="tel"
                    {...loginForm.register('username')}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Include country code (E.164), e.g. +1 for US, +91 for India.</p>
                {loginForm.formState.errors.username && (
                  <p className="text-sm text-rose-600">{loginForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...loginForm.register('password')}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-rose-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* ── Register Form ── */}
          {mode === 'register' && (
            <form className="space-y-5" onSubmit={registerForm.handleSubmit(handleRegister)}>
              <div className="space-y-2">
                <Label htmlFor="reg-full-name">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-full-name"
                    placeholder="Alex Morgan"
                    className="pl-10"
                    autoComplete="name"
                    {...registerForm.register('full_name')}
                  />
                </div>
                {registerForm.formState.errors.full_name && (
                  <p className="text-sm text-rose-600">{registerForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    className="pl-10"
                    placeholder="+14155552671"
                    autoComplete="tel"
                    {...registerForm.register('phone_number')}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Include country code (E.164), e.g. +1 for US, +91 for India.</p>
                {registerForm.formState.errors.phone_number && (
                  <p className="text-sm text-rose-600">{registerForm.formState.errors.phone_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...registerForm.register('password')}
                  />
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-rose-600">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    className="pl-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...registerForm.register('confirm_password')}
                  />
                </div>
                {registerForm.formState.errors.confirm_password && (
                  <p className="text-sm text-rose-600">{registerForm.formState.errors.confirm_password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={registerForm.formState.isSubmitting}
              >
                {registerForm.formState.isSubmitting ? 'Creating account...' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <p className="text-center text-xs leading-5 text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
        </CardContent>
      </Card>
    </div>
  );
}
