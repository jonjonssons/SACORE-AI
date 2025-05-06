import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#0A0A0A]">
        <AppSidebar />
        <main className="flex-1 relative">
          <div className="sticky top-0 z-10 bg-[#111111]/95 backdrop-blur-md border-b border-[#222222] shadow-sm">
            <div className="flex items-center h-16 px-6">
              {isMobile && (
                <SidebarTrigger className="text-gray-400 hover:text-gray-300" />
              )}
              <h1 className="text-xl font-bold ml-4 bg-gradient-to-r from-black via-gray-700 to-gray-500 text-transparent bg-clip-text">
                SACORE AI
                <span className="text-xs font-normal text-gray-500 ml-2">by SACORE AI</span>
              </h1>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
