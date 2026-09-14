// Decorative network graphic drawn in the page hero.

export function NetworkGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 250 220" className={className} aria-hidden="true">
      <defs>
        <filter id="network-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g stroke="#4fb8ff" strokeOpacity="0.4" strokeWidth="1">
        <line x1="55" y1="60" x2="132" y2="30" />
        <line x1="132" y1="30" x2="205" y2="78" />
        <line x1="55" y1="60" x2="86" y2="140" />
        <line x1="86" y1="140" x2="168" y2="160" />
        <line x1="168" y1="160" x2="205" y2="78" />
        <line x1="86" y1="140" x2="132" y2="30" />
        <line x1="168" y1="160" x2="146" y2="205" />
        <line x1="55" y1="60" x2="205" y2="78" strokeOpacity="0.18" />
      </g>
      <g filter="url(#network-glow)">
        <circle cx="55" cy="60" r="3.5" fill="#8fe9ff" />
        <circle cx="132" cy="30" r="4.5" fill="#38d6ff" />
        <circle cx="205" cy="78" r="3.5" fill="#6f9bff" />
        <circle cx="86" cy="140" r="5.5" fill="#c8fbff" />
        <circle cx="168" cy="160" r="4" fill="#38d6ff" />
        <circle cx="146" cy="205" r="3" fill="#6f9bff" />
      </g>
    </svg>
  );
}
