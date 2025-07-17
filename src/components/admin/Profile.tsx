import { useState } from 'react';
import { useProfile, useUpdateAdminProfile } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

function getInitials(firstName?: string, lastName?: string) {
  if (!firstName && !lastName) return '';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function EditProfileModal({ open, onClose, profile, onSave }: {
  open: boolean;
  onClose: () => void;
  profile: any;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    firstName: profile?.user?.firstName || "",
    lastName: profile?.user?.lastName || "",
    email: profile?.user?.email || "",
    department: profile?.department || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-lg font-bold mb-4 text-indigo-900 dark:text-white">Edit Admin Profile</div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="firstName">First Name</label>
          <input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            required
            className="rounded px-3 py-2 border bg-indigo-50 dark:bg-slate-800 dark:text-white"
          />
          <label htmlFor="lastName">Last Name</label>
          <input
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            required
            className="rounded px-3 py-2 border bg-indigo-50 dark:bg-slate-800 dark:text-white"
          />
          <label htmlFor="email">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="rounded px-3 py-2 border bg-indigo-50 dark:bg-slate-800 dark:text-white"
          />
          <label htmlFor="department">Department</label>
          <input
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
            className="rounded px-3 py-2 border bg-indigo-50 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex gap-2 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-indigo-700 text-white">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProfileDetails() {
  const { data: profile, isLoading } = useProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const updateAdminProfile = useUpdateAdminProfile();

  // Save handler with mutation logic
  const handleSave = (data: any) => {
    if (!profile?.id) return;
    updateAdminProfile.mutate(
      { id: profile.id, profileData: data },
      {
        onSuccess: () => {
          setModalOpen(false);
        },
        onError: (err: any) => {
          // Optionally show error toast
          console.error("An Error occured on update: ",err)
        }
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading profile...</div>;
  }

  const user = profile?.user;

  return (
    <div className="min-h-screen bg-[#F5F7FD] dark:bg-slate-950 py-0 px-0">
      <EditProfileModal open={modalOpen} onClose={() => setModalOpen(false)} profile={profile} onSave={handleSave} />
      <div className="max-w-2xl mx-auto mt-10 mb-8 px-2">
        <Card className="bg-white dark:bg-slate-800 rounded-lg shadow-[0_4px_12px_0_rgba(2,15,89,0.10)] border-2 border-transparent hover:border-[#8491D9]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#021373] dark:text-white">Admin Profile</CardTitle>
            <div className="text-sm text-[#8491D9] dark:text-[#C7D2FE]">Manage your admin information and department</div>
          </CardHeader>
          <CardContent>
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex-shrink-0">
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt="Admin"
                    className="w-24 h-24 rounded-full border-[3px] border-[#8491D9] object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-[3px] border-[#8491D9] bg-[#020F59] flex items-center justify-center text-3xl font-bold text-white">
                    {getInitials(user?.firstName, user?.lastName)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#010626] dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="flex items-center gap-1 bg-[#8491D9] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Admin
                  </span>
                  <span className="flex items-center gap-1 ml-2">
                    <ShieldCheckIcon className="w-5 h-5 text-[#8491D9]" />
                    <span className="text-xs text-[#8491D9] font-semibold">Verified</span>
                  </span>
                </div>
                <div className="mt-1 text-[#8491D9] text-sm font-medium">
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Department Info */}
            <div className="mb-6">
              <div className="rounded-lg bg-[#010626] px-6 py-3 mb-2">
                <span className="text-white text-lg font-semibold">Department</span>
              </div>
              <div className="grid grid-cols-1 gap-6 bg-white dark:bg-slate-800 p-6 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-[#021373] dark:text-[#8491D9] mb-1">Department</label>
                  <div className="font-semibold text-[#010626] dark:text-white">{profile?.department || 'Not set'}</div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                className="border-[#8491D9] text-[#8491D9] hover:border-[#021373] hover:bg-[#e6eafd] dark:hover:bg-[#021373]/20 transition"
                onClick={() => setModalOpen(true)}
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}