import React from "react";
import { Routes, Route } from "react-router-dom";

import { BlogMainPage } from "./BlogMainPage";
import { BlogList } from "./BlogList";
import { BlogPostComponent } from "./BlogPost";

export function BlogApp() {
  return (
    <Routes>
      <Route path="/" element={<BlogMainPage />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPostComponent />} />
    </Routes>
  );
}
