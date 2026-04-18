import { NavLink as RouterNavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  LayoutDashboard, Users, LogOut, Shield, ChevronLeft,
  ChevronRight, Dumbbell,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", path: "/admin/users", icon: Users },
];

const AdminLayout = () => {
  const { isAuthenticated, logout, adminEmail } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) {
    navigate("/admin", { replace: true });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#0c0d12]">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-[72px]" : "w-64"
        } flex flex-col border-r border-white/[0.06] bg-[#0f1014] transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen`}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shrink-0">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-sm font-bold text-white font-display tracking-tight block">
                  GymFlow
                </span>
                <span className="text-[10px] text-violet-400 font-medium uppercase tracking-widest">
                  Admin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          <div className={`${collapsed ? "px-0" : "px-2"} mb-3`}>
            {!collapsed && (
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                Navigation
              </span>
            )}
          </div>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/admin/dashboard" && location.pathname === "/admin/dashboard");
            return (
              <RouterNavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-violet-500/10 text-violet-400 border-r-2 border-violet-500"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <item.icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                    isActive ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"
                  }`}
                />
                {!collapsed && <span>{item.title}</span>}
              </RouterNavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          {!collapsed && (
            <div className="px-2 py-1">
              <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3 text-violet-400" />
                <span className="text-[10px] text-violet-400 font-medium">Super Admin</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 ${
              collapsed ? "justify-center" : ""
            } w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0f1014]/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-white">Admin Console</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
