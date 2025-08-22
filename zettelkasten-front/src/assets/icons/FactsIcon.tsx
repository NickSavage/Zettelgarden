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
        {/* Lightbulb with rays to symbolize "facts / insights" */}
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 18h6m-5 2h4m-2-10a5 5 0 00-5 5c0 1.657.895 3.103 2.236 3.926.124.073.228.171.304.289l.46.707c.18.277.488.443.816.443h2.608c.328 0 .636-.166.816-.443l.46-.707c.076-.118.18-.216.304-.289A4.978 4.978 0 0017 15a5 5 0 00-5-5z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2v2m6.364.636l-1.414 1.414M20 12h-2M17.364 19.364l-1.414-1.414M12 20v2M6.636 19.364l1.414-1.414M4 12h2M6.636 4.636l1.414 1.414"
        />
    </svg>
);
