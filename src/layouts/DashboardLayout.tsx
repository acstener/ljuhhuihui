
import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";
import { 
  Home, Menu, X, LogOut, Mic
} from "lucide-react";

const DashboardLayout = () => {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const clickHandledRef = useRef(false);
  const prevPathRef = useRef(location.pathname);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  // Track previous path to prevent unnecessary re-renders
  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // Improved NavLink handler with much shorter timeout
  const handleNavLinkClick = useCallback((path: string, e: React.MouseEvent) => {
    // If already on this route, prevent default navigation
    if (location.pathname === path) {
      e.preventDefault();
      return false;
    }
    
    // Simple rate limiting with much shorter timeout (200ms instead of 1000ms)
    if (clickHandledRef.current) {
      e.preventDefault();
      return false;
    }
    
    // Set navigation lock for a very short time - just enough to prevent double-clicks
    clickHandledRef.current = true;
    setTimeout(() => {
      clickHandledRef.current = false;
    }, 200);
    
    // Update our path tracking
    prevPathRef.current = path;
    return true;
  }, [location.pathname]);

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Mic, label: "Studio", path: "/studio" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </Button>

      {/* Sidebar */}
      <aside 
        className={`
          bg-sidebar fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 border-r border-sidebar-border
        `}
      >
        <div className="p-6">
          <div className="help-nugget-logo text-sidebar-foreground text-2xl mb-8">
            Content<span>Factory</span>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                onClick={(e) => handleNavLinkClick(item.path, e)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                  ${isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 px-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
