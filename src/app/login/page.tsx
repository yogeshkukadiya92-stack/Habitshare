'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirebase, ensureEmailAccount } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { defaultLoginCredential } from '@/lib/default-login';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const starterCredential = defaultLoginCredential;

  const getAuthErrorMessage = (error: any) => {
    const code = error?.code || '';

    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is disabled in Firebase. Please enable it in Firebase Console.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network issue. Please check internet connection and retry.';
    }

    return error?.message || 'Authentication failed. Please try again.';
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ensureEmailAccount(auth, email.trim(), password);
      toast({
        title: 'Access Ready',
        description: 'Logged in successfully. If account did not exist, it was created automatically.',
      });
    } catch (error: any) {
      toast({ title: 'Login Failed', description: getAuthErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStarterAccess = async () => {
    setLoading(true);
    setEmail(starterCredential.email);
    setPassword(starterCredential.password);

    try {
      await ensureEmailAccount(auth, starterCredential.email, starterCredential.password);
      toast({
        title: 'Starter Access Ready',
        description: 'Signed in with the starter account, or created it if this is the first run.',
      });
    } catch (error: any) {
      toast({
        title: 'Starter Access Failed',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="w-full max-w-[400px] space-y-4">
        <Alert>
          <AlertTitle>Starter login credential</AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="space-y-1">
              <p>Email: {starterCredential.email}</p>
              <p>Password: {starterCredential.password}</p>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleStarterAccess} disabled={loading}>
              {loading ? 'Preparing starter access...' : 'Use starter credential'}
            </Button>
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter email and password. If account does not exist, it will be created automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContinue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
