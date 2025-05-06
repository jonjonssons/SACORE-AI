import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings, 
  Search, 
  Users, 
  PieChart,
  ListFilter,
  Brain,
  FolderOpen
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Lead Search",
    path: "/search",
    icon: Search,
  },
  {
    title: "My Leads",
    path: "/leads",
    icon: Users,
  },
  {
    title: "Lead Criteria",
    path: "/criteria",
    icon: ListFilter,
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: PieChart,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [savedProjects, setSavedProjects] = useState<{id: string; name: string}[]>([]);
  
  // Load saved projects on component mount
  useEffect(() => {
    const projectsFromStorage = localStorage.getItem('savedProjects');
    if (projectsFromStorage) {
      try {
        const projects = JSON.parse(projectsFromStorage);
        setSavedProjects(projects.map((p: any) => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Error parsing saved projects:', error);
      }
    }
  }, []);

  return (
    <Sidebar className="bg-[#111111] border-r border-[#222222]">
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-4 py-3">
          <Brain className="h-6 w-6 text-white" />
          <span className="font-bold text-xl bg-gradient-to-r from-black via-gray-600 to-gray-400 text-transparent bg-clip-text">SACORE AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path} className="text-gray-300 hover:text-white hover:bg-[#1A1A1A]">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {savedProjects.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-gray-400">Saved Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {savedProjects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={`/project/${project.id}`} 
                        className="text-gray-300 hover:text-white hover:bg-[#1A1A1A]"
                      >
                        <FolderOpen className="h-5 w-5" />
                        <span>{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-3 text-xs text-gray-500">
          SACORE AI v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
