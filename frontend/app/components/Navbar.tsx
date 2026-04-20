interface NavbarProps {
  studentId: string;
  departmentName: string;
  onReset: () => void;
}

export default function Navbar({ studentId, departmentName, onReset }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="text-indigo-400 text-xl">⛰</span>
            <span className="text-white font-bold tracking-tight">岩壁計算機</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-300 font-medium">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500 font-mono">{studentId}</p>
              <p className="text-xs text-slate-400">{departmentName}</p>
            </div>
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-700 hover:bg-white/5 hover:text-white transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
