import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export function Input({
    label,
    error,
    helperText,
    fullWidth = false,
    className = '',
    id,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <div className={`${widthClass}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5"
                >
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <input
                id={inputId}
                className={`
          w-full px-4 py-2.5 
          bg-white dark:bg-warm-800 
          border ${error ? 'border-red-500' : 'border-warm-300 dark:border-warm-700'}
          rounded-xl 
          text-warm-900 dark:text-warm-50
          placeholder-warm-400 dark:placeholder-warm-500
          focus:outline-none focus:ring-2 
          ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'}
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
                {...props}
            />

            {error && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-warm-500 dark:text-warm-400">
                    {helperText}
                </p>
            )}
        </div>
    );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export function TextArea({
    label,
    error,
    helperText,
    fullWidth = false,
    className = '',
    id,
    ...props
}: TextAreaProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <div className={`${widthClass}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5"
                >
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <textarea
                id={inputId}
                className={`
          w-full px-4 py-2.5 
          bg-white dark:bg-warm-800 
          border ${error ? 'border-red-500' : 'border-warm-300 dark:border-warm-700'}
          rounded-xl 
          text-warm-900 dark:text-warm-50
          placeholder-warm-400 dark:placeholder-warm-500
          focus:outline-none focus:ring-2 
          ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'}
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${className}
        `}
                {...props}
            />

            {error && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-warm-500 dark:text-warm-400">
                    {helperText}
                </p>
            )}
        </div>
    );
}
