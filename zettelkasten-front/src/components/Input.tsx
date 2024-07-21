import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  className = "",
  ...props
}) => {
  const baseInputClasses =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
  const inputClasses = error
    ? `${baseInputClasses} border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500`
    : `${baseInputClasses} border-gray-300 focus:border-blue-500`;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={props.id}
          className="block mb-2 font-bold text-gray-700"
        >
          {label}
        </label>
      )}
      <input className={`${inputClasses} ${className}`} {...props} />
      {helpText && <p className="mt-2 text-sm text-gray-500">{helpText}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
