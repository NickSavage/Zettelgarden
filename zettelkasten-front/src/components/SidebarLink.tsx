import React from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarLinkProps {
  to: string;
  children: React.ReactNode;
}

export function SidebarLink({ to, children }: SidebarLinkProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div>
      <li className="relative">
        <Link
          className={`flex items-center justify-between text-gray-800 no-underline p-1 rounded-md transition duration-150 ${
            currentPath === to
              ? "bg-green-100"
              : "hover:bg-green-100" // Hover or active styling
          }`}
          to={to}
        >
          {children}
        </Link>
      </li>
    </div>
  );
}
