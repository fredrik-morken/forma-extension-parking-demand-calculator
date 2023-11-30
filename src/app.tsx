export function App() {
  const floating = new URLSearchParams(window.location.search).get('floating')
  return (floating ? <>Floating yo</>:
    <>
      Forma extension yo
    </>
  )
}