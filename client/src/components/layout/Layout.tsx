import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Home, 
  Inbox, 
  Calendar, 
  BookOpen, 
  Users2, 
  ShieldCheck, 
  Scale, 
  Settings,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, switchUser, logout, loading } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRoleChange = (email: string) => {
    switchUser(email);
    if (email === 'sarah.chen@nexora.internal') navigate('/manager');
    else if (email === 'elena.rostova@nexora.internal') navigate('/hr');
    else if (email === 'marcus.wright@nexora.internal') navigate('/admin');
    else navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECF0F1] flex items-center justify-center">
        <div className="bg-white border border-[#BDC3C7] rounded-xl p-5 shadow-xs flex items-center gap-3 text-xs text-[#2C3E50] font-semibold">
          <div className="w-4 h-4 border-2 border-[#2C3E50] border-t-transparent rounded-full animate-spin" />
          <span>Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Concise titles matching the prototype
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return { title: `Good morning, ${user?.fullName?.split(' ')[0] || 'Alex'}`, sub: 'One place for everything you need at work.' };
    if (path.startsWith('/requests')) return { title: 'My Workplace Requests', sub: 'Track every issue, request and escalation.' };
    if (path.startsWith('/leave')) return { title: 'Leave Request', sub: 'Transparent decision history and next steps.' };
    if (path.startsWith('/policies')) return { title: 'Company Policies', sub: 'Instant answers verified from official guidelines.' };
    if (path.startsWith('/advocacy')) return { title: 'Fairness & Advocacy', sub: 'Objective consistency and protected review.' };
    if (path.startsWith('/manager')) return { title: 'Manager Workspace', sub: 'Review requests with the right context.' };
    if (path.startsWith('/hr')) return { title: 'HR / Higher-Level Review', sub: 'Human-controlled review for sensitive decisions.' };
    if (path.startsWith('/admin')) return { title: 'System Administration', sub: 'Platform settings and audit governance.' };
    return { title: 'Workplace Operations', sub: 'Employee-first workplace support.' };
  };

  const pageMeta = getPageTitle();

  return (
    <div className="flex min-h-screen bg-[#ECF0F1] text-[#2C3E50]">
      {/* Clean Fixed Left Sidebar */}
      <aside className="w-60 bg-white border-r border-[#BDC3C7] p-4 flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-4 border-b border-[#BDC3C7]">
          <div className="w-8 h-8 rounded-lg bg-[#2C3E50] text-white flex items-center justify-center font-extrabold text-sm">
            W
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[#2C3E50]">Workplace AI</div>
            <div className="text-[10px] text-[#7F8C8D]">Employee-First Hub</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <Inbox className="w-4 h-4" />
            <span>My Requests</span>
          </NavLink>

          <NavLink
            to="/leave"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <Calendar className="w-4 h-4" />
            <span>Leave</span>
          </NavLink>

          <NavLink
            to="/policies"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <BookOpen className="w-4 h-4" />
            <span>Policies</span>
          </NavLink>

          <NavLink
            to="/advocacy"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <Scale className="w-4 h-4" />
            <span>Advocacy</span>
          </NavLink>

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-[#7F8C8D] tracking-wider">
            Management
          </div>

          <NavLink
            to="/manager"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <Users2 className="w-4 h-4" />
            <span>Manager</span>
          </NavLink>

          <NavLink
            to="/hr"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span>HR / Review</span>
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7]'
                  : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Admin</span>
          </NavLink>
        </nav>

        {/* Profile Card & Logout Button at Left Bottom */}
        <div className="pt-2.5 border-t border-[#BDC3C7] space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-[#ECF0F1] border border-[#BDC3C7] text-[#2C3E50] font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user?.fullName?.split(' ').map((n) => n[0]).join('') || 'AR'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#2C3E50] truncate">{user?.fullName || 'Alex Rivera'}</div>
                <div className="text-[10px] text-[#7F8C8D] truncate capitalize">{user?.role?.toLowerCase() || 'Employee'}</div>
              </div>
            </div>

            {/* Small Theme Toggle directly beside the employee name */}
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                theme === 'dark'
                  ? 'bg-[#2E4053] border-[#455D75]'
                  : 'bg-[#ECF0F1] border-[#BDC3C7]'
              }`}
            >
              <span
                className={`pointer-events-none flex h-3.5 w-3.5 transform items-center justify-center rounded-full shadow-sm transition duration-200 ease-in-out ${
                  theme === 'dark'
                    ? 'translate-x-4 bg-[#131D28]'
                    : 'translate-x-0 bg-white'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="h-2 w-2 text-indigo-300" />
                ) : (
                  <Sun className="h-2 w-2 text-amber-500" />
                )}
              </span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out of Workplace AI"
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7F8C8D] hover:text-[#C83D4B] hover:bg-[#FFF0F1] border border-transparent hover:border-[#FCD3D7] transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Clean Top Header */}
        <header className="h-16 bg-white border-b border-[#BDC3C7] px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-base font-bold text-[#2C3E50] leading-tight">{pageMeta.title}</h1>
            <p className="text-[11px] text-[#7F8C8D] leading-tight">{pageMeta.sub}</p>
          </div>

          {/* Simple View Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7F8C8D]">Role:</span>
            <select
              value={user?.email || 'alex.rivera@nexora.internal'}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-[#ECF0F1] border border-[#BDC3C7] rounded-lg px-2.5 py-1 text-xs text-[#2C3E50] font-semibold focus:outline-none focus:border-[#2C3E50] cursor-pointer"
            >
              <option value="alex.rivera@nexora.internal">Employee View</option>
              <option value="sarah.chen@nexora.internal">Manager View</option>
              <option value="elena.rostova@nexora.internal">HR View</option>
              <option value="marcus.wright@nexora.internal">Admin View</option>
            </select>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-7 max-w-5xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
