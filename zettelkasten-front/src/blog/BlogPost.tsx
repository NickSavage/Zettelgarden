// components/BlogPost.tsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import { BlogPost } from './models';

// Change the type definition to match React Router v6's expectations
type BlogPostParams = {
  slug?: string;
}

export const BlogPostComponent: React.FC = () => {
  // Remove the generic type parameter from useParams
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      try {
        // Implement your fetch logic here
        const response = await fetch(`/api/posts/${slug}`);
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <article className="prose lg:prose-xl mx-auto">
      <h1>{post.title}</h1>
      <div className="text-gray-500">{post.date}</div>
      {post.tags && (
        <div className="flex gap-2 my-4">
          {post.tags.map((tag) => (
            <span key={tag} className="text-sm bg-gray-100 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
      <ReactMarkdown>{post.content}</ReactMarkdown>
    </article>
  );
};
