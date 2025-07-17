import { ModeToggle } from './mode-toggle'
import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="p-2 gap-21 flex flex-row justify-evenly bg-[#050a2f] dark:bg-slate-900 text-white sticky top-0">
     <div className='flex flex-row'>
      <img className='w-5 h-5 mr-2 mt-1' src="public/hospital.png" alt="logo" />
     <b>MedDash</b>
     </div>
      <div>
        <nav className="flex flex-row justify-center w-full gap-6">
          <a href="#hero" className="hover:underline text-white dark:text-slate-100">Home</a>
          <a href="#roles" className="hover:underline text-white dark:text-slate-100">Roles</a>
          <a href="#features" className="hover:underline text-white dark:text-slate-100">Features</a>
          <a href="#testimonials" className="hover:underline text-white dark:text-slate-100">Testimonials</a>
          <a href="#footer" className="hover:underline text-white dark:text-slate-100">Contact</a>
        </nav>
      </div>
      <div className='flex items-center'>
        <Button asChild variant={'outline'} className='gap-1 mr-2 bg-slate-500 dark:hover:bg-slate-500'>
          <a href="/login">Login</a>
        </Button>
        <Button asChild variant={'outline'} className='gap-1 mr-2 bg-slate-500 dark:hover:bg-slate-500'>
          <a href="/register">Register</a>
        </Button>
        <ModeToggle />
      </div>
    </header>
  )
}
