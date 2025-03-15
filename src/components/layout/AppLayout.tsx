
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function AppLayout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile ? (
        <Sidebar />
      ) : (
        <div className="fixed top-0 left-0 z-30 w-full bg-background/80 backdrop-blur-sm border-b p-3 flex items-center">
          <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh]">
              <div className="px-4 py-2">
                <Sidebar />
              </div>
            </DrawerContent>
          </Drawer>
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/cfe1ecb1-7b60-4bb3-9d51-e7a3719aa0a7.png" 
              alt="Chatzy Logo" 
              className="h-8 w-8 mr-2"
              onError={(e) => {
                console.error("AppLayout logo failed to load", e);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <h1 className="text-lg font-semibold">Chatzy TaskMaster</h1>
          </div>
        </div>
      )}
      <main className={`flex-1 transition-all duration-300 ${isMobile ? 'pl-0 pt-16' : 'pl-16 md:pl-64'}`}>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
