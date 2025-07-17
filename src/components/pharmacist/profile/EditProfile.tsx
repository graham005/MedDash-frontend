import { useState, useEffect } from 'react';
import { useCurrentUser, useUpdatePharmacistProfile } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import type { TPharmacistProfile } from '@/types/types';

export default function EditPharmacistProfile() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdatePharmacistProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pharmacyName: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.profile && user.userRole === "pharmacist") {
        const pharmacistProfile = user.profile as TPharmacistProfile
      setForm({
        pharmacyName: pharmacistProfile.pharmacyName || '',
        licenseNumber: pharmacistProfile.licenseNumber || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!user?.profile?.id) {
        setError('Pharmacist profile ID is missing.');
        return;
      }
      await updateProfile.mutateAsync({
        id: user.profile.id,
        profileData: {
          pharmacyName: form.pharmacyName,
          licenseNumber: form.licenseNumber,
        },
      });
      navigate({ to: '/dashboard/pharmacist/profile' });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FD] dark:bg-slate-950 py-10 px-2 flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full max-w-3xl bg-[#021373] dark:bg-[#010626] px-8 py-5 flex items-center justify-between rounded-t-lg shadow">
        <div>
          <div className="font-bold text-white text-lg">Pharmacist Profile Editor</div>
          <div className="text-sm text-[#C7D2FE] dark:text-[#8491D9]">Manage your pharmacy profile</div>
        </div>
      </div>
      {/* Main Card */}
      <Card className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-b-lg shadow-[0_4px_12px_0_rgba(2,15,89,0.10)] border-2 border-transparent mt-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#021373] dark:text-white">Edit Profile</CardTitle>
          <div className="text-sm text-[#8491D9] dark:text-[#C7D2FE]">Update your pharmacy information</div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Pharmacy Name</label>
                <input
                  type="text"
                  name="pharmacyName"
                  value={form.pharmacyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="Pharmacy Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-slate-900 dark:text-white"
                  placeholder="PH-2023-1234"
                />
              </div>
            </div>
            {/* Error */}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-[#8491D9] text-[#021373] dark:text-[#8491D9] hover:border-[#021373] hover:bg-[#e6eafd] dark:hover:bg-[#021373]/20 transition w-1/2"
                onClick={() => navigate({ to: '/dashboard/pharmacist/profile' })}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                className="bg-[#021373] hover:bg-[#8491D9] text-white w-1/2"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Publishing...' : 'Publish Profile'}
              </Button>
            </div>
            <div className="text-right text-xs text-gray-400 mt-2">Last saved: 2 minutes ago</div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}