import { useForm } from '@tanstack/react-form'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLogin, useUserRole, useCurrentUser } from '@/hooks/useAuth' // <-- FIXED
import type { TSignIn } from '@/types/types'
import { isAuthenticated } from '@/api/auth'

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { mutateAsync: login, isPending: isLoginPending, error: loginError } = useLogin();
  const userRole = useUserRole();
  const { data: currentUser, isLoading } = useCurrentUser();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      try {
        await login(value as TSignIn);
      } catch (error) {
        console.error('Login failed:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (isLoading) return; // Wait for user data to load before redirecting

    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated && userRole && currentUser) {
        if (userRole === "doctor") {
          if (!currentUser.profile) {
            navigate({ to: '/dashboard/doctor/profile/create' });
            return;
          }
          navigate({ to: '/dashboard/doctor' });
        } else if (userRole === "patient") {
          if (!currentUser.profile) {
            navigate({ to: '/dashboard/patient/profile/create' });
            return;
          }
          navigate({ to: '/dashboard/patient' });
        } else if (userRole === "pharmacist") {
          if (!currentUser.profile) {
            navigate({ to: '/dashboard/pharmacist/profile/create' });
            return;
          }
          navigate({ to: '/dashboard/pharmacist' });
        } else if (userRole === "admin") {
          navigate({ to: '/dashboard/admin' });
        }
      }
    };
    checkAuth();
  }, [userRole, currentUser, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900 fixed inset-0 z-50">
        <div className="text-white dark:text-slate-200 text-lg font-semibold">Loading user...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900 fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0 cursor-pointer"
        onClick={() => navigate({ to: '/' })}
        aria-label="Close login"
      />
      <Card className="relative w-full max-w-sm p-6 rounded-lg shadow-md bg-white dark:bg-slate-900 z-10">
        {/* X Button */}
        <button
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold p-1 rounded transition"
          onClick={() => navigate({ to: '/' })}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        <div className="flex flex-col items-center mb-4">
          <div className="text-xl font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1.5">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-.3 0-.5.1-.7.2l-7 3.1c-.5.2-.8.7-.8 1.2v4.6c0 5.2 3.3 10.1 8.1 11.7.2.1.5.1.7 0 4.8-1.6 8.1-6.5 8.1-11.7V6.5c0-.5-.3-1-.8-1.2l-7-3.1C12.5 2.1 12.3 2 12 2zm0 2.2l6 2.7v4.1c0 4.3-2.7 8.5-6 9.9-3.3-1.4-6-5.6-6-9.9V6.9l6-2.7z"/></svg>
            </span>
            MedDash
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Welcome Back</div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">Sign in to your account to continue</div>
        </div>

        {/* Display login error if any */}
        {loginError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="text-sm text-red-800 dark:text-red-200">
              {loginError instanceof Error ? loginError.message : 'Login failed. Please try again.'}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-2"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? 'Email is required'
                  : !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
                  ? 'Invalid email'
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Email address*
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="mb-1"
                  disabled={loading || isLoginPending}
                />
                {field.state.meta.isTouched && field.state.meta.errors && (
                  <div className="text-xs text-red-500">{field.state.meta.errors}</div>
                )}
              </div>
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? 'Password is required'
                  : value.length < 6
                  ? 'Password must be at least 6 characters'
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Password*
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="mb-1"
                  disabled={loading || isLoginPending}
                />
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-indigo-400 hover:underline">Forgot password?</a>
                </div>
                {field.state.meta.isTouched && field.state.meta.errors && (
                  <div className="text-xs text-red-500">{field.state.meta.errors}</div>
                )}
              </div>
            )}
          </form.Field>
          <Button
            type="submit"
            className="w-full bg-indigo-400 hover:bg-indigo-500 text-white mt-2"
            disabled={loading || isLoginPending || !form.state.isValid}
          >
            {loading || isLoginPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="flex items-center my-2">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          <span className="mx-2 text-xs text-slate-400">or continue with</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="flex gap-2 justify-center mb-1">
          <Button variant="outline" className="w-10 h-10 p-0 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.5-7.6 21-17.5H24v-8.5h20.5z"/></g></svg>
          </Button>
          <Button variant="outline" className="w-10 h-10 p-0 flex items-center justify-center">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 1.5.7 1.5-.8 1.4-2.1 1-2.6.8-.1-.7-.3-1-.6-1.2-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.2 1.9-.3 2.9-.3s2 .1 2.9.3c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.9 1.2 1.9 1.2 3.2 0 4.4-2.7 5.4-5.3 5.7-.3.2-.6.5-.6 1.2 0 1.1.1 2.1.1 2.4 0 .3.2.7.8.6C20.7 21.4 24 17.1 24 12c0-6.3-5.2-11.5-12-11.5z"/></svg>
          </Button>
          <Button variant="outline" className="w-10 h-10 p-0 flex items-center justify-center">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M16.365 1.43c0 1.14-.93 2.07-2.07 2.07-1.14 0-2.07-.93-2.07-2.07 0-1.14.93-2.07 2.07-2.07 1.14 0 2.07.93 2.07 2.07zm-2.07 3.6c-2.07 0-3.6 1.53-3.6 3.6 0 1.14.93 2.07 2.07 2.07 1.14 0 2.07-.93 2.07-2.07 0-1.14-.93-2.07-2.07-2.07zm-2.07 3.6c-2.07 0-3.6 1.53-3.6 3.6 0 1.14.93 2.07 2.07 2.07 1.14 0 2.07-.93 2.07-2.07 0-1.14-.93-2.07-2.07-2.07zm-2.07 3.6c-2.07 0-3.6 1.53-3.6 3.6 0 1.14.93 2.07 2.07 2.07 1.14 0 2.07-.93 2.07-2.07 0-1.14-.93-2.07-2.07-2.07z"/></svg>
          </Button>
        </div>
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account? <a href="/register" className="text-indigo-500 hover:underline">Create account →</a>
        </div>
      </Card>
    </div>
  );
}