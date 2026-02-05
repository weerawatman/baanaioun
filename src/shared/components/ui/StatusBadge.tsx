interface StatusBadgeProps {
    label: string;
    color: string;
    size?: 'sm' | 'md';
}

export function StatusBadge({ label, color, size = 'sm' }: StatusBadgeProps) {
    const sizeClasses = size === 'sm'
        ? 'px-2.5 py-0.5 text-xs'
        : 'px-3 py-1 text-sm';

    return (
        <span className={`rounded-full font-medium ${sizeClasses} ${color}`}>
            {label}
        </span>
    );
}
