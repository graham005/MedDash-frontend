import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      phone: '',
      country: '+1',
      terms: false,
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setLoading(false);
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900 fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0 cursor-pointer"
        onClick={() => navigate({ to: '/' })}
        aria-label="Close register"
      />
      <Card className="relative m-2 w-full max-w-sm p-6 rounded-lg shadow-md bg-white dark:bg-slate-900 z-10">
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
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2H7v-2h4V7h2v4h4v2h-4v2z"/></svg>
            </span>
            HealthCare
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Create Your Account</div>
          <div className="text-slate-500 dark:text-slate-400 text-xs">Join in 30 seconds</div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-2"
        >
          {/* Email Field - unchanged */}
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
                  Email Address*
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="mb-1"
                />
                {field.state.meta.isTouched && field.state.meta.errors && (
                  <div className="text-xs text-red-500">{field.state.meta.errors}</div>
                )}
              </div>
            )}
          </form.Field>

          {/* Password Field - unchanged */}
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
                  placeholder="Create a strong password"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="mb-1"
                />
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Enter password to see strength</div>
                {field.state.meta.isTouched && field.state.meta.errors && (
                  <div className="text-xs text-red-500">{field.state.meta.errors}</div>
                )}
              </div>
            )}
          </form.Field>

          {/* Phone Field - fixed */}
          <form.Field
            name="phone"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? 'Phone number is required'
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Phone Number*
                </label>
                <div className="flex gap-2">
                  <select
                    className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2"
                    value={form.getFieldValue('country')}
                    onChange={e => form.setFieldValue('country', e.target.value)}
                  >
                    <option value="+1">+1</option>
                    <option value="+254">+254</option>
                    <option value="+91">+91</option>
                  </select>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="mb-1 flex-1"
                  />
                </div>
                {field.state.meta.isTouched && field.state.meta.errors && (
                  <div className="text-xs text-red-500">{field.state.meta.errors}</div>
                )}
              </div>
            )}
          </form.Field>

          {/* Terms Field - unchanged */}
          <form.Field name="terms">
            {(field) => (
              <div className="flex items-center gap-2 my-1">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={e => field.handleChange(e.target.checked)}
                  className="accent-indigo-500"
                  id="terms"
                />
                <label htmlFor="terms" className="text-xs text-slate-700 dark:text-slate-200">
                  I agree to the <a href="#" className="text-indigo-500 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-500 hover:underline">Privacy Policy</a>
                </label>
              </div>
            )}
          </form.Field>

          <Button
            type="submit"
            className="w-full bg-indigo-400 hover:bg-indigo-500 text-white mt-2"
            disabled={loading || !form.state.isValid || !form.state.values.terms}
          >
            {loading ? "Creating..." : "Continue"}
          </Button>
        </form>
        <div className="flex items-center my-2">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          <span className="mx-2 text-xs text-slate-400">or</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="flex items-center justify-center mb-2">
          <span className="text-xs text-indigo-500 flex items-center gap-1">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2H7v-2h4V7h2v4h4v2h-4v2z"/></svg>
            HIPAA-compliant
          </span>
        </div>
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account? <a href="/login" className="text-indigo-500 hover:underline">Sign in</a>
        </div>
      </Card>
    </div>
  );
}