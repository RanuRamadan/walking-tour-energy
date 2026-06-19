interface StatCardProps {
  label: string
  value: number | string
  icon: string
  color?: string
  sub?: string
}

export function StatCard({ label, value, icon, color = '#0D5C2F', sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-sm border border-black/5">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {sub && (
          <span className="text-xs font-semibold text-black/40 bg-black/5 px-2 py-1 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      <p className="text-sm font-medium text-black/50">{label}</p>
    </div>
  )
}