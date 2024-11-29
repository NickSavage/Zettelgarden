import React from "react";
import { Routes, Route } from "react-router-dom";

import { BlogMainPage } from "./BlogMainPage";
import { BlogList } from "./BlogList";
import { BlogPostComponent } from "./BlogPost";

import { LandingHeader } from "../landing/LandingHeader";
export function BlogApp() {
  return (
    <div>
      <div className="w-full py-2 mx-auto max-w-screen-xl">
        <LandingHeader />

        <Routes>
          <Route path="/" element={<BlogMainPage />} />
          // <Route path="/blog" element={<BlogList />} />
          <Route path="/:slug" element={<BlogPostComponent />} />
          <Route path="test" element={<div>Test Route Working</div>} />
        </Routes>
      </div>
    </div>
  );
}
