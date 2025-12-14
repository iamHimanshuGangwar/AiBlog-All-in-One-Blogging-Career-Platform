import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenSquare, 
  List, 
  MessageSquare, 
  Image as ImageIcon,
  Briefcase
} from 'lucide-react';

const Sidebar = () => {

  const menuItems = [
    { path: '/admin', name: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/admin/addblog', name: 'Add Blog', icon: PenSquare, end: true },
    { path: '/admin/listblog', name: 'All Posts', icon: List, end: true },
    { path: '/admin/comment', name: 'Comments', icon: MessageSquare, end: true },
    { path: '/admin/job-applications', name: 'Job Applications', icon: Briefcase, end: true },
    { path: '/admin/post-job', name: 'Post Job', icon: Briefcase, end: true },
    { path: '/admin/image-gen', name: 'AI Studio', icon: ImageIcon, end: true, isNew: true },
  ];

  return (
    <div className="flex flex-col border-r border-gray-200 dark:border-gray-800 min-h-screen bg-white dark:bg-gray-900 pt-6 transition-colors duration-300">
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `
              group relative flex items-center gap-4 py-3.5 px-4 md:px-6 rounded-lg cursor-pointer transition-all duration-200
              ${isActive
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 border-r-4 border-transparent"
              }
            `}
          >
            {/* Icon */}
            <item.icon 
              className={`w-5 h-5 transition-transform duration-200 ${
                item.isNew ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"
              } group-hover:scale-110`} 
            />

            {/* Text */}
            <span className="hidden md:inline-block font-medium text-sm">
              {item.name}
            </span>

            {/* "New" Badge */}
            {item.isNew && (
              <span className="hidden md:flex ml-auto items-center justify-center px-2 py-0.5 text-[10px] font-bold uppercase text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-full shadow-sm animate-pulse">
                New
              </span>
            )}

            {/* Mobile Dot Indicator */}
            {item.isNew && (
              <span className="md:hidden absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
