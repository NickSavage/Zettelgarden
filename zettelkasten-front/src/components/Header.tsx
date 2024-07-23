import React from "react";

interface HeaderProps {
  text: string;
  className?: string;
}

export function HeaderTop({ text, className }: HeaderProps) {
  return <span className={`font-bold text-xl ${className || ""}`}>{text}</span>;
}

export function HeaderSection({ text, className }: HeaderProps) {
  return <span className={`font-bold text-l ${className || ""}`}>{text}</span>;
}

export function HeaderSubSection({ text, className }: HeaderProps) {
  return (
    <div>
      <span className={`font-bold ${className || ""}`}>{text}</span>
      <br />
    </div>
  );
}
