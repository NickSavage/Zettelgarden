import React from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarLinkProps {
  to: string;
  children: React.ReactNode;
}

export function SidebarLink({ to, children }: SidebarLinkProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Conditionally apply 'active' class if the current path matches the link's path
  const linkClassName = `sidebar-nav-link ${currentPath === to ? "active" : ""}`;

  return (
    <div>
      <li className="sidebar-nav-item">
        <Link className={linkClassName} to={to}>
          {children}
        </Link>
      </li>
    </div>
  );
}
