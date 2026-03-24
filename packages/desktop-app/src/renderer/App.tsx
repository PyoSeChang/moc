export default function App(): JSX.Element {
  return (
    <div className="flex h-full flex-col bg-surface-base text-default">
      {/* Title bar */}
      <div
        className="flex h-9 shrink-0 items-center border-b border-subtle px-4"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-sm font-medium text-secondary">MoC</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Map of Concepts</p>
      </div>
    </div>
  );
}
