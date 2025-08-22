import React from "react";

export const FactsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className ?? "h-5 w-5"}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2l4-4m1-4a9 9 0 11-18 0a9 9 0 0118 0z"
        />
    </svg>
);
