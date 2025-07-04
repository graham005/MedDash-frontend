import { ModeToggle } from './mode-toggle'
import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="p-2 gap-21 flex flex-row justify-evenly bg-[#050a2f] dark:bg-slate-900 text-white sticky top-0">
     <div>
      MedDash
     </div>
      <div>
        <nav className="flex flex-row justify-center w-full">
          Navbar
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
