import { createFileRoute } from '@tanstack/react-router'
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { UserIcon, IdentificationIcon, BeakerIcon, CalendarIcon, ClipboardIcon, VideoCameraIcon, FolderIcon, LockClosedIcon, DevicePhoneMobileIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import logo from '../logo.svg'
import Header from '@/components/Header';

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900">
      <Header />
      {/* Hero Section */}
      <section className="w-full py-20 px-4 flex min-h-screen flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] dark:from-slate-950 dark:to-slate-900">
        <div className="flex-1 flex flex-col gap-6 max-w-xl p-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white dark:text-slate-100">
            Your Health,<br />
            <span className="underline decoration-2 decoration-white dark:decoration-slate-100">Simplified</span>
          </h1>
          <p className="text-lg text-slate-200 dark:text-slate-300 max-w-md">
            Book appointments, manage prescriptions, and connect with doctors—all in one place
          </p>
          <div className="flex gap-4 mt-4">
            <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white dark:bg-indigo-700 dark:hover:bg-indigo-800 px-6 py-2">
              <a href="/register">Get Started</a>
            </Button>
            <Button variant="outline" className="border-white bg- text-white hover:bg-white hover:text-indigo-700 dark:border-slate-200 dark:text-slate-200 dark:hover:bg-slate-200 dark:hover:text-indigo-800 px-6 py-2">Learn More</Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
            <img src={logo} alt="Health Logo" className="relative w-40 h-40 mx-auto" />
            <div className="absolute top-8 left-8 flex gap-4">
              <UserIcon className="w-8 h-8 text-white/80" />
              <CalendarIcon className="w-8 h-8 text-white/80" />
            </div>
            <div className="absolute bottom-8 right-8 flex gap-4">
              <ClipboardIcon className="w-8 h-8 text-white/80" />
              <IdentificationIcon className="w-8 h-8 text-white/80" />
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="w-full bg-white dark:bg-slate-900 py-12 px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-slate-900 dark:text-slate-100">Choose Your Role</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
          <Card className="flex-1 flex flex-col items-center p-8 shadow-md hover:shadow-lg transition bg-white dark:bg-slate-800">
            <UserIcon className="w-10 h-10 text-indigo-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">I'm a Patient</h3>
            <p className="text-slate-400 mb-4 text-center">Book appointments and manage your health records</p>
            <Button asChild className="w-full bg-indigo-700 hover:bg-indigo-800 text-white">
              <a href="/login">Book a Doctor</a>
            </Button>
          </Card>
          <Card className="flex-1 flex flex-col items-center p-8 shadow-md hover:shadow-lg transition bg-white dark:bg-slate-800">
            <IdentificationIcon className="w-10 h-10 text-indigo-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">I'm a Doctor</h3>
            <p className="text-slate-400 mb-4 text-center">Manage patients and consultations</p>
            <Button asChild className="w-full bg-indigo-700 hover:bg-indigo-800 text-white">
              <a href="/login">Sign In</a>
            </Button>
          </Card>
          <Card className="flex-1 flex flex-col items-center p-8 shadow-md hover:shadow-lg transition bg-white dark:bg-slate-800">
            <BeakerIcon className="w-10 h-10 text-indigo-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">I'm a Pharmacist</h3>
            <p className="text-slate-400 mb-4 text-center">Handle prescriptions and medication orders</p>
            <Button asChild className="w-full bg-indigo-700 hover:bg-indigo-800 text-white">
              <a href="/login">Manage Orders</a>
            </Button>
          </Card>
        </div>
      </section>

      {/* Key Features */}
      <section className="w-full bg-slate-50 dark:bg-slate-950 py-12 px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-slate-900 dark:text-slate-100">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 flex flex-col gap-2 items-start bg-white dark:bg-slate-800">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            <h4 className="font-semibold">Easy Scheduling</h4>
            <p className="text-slate-400 text-sm">Book appointments with your preferred doctors in just a few clicks</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 items-start bg-white dark:bg-slate-800">
            <ClipboardIcon className="w-7 h-7 text-indigo-600" />
            <h4 className="font-semibold">Prescription Management</h4>
            <p className="text-slate-400 text-sm">Track and manage all your medications in one secure place</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 items-start bg-white dark:bg-slate-800">
            <VideoCameraIcon className="w-7 h-7 text-indigo-600" />
            <h4 className="font-semibold">Telemedicine</h4>
            <p className="text-slate-400 text-sm">Connect with healthcare providers through secure video calls</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 items-start bg-white dark:bg-slate-800">
            <FolderIcon className="w-7 h-7 text-indigo-600" />
            <h4 className="font-semibold">Health Records</h4>
            <p className="text-slate-400 text-sm">Access your complete medical history anytime, anywhere</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 items-start bg-white dark:bg-slate-800">
            <LockClosedIcon className="w-7 h-7 text-indigo-600" />
            <h4 className="font-semibold">Secure & Private</h4>
            <p className="text-slate-400 text-sm">Your health data is protected with enterprise-grade security</p>
          </Card>
          <Card className="p-6 flex flex-col gap-2 items-start bg-white dark:bg-slate-800">
            <DevicePhoneMobileIcon className="w-7 h-7 text-indigo-600" />
            <h4 className="font-semibold">Mobile Ready</h4>
            <p className="text-slate-400 text-sm">Access your health information on any device, anywhere</p>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full bg-[#0f172a] dark:bg-slate-900 py-12 px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-white dark:text-slate-100">What Our Users Say</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-5xl mx-auto">
          <Card className="flex-1 bg-indigo-900 dark:bg-slate-800 text-white dark:text-slate-100 p-6 flex flex-col gap-4 shadow-md">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-indigo-300" />
              <span className="italic">"This platform has revolutionized how I manage my health. Booking appointments has never been easier!"</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah Johnson" className="w-8 h-8 rounded-full" />
              <div>
                <div className="font-semibold">Sarah Johnson</div>
                <div className="text-xs text-indigo-200">Patient</div>
              </div>
            </div>
          </Card>
          <Card className="flex-1 bg-indigo-900 dark:bg-slate-800 text-white dark:text-slate-100 p-6 flex flex-col gap-4 shadow-md">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-indigo-300" />
              <span className="italic">"As a doctor, this system helps me manage my patients more efficiently. The interface is intuitive and reliable."</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Dr. Michael Chen" className="w-8 h-8 rounded-full" />
              <div>
                <div className="font-semibold">Dr. Michael Chen</div>
                <div className="text-xs text-indigo-200">Physician</div>
              </div>
            </div>
          </Card>
          <Card className="flex-1 bg-indigo-900 dark:bg-slate-800 text-white dark:text-slate-100 p-6 flex flex-col gap-4 shadow-md">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-indigo-300" />
              <span className="italic">"The prescription management feature has streamlined our pharmacy operations significantly. Highly recommended!"</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Emily Rodriguez" className="w-8 h-8 rounded-full" />
              <div>
                <div className="font-semibold">Emily Rodriguez</div>
                <div className="text-xs text-indigo-200">Pharmacist</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#0f172a] dark:bg-slate-950 text-slate-300 dark:text-slate-400 py-8 px-4 border-t border-slate-800 dark:border-slate-700 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="font-bold text-white dark:text-slate-100 text-lg mb-2">MedDash</div>
            <div className="text-sm">Your trusted healthcare companion</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-white">For Patients</div>
            <a href="#" className="hover:underline">Book Appointment</a>
            <a href="#" className="hover:underline">Find Doctors</a>
            <a href="#" className="hover:underline">Health Records</a>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-white">For Providers</div>
            <a href="#" className="hover:underline">Doctor Portal</a>
            <a href="#" className="hover:underline">Pharmacy System</a>
            <a href="#" className="hover:underline">Admin Dashboard</a>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-white">Support</div>
            <a href="#" className="hover:underline">Help Center</a>
            <a href="#" className="hover:underline">Contact Us</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 dark:text-slate-600 mt-8">© 2024 MedDash. All rights reserved.</div>
      </footer>
    </div>
  )
}
