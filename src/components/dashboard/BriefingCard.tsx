export default function BriefingCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-zinc-200 p-6 ${className || ""}`}>
      {children}
    </div>
  );
}
