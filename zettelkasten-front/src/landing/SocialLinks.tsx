import React from "react";
import { GithubIcon } from "../assets/icons/GithubIcon";
import { TwitterIcon } from "../assets/icons/TwitterIcon";
import { YoutubeIcon } from "../assets/icons/YoutubeIcon";

// RSS Icon component
const RssIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6"
  >
    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
  </svg>
);

export const SocialLinks: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <a 
        href="https://github.com/NickSavage/Zettelgarden"
        className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
        <GithubIcon />
      </a>
      <a 
        href="https://twitter.com/zettelgarden"
        className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
        <TwitterIcon />
      </a>
      <a 
        href="https://www.youtube.com/@zettelgarden"
        className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
        <YoutubeIcon />
      </a>
      <a 
        href="/blog/rss.xml"
        className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
        title="RSS Feed">
        <RssIcon />
      </a>
    </div>
  );
}; 