type DividerProps = {
  label?: string;
  className?: string;
};

export function Divider({ label = "OR", className = "" }: DividerProps) {
  return (
    <div
      className={`relative my-6 flex items-center justify-center ${className}`.trim()}
      role="separator"
      aria-label={label}
    >
      <div className="absolute inset-x-0 h-px bg-border" />
      <span className="relative bg-white/90 px-3 text-[11px] font-semibold tracking-[0.14em] text-slate-400">
        {label}
      </span>
    </div>
  );
}
