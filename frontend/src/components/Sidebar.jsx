import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Bug, PlusCircle, CheckSquare, Users, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = {
    Tester: [
      { name: 'Dashboard', path: '/tester/dashboard', icon: LayoutDashboard },
      { name: 'Submit Bug', path: '/tester/submit', icon: PlusCircle },
      { name: 'My Bugs', path: '/tester/bugs', icon: Bug }
    ],
    Developer: [
      { name: 'Dashboard', path: '/developer/dashboard', icon: LayoutDashboard },
      { name: 'Assigned Bugs', path: '/developer/bugs', icon: CheckSquare }
    ],
    Admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'All Bugs', path: '/admin/bugs', icon: Bug },
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Assignments', path: '/admin/assignments', icon: CheckSquare },
      { name: 'Reports', path: '/admin/reports', icon: FileText },
      { name: 'Projects', path: '/admin/projects', icon: Settings }
    ]
  };

  const currentLinks = links[user.role] || [];

  return (
    <div className="w-64 bg-surface border-r border-slate-700 min-h-screen p-4 flex flex-col gap-2 relative z-10 transition-all">
      <div className="flex items-center gap-3 mb-8 px-2">
        <Bug className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-white">BugFlow AI</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {currentLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-700 pt-4 pb-2">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-primary font-bold overflow-hidden">
             {user.avatar ? <img src={user.avatar} alt="avatar" /> : user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
