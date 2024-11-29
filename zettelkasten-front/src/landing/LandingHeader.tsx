import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export function LandingHeader() {
  return (
    <div className="flex items-center w-full">
      <Link to="/" className="mr-2">
        <img src={logo} alt="Company Logo" className="logo rounded-md" />
      </Link>
      <span className="text-2xl">Zettelgarden</span>
      <div className="flex-grow">
        <a href="/#features" className="p-4">
          <span className="text-1xl">Features</span>
        </a>
        <a href="/blog" className="p-4">
          <span className="text-1xl">Blog</span>
        </a>
      </div>
      <div className="flex-shrink">
        <Link to="/app">
          <span className="text-1xl">Login</span>
        </Link>
      </div>
    </div>
  );
}
