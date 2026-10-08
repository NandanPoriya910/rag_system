import { useId } from 'react';

// The four-point "sparkle" from the mockups, with the blue→purple gradient.
export default function Logo({ size = 32 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.55" stopColor="#7c6cf5" />
          <stop offset="1" stopColor="#c04ee0" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M12 0C12.8 6.5 17.5 11.2 24 12 17.5 12.8 12.8 17.5 12 24 11.2 17.5 6.5 12.8 0 12 6.5 11.2 11.2 6.5 12 0Z" />
    </svg>
  );
}
