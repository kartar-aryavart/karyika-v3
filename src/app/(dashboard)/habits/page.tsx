// Habits placeholder — Phase 2
export default function HabitsPage() {
  return <ComingSoon page="Habits" emoji="🌱" desc="Streaks, heatmaps, XP system — Phase 2" />
}

function ComingSoon({ page, emoji, desc }: { page: string; emoji: string; desc: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12, color: 'var(--text3)' }}>
      <div style={{ fontSize: 48 }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{page}</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{desc}</div>
    </div>
  )
}
