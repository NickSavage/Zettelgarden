import React from "react";
import { Link } from "react-router-dom";

interface SidebarLinkProps {
  to: string;
  children: React.ReactNode;
}

export function SidebarLink({ to, children }: SidebarLinkProps) {
  return (
    <div>
      <li className="sidebar-nav-item">
        <Link className="sidebar-nav-link" to={to}>
          {children}
        </Link>
      </li>
    </div>
  );
}
