import { useProfile } from "@/hooks/useAuth";
import { getInitials } from "./ProfileDetails"

function ProfileHeader() {
    const { data: profile } = useProfile();
    const user = profile?.user;
  return (
    <div className="w-full bg-[#021373] dark:bg-[#010626] px-8 py-5 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-[#021373] rounded-full w-10 h-10 flex items-center justify-center">
            <span className="text-[#021373] dark:text-white font-bold text-xl">👨‍⚕️</span>
          </div>
          <div>
            <div className="font-bold text-white text-lg">MD Profile Editor</div>
            <div className="text-sm text-[#C7D2FE] dark:text-[#8491D9]">Manage your medical practice profile</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">{user?.firstName} {user?.lastName}</span>
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Doctor" className="w-10 h-10 rounded-full object-cover border-2 border-[#8491D9]" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#8491D9] flex items-center justify-center text-white font-bold text-lg">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          )}
        </div>
      </div>

  )
}

export default ProfileHeader