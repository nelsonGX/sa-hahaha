interface WarningBannerProps {
  warnings: string[];
}

export default function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{
        background: 'rgba(221,91,0,0.06)',
        border: '1px solid rgba(221,91,0,0.2)',
      }}
    >
      <h3
        className="font-semibold mb-2"
        style={{ fontSize: 14, color: '#dd5b00' }}
      >
        畢業預警
      </h3>
      <ul className="flex flex-col gap-1">
        {warnings.map((w, i) => (
          <li key={i} style={{ fontSize: 14, color: '#dd5b00' }}>
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
