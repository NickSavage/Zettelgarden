import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BlogPostMeta } from "./models";
import { getAllPosts } from "./utils";

export function BlogMainPage() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllPosts()
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="mt-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>

      {isLoading ? (
        <div>Loading posts...</div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <Link to={`/blog/${post.slug}`}>
                <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
                <div className="text-gray-600">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {post.excerpt && (
                  <p className="mt-2 text-gray-600">{post.excerpt}</p>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center text-gray-600">No blog posts found.</div>
      )}
    </main>
  );
}
