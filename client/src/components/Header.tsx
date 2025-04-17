import { useUser } from "@/hooks/use-career-data";
import { LineChart, LogOut, GraduationCap, LayoutDashboard, Waypoints, Award, BadgePlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { data: user, isLoading } = useUser();
  const { logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navigateToCareerRoles = () => {
    setLocation('/roles');
  };

  const navigateToDash = () => {
    setLocation('/');
  };
  
  return (
    <header className="bg-indigo-700 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div>
                <div className="flex-shrink-0 flex items-center">
                  <Waypoints className="text-white h-6 w-6 mr-2" />
                  <span className="font-semibold text-xl text-white">Aetheris</span>
                </div>
              </div>
            </Link>
            {/* <div className="hidden md:ml-8 md:flex space-x-4">
              
              <Link href="/career-roles">
                <div className={`flex items-center text-white py-2 px-3 text-sm font-medium rounded-md ${location === '/career-roles' ? 'bg-indigo-800' : 'hover:bg-indigo-600'}`}>
                  <GraduationCap className="mr-1.5 h-4 w-4" />
                  Career Roles
                </div>
              </Link>
            </div> */}
          </div>
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-indigo-500 animate-pulse"></div>
            ) : (
              <>
                <div className="hidden md:flex items-center">
                  <span className="text-sm font-medium text-white">{user?.fullName}&nbsp;&nbsp;&nbsp;</span>
                  <span className="ml-1 text-xs text-indigo-800 bg-indigo-100 py-0.5 px-2 rounded-full">
                    {user?.title}
                  </span>&nbsp;&nbsp;&nbsp;
                  <span className="ml-1 text-xs text-indigo-800 bg-indigo-100 py-0.5 px-2 rounded-full">
                    {user?.role}
                  </span>
                </div>
                
                {/* <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={navigateToCareerRoles}
                  className="mr-2 text-white hover:bg-indigo-600"
                >
                  <GraduationCap className="mr-1 h-4 w-4" />
                  Career Roles
                </Button>
                 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-indigo-700 font-semibold">
                        {user?.fullName.split(" ").map(name => name[0]).join("")}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={navigateToDash}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={navigateToCareerRoles}>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <span>Roles</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
