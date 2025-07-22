import { useProfile } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import ProfileHeader from './Header';
import { useState } from 'react';
import EditDoctorProfileModal from './EditProfile';

export function getInitials(firstName?: string, lastName?: string) {
  if (!firstName && !lastName) return '';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export default function DoctorProfileDetails() {
  const { data: profile, isLoading } = useProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading profile...</div>;
  }

  const user = profile?.user;

  return (
    <div className="min-h-screen bg-[#F5F7FD] dark:bg-slate-950 py-0 px-0">
      <ProfileHeader />
      {/* Main Card */}
      <div className="max-w-2xl mx-auto mt-10 mb-8 px-2">
        <Card className="bg-white dark:bg-slate-800 rounded-lg shadow-[0_4px_12px_0_rgba(2,15,89,0.10)] border-2 border-transparent hover:border-[#8491D9]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#021373] dark:text-white">Profile</CardTitle>
            <div className="text-sm text-[#8491D9] dark:text-[#C7D2FE]">Update your professional information and availability</div>
          </CardHeader>
          <CardContent>
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex-shrink-0">
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt="Doctor"
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
                    Dr. {user?.firstName} {user?.lastName}
                  </span>
                  <span className="flex items-center gap-1 bg-[#8491D9] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {profile?.specialization || 'Specialization'}
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

            {/* Professional Info */}
            <div className="mb-6">
              <div className="rounded-lg bg-[#010626] px-6 py-3 mb-2">
                <span className="text-white text-lg font-semibold">Professional Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-6 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-[#021373] dark:text-[#8491D9] mb-1">Medical License</label>
                  <div className="font-semibold text-[#010626] dark:text-white">{profile?.licenseNumber || 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#021373] dark:text-[#8491D9] mb-1">Years of Experience</label>
                  <div className="font-semibold text-[#8491D9]">{profile?.yearsOfExperience ?? 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#021373] dark:text-[#8491D9] mb-1">Hospital Affiliation</label>
                  <div className="font-semibold text-[#010626] dark:text-white">{profile?.hospitalAffiliation || 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#021373] dark:text-[#8491D9] mb-1">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {profile?.specializations?.length
                      ? profile.specializations.map((spec: string, i: number) => (
                        <span key={i} className="bg-[#8491D9] text-white px-3 py-1 rounded-full text-xs font-semibold">{spec}</span>
                      ))
                      : <span className="text-gray-400">Not set</span>
                    }
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#021373] dark:text-[#8491D9] mb-1">Consultation Fee</label>
                  <div className="font-semibold text-[#8491D9]">
                    {profile?.consultationFee ? `Ksh ${profile.consultationFee}` : <span className="text-gray-400">Not set</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="mb-6">
              <div className="rounded-lg bg-[#010626] px-6 py-3 mb-2">
                <span className="text-white text-lg font-semibold">Education</span>
              </div>
              <ul className="list-disc ml-6 mt-1 text-[#010626] dark:text-white">
                {profile?.qualification
                  ? profile.qualification.split(',').map((q: string, i: number) => (
                    <li key={i}>{q.trim()}</li>
                  ))
                  : <li className="text-gray-400">Not set</li>
                }
              </ul>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                className="border-[#8491D9] text-[#8491D9] hover:border-[#021373] hover:bg-[#e6eafd] dark:hover:bg-[#021373]/20 transition"
                onClick={openEditModal}
              >
                Edit Profile
              </Button>

              <EditDoctorProfileModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
              />
          </div>
        </CardContent>
      </Card>
    </div>
    </div >
  );
}