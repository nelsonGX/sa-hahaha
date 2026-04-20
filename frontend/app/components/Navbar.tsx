interface NavbarProps {
  studentId: string;
  departmentName: string;
  onReset: () => void;
}

export default function Navbar({ studentId, departmentName, onReset }: NavbarProps) {
  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between" style={{ height: 56 }}>
          <div className="flex items-center gap-2.5">
            <span style={{ fontSize: 20 }}>⛰️</span>
            <span
              className="font-bold"
              style={{ fontSize: 15, color: 'rgba(0,0,0,0.95)', letterSpacing: '-0.25px' }}
            >
              岩壁計算機
            </span>
            <span
              className="hidden sm:inline-flex items-center"
              style={{
                background: 'var(--badge-bg)',
                color: 'var(--badge-text)',
                borderRadius: 9999,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.125px',
              }}
            >
              Beta
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p
                className="font-mono"
                style={{ fontSize: 12, color: 'var(--warm-gray-300)' }}
              >
                {studentId}
              </p>
              <p style={{ fontSize: 12, color: 'var(--warm-gray-500)' }}>{departmentName}</p>
            </div>
            <button
              onClick={onReset}
              style={{
                padding: '4px 12px',
                border: '1px solid var(--border)',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--warm-gray-500)',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(0,0,0,0.95)';
                e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--warm-gray-500)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
