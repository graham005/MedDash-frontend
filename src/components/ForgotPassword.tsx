import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { requestPasswordReset } from '@/api/auth'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      try {
        await requestPasswordReset(value.email);
        setSuccess(true);
        toast.success('If your email exists, a reset link has been sent.');
      } catch (error) {
        console.error('Forgot password failed:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900 px-4">
        <Card className="w-full max-w-md p-6 rounded-lg shadow-md bg-white dark:bg-slate-900">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If an account with that email exists, we've sent you a password reset link.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate({ to: '/login' })}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Back to Login
              </Button>
              <Button
                variant="outline"
                onClick={() => setSuccess(false)}
                className="w-full"
              >
                Try Another Email
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900 px-4">
      <Card className="w-full max-w-md p-6 rounded-lg shadow-md bg-white dark:bg-slate-900 relative">
        {/* X Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold p-1 rounded transition"
          onClick={() => navigate({ to: '/login' })}
          aria-label="Close"
          type="button"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <div className="text-xl font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-center gap-2 mb-4">
            <span className="inline-block bg-indigo-100 dark:bg-indigo-900 rounded-full p-1.5">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2c-.3 0-.5.1-.7.2l-7 3.1c-.5.2-.8.7-.8 1.2v4.6c0 5.2 3.3 10.1 8.1 11.7.2.1.5.1.7 0 4.8-1.6 8.1-6.5 8.1-11.7V6.5c0-.5-.3-1-.8-1.2l-7-3.1C12.5 2.1 12.3 2 12 2zm0 2.2l6 2.7v4.1c0 4.3-2.7 8.5-6 9.9-3.3-1.4-6-5.6-6-9.9V6.9l6-2.7z"/>
              </svg>
            </span>
            MedDash
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot Password?</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Don't worry! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? 'Email is required'
                  : !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
                  ? 'Invalid email address'
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Email Address*
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
                {field.state.meta.isTouched && field.state.meta.errors && (
                  <div className="text-xs text-red-500 mt-1">{field.state.meta.errors}</div>
                )}
              </div>
            )}
          </form.Field>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={loading || !form.state.isValid}
          >
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate({ to: '/login' })}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
          >
            ← Back to Login
          </button>
        </div>
      </Card>
    </div>
  );
}