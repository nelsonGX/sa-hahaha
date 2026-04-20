interface NavbarProps {
  studentId: string;
  departmentName: string;
  onReset: () => void;
}

export default function Navbar({ studentId, departmentName, onReset }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <span className="text-[20px]">⛰️</span>
            <span className="font-bold text-[15px] text-black/95 tracking-[-0.25px]">
              岩壁計算機
            </span>
            <span className="hidden sm:inline-flex items-center bg-[#f2f9ff] text-[#097fe8] rounded-full px-2 py-0.5 text-xs font-semibold tracking-[0.125px]">
              Beta
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="font-mono text-xs text-[#615d59]">{studentId}</p>
              <p className="text-xs text-[#615d59]">{departmentName}</p>
            </div>
            <button
              onClick={onReset}
              className="px-3 py-1 border border-black/10 rounded text-[13px] font-medium text-[#615d59] bg-transparent cursor-pointer transition-colors hover:text-black/95 hover:bg-black/[0.04]"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
