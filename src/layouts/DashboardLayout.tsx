
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import { Link } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, Sparkles, Video } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Upload Video",
    href: "/upload-video",
    icon: Upload,
  },
  {
    title: "Transcript Input",
    href: "/transcript-input",
    icon: FileText,
  },
  {
    title: "Thread Generator",
    href: "/thread-generator",
    icon: Sparkles,
  },
];

const DashboardLayout = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen antialiased w-full">
        <Sidebar className="md:w-64 border-r flex-col space-y-2 w-full">
          <div className="flex-1 flex-col justify-between">
            <div className="space-y-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <Link to="/" className="flex items-center font-semibold">
                  <Video className="mr-2 h-6 w-6" />
                  {siteConfig.name}
                </Link>
                <ModeToggle />
              </div>
              <MainNav className="flex flex-col space-y-1" items={navItems} />
            </div>
            <div className="p-4">
              <UserNav user={user} logout={logout} />
            </div>
          </div>
        </Sidebar>
        <div className="flex-1">
          <main className="container relative pb-20">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
