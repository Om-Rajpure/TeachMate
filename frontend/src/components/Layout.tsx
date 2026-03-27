import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Menu, X, User, CheckSquare, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Timetable', icon: Calendar, path: '/timetable' },
    { name: 'Lectures', icon: BookOpen, path: '/lectures' },
    { name: 'Attendance', icon: CheckSquare, path: '/attendance' },
    { name: 'Syllabus', icon: ListChecks, path: '/syllabus' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white h-screen sticky top-0 border-r border-gray-100 p-6 z-20">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">T</div>
        <span className="font-bold text-xl tracking-tight text-text">TeachMate</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              cn(isActive ? "nav-item-active" : "nav-item")
            }
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-gray-50 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
          <User size={20} />
        </div>
        <div className="overflow-hidden">
          <p className="font-medium text-sm text-text truncate">Omkar</p>
          <p className="text-xs text-text-muted truncate">Professor</p>
        </div>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const navItems = [
    { name: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Schedule', icon: Calendar, path: '/timetable' },
    { name: 'Logs', icon: BookOpen, path: '/lectures' },
    { name: 'Attendance', icon: CheckSquare, path: '/attendance' },
    { name: 'Syllabus', icon: ListChecks, path: '/syllabus' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 lg:hidden px-6 py-3 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-text-muted")
          }
        >
          <item.icon size={22} />
          <span className="text-[10px] font-medium">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

const Header = () => {
  const { pathname } = useLocation();
  const pageTitle = pathname === '/dashboard' ? 'Dashboard' 
                  : pathname === '/timetable' ? 'Timetable'
                  : pathname === '/lectures' ? 'Lecture Logs'
                  : pathname === '/attendance' ? 'Attendance'
                  : pathname === '/syllabus' ? 'Syllabus Planner'
                  : 'TeachMate';

  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-md z-10 px-6 py-5 lg:px-10 border-b border-gray-100 lg:border-none flex items-center justify-between">
      <h1 className="text-xl lg:text-2xl font-bold text-text">{pageTitle}</h1>
      <div className="flex items-center gap-4 lg:hidden">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-24 lg:pb-0">
        <Header />
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
