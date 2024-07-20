import React from "react";

interface HeaderProps {
  text: string;
}

export function HeaderTop({ text }: HeaderProps) {
  return <span className="font-bold text-xl">{text}</span>;
}

export function HeaderSection({ text }: HeaderProps) {
  return <span className="font-bold text-l">{text}</span>;
}
