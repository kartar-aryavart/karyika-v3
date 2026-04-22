export default function PlaceholderPage() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:80, gap:12, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:4 }}>🚧</div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:800, color:'var(--text)' }}>Coming Soon</div>
      <div style={{ fontSize:13, color:'var(--text3)', maxWidth:300, lineHeight:1.6 }}>
        This page is in the build roadmap. Check the blueprint doc for the phase this feature ships in.
      </div>
    </div>
  )
}
