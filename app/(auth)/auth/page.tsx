'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, User, ArrowLeft, Briefcase, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  age: z.string().optional(),
  profession: z.string().optional(),
  maritalStatus: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

const Auth = () => {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') as Mode || 'signin';
  const resetToken = searchParams.get('token');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, signIn, signUp, resetPassword, confirmPasswordReset } = useAuth();

  // Redirect if already logged in (unless resetting password)
  useEffect(() => {
    if (user && mode !== 'reset') {
      router.push('/');
    }
  }, [user, mode, router]);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '', age: '', profession: '', maritalStatus: '' },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const newPasswordForm = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    const { error } = await signIn(values.email, values.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Welcome back!', description: 'You have signed in successfully.' });
      router.push('/');
    }
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    const { error } = await signUp(
      values.email, 
      values.password, 
      values.displayName,
      values.age ? parseInt(values.age) : undefined,
      values.profession || undefined,
      values.maritalStatus || undefined
    );
    setIsSubmitting(false);

    if (error) {
      const message = error.message.includes('already registered')
        ? 'This email is already registered. Please sign in instead.'
        : error.message;
      toast({ title: 'Sign up failed', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Welcome to DailyGita.' });
      router.push('/onboarding');
    }
  };

  const handleForgotPassword = async (values: z.infer<typeof resetSchema>) => {
    setIsSubmitting(true);
    const { error } = await resetPassword(values.email);
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Check your email', 
        description: 'We sent you a password reset link.',
      });
      setMode('signin');
    }
  };

  const handleNewPassword = async (values: z.infer<typeof newPasswordSchema>) => {
    if (!resetToken) {
      toast({
        title: 'Reset link required',
        description: 'Open the link from your reset email to choose a new password.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await confirmPasswordReset(resetToken, values.password);
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated!', description: 'You can now sign in with your new password.' });
      setMode('signin');
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Set New Password'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin' && 'Sign in to continue your journey'}
            {mode === 'signup' && 'Start your journey with the Bhagavad Gita'}
            {mode === 'forgot' && 'Enter your email to receive a reset link'}
            {mode === 'reset' && 'Choose a new password for your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'signin' && (
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="you@example.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                </Button>
              </form>
            </Form>
          )}

          {mode === 'signup' && (
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Your name" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="you@example.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="number" placeholder="Your age" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession (optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="e.g., Engineer, Teacher" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status (optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="pl-10">
                            <Heart className="absolute left-3 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}

          {mode === 'forgot' && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="you@example.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode('signin')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </form>
            </Form>
          )}

          {mode === 'reset' && (
            <Form {...newPasswordForm}>
              <form onSubmit={newPasswordForm.handleSubmit(handleNewPassword)} className="space-y-4">
                <FormField
                  control={newPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                </Button>
              </form>
            </Form>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <div className="mt-6 space-y-2">
              {mode === 'signin' && (
                <>
                  <Button
                    variant="link"
                    className="w-full text-muted-foreground"
                    onClick={() => setMode('forgot')}
                  >
                    Forgot your password?
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setMode('signup')}>
                      Sign up
                    </Button>
                  </p>
                </>
              )}
              {mode === 'signup' && (
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setMode('signin')}>
                    Sign in
                  </Button>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
