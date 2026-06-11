import { Bell, BriefcaseBusiness, CalendarDays, LogOut, Search, Sparkles, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-berry text-white' : 'text-ink/70 hover:bg-blush hover:text-rosewood'}`;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-blush/60">
      <header className="sticky top-0 z-40 border-b border-rosewood/10 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 font-black tracking-tight text-rosewood">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-berry text-white"><Sparkles size={20} /></span>
            <span className="text-xl">Pro Beauty List</span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/search" className={navClass}><Search className="mr-2 inline" size={16} />Find Pros</NavLink>
            {user?.role === 'client' && <NavLink to="/client" className={navClass}><CalendarDays className="mr-2 inline" size={16} />Client</NavLink>}
            {user?.role === 'professional' && <NavLink to="/professional" className={navClass}><BriefcaseBusiness className="mr-2 inline" size={16} />Professional</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
            {user && <NavLink to="/notifications" className={navClass}><Bell className="mr-2 inline" size={16} />Notifications</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm font-semibold text-ink/70 sm:inline">{user.firstName}</span>
                <button onClick={onLogout} className="secondary-button px-4 py-2"><LogOut size={16} /></button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="secondary-button hidden px-4 py-2 sm:inline-flex">Log in</Link>
                <Link to="/auth/register" className="primary-button px-4 py-2"><UserRound size={16} className="mr-2" />Join</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
