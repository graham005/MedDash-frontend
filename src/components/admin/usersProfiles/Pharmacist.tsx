import { useAllProfiles } from "@/hooks/useUsers";
import { UserStatus, UserRole } from "@/types/enums";
import { Card } from "@/components/ui/card";

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  active: "text-indigo-500",
  pending: "text-yellow-500",
  suspended: "text-red-500",
};

export default function Pharmacist() {
  const { data: profiles = [], isLoading } = useAllProfiles();

  // Filter only pharmacist profiles
  const pharmacists = profiles.filter((user) => user.userRole === UserRole.PHARMACIST);

  return (
    <div className="min-h-screen dark:bg-slate-950 py-6 px-2 md:px-8 flex flex-col items-center">
      <Card className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-lg shadow-lg border-2 border-transparent">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 pt-6">
          <div>
            <div className="text-2xl font-bold text-[#0a1240] dark:text-white">Pharmacist Profiles</div>
            <div className="text-sm text-indigo-500 dark:text-indigo-300">View all registered pharmacists and their details</div>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto px-2 pb-6 mt-6">
          <table className="min-w-full rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#0a1240] dark:bg-slate-800 text-indigo-100 text-left">
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Pharmacy Name</th>
                <th className="px-4 py-3">License Number</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-indigo-500 dark:text-indigo-200">Loading pharmacists...</td>
                </tr>
              ) : pharmacists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-indigo-500 dark:text-indigo-200">No pharmacists found.</td>
                </tr>
              ) : (
                pharmacists.map((pharmacist) => {
                  const profile = pharmacist.profile || {};
                  return (
                    <tr key={pharmacist.id} className="bg-white dark:bg-slate-900 border-b border-indigo-50 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 transition">
                      <td className="px-4 py-3 text-xs font-mono text-indigo-900 dark:text-indigo-200">{pharmacist.id}</td>
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${pharmacist.firstName}+${pharmacist.lastName}`}
                          alt={pharmacist.firstName}
                          className="w-8 h-8 rounded-full border border-indigo-200 dark:border-slate-700 object-cover"
                        />
                        <div>
                          <div className="font-semibold text-indigo-900 dark:text-white">{pharmacist.firstName} {pharmacist.lastName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-indigo-500 dark:text-indigo-300">{pharmacist.email}</td>
                      <td className="px-4 py-3 text-xs text-indigo-900 dark:text-indigo-200">{profile.pharmacyName || "-"}</td>
                      <td className="px-4 py-3 text-xs text-indigo-900 dark:text-indigo-200">{profile.licenseNumber || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-2 text-xs font-semibold ${STATUS_COLORS[pharmacist.userStatus || UserStatus.ACTIVE]}`}>
                          <span className="w-2 h-2 rounded-full inline-block" style={{
                            background: pharmacist.userStatus === UserStatus.ACTIVE ? "#6366f1" : pharmacist.userStatus === UserStatus.PENDING ? "#fbbf24" : "#ef4444"
                          }} />
                          {STATUS_LABELS[pharmacist.userStatus || UserStatus.ACTIVE]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}