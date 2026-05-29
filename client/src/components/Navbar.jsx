// client/src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN','HR','MANAGER','EMPLOYEE'] },
  { to: '/employees', label: 'Employees', roles: ['ADMIN','HR','MANAGER'] },
  { to: '/leave',     label: 'Leave',     roles: ['ADMIN','HR','MANAGER','EMPLOYEE'] },
  { to: '/email',     label: 'Email',     roles: ['ADMIN','HR'] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="font-bold text-lg tracking-tight">EMS</span>

        <div className="flex items-center gap-1">
          {links
            .filter(l => l.roles.includes(user?.role))
            .map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  pathname === l.to
                    ? 'bg-white text-blue-700 font-semibold'
                    : 'hover:bg-blue-600'
                }`}
              >
                {l.label}
              </Link>
            ))
          }
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm opacity-75">{user?.employee?.name || user?.email}</span>
          <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">{user?.role}</span>
          <button
            onClick={logout}
            className="text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
