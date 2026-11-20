import { useEffect, useState } from 'react'
import { SearchPalette } from './components/SearchPalette'
import { Shell } from './components/Shell'
import { useHashRoute } from './router'
import { StoreProvider } from './store'
import { IncidentDetail } from './views/IncidentDetail'
import { Incidents } from './views/Incidents'
import { Investigations } from './views/Investigations'
import { Landing } from './views/Landing'
import { Overview } from './views/Overview'
import { Settings } from './views/Settings'

function RoutedApp() {
  const route = useHashRoute()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  // The marketing landing page renders without the workspace shell.
  if (route.name === 'landing') return <Landing />

  return (
    <Shell route={route} onOpenSearch={() => setSearchOpen(true)}>
      {route.name === 'overview' && <Overview />}
      {route.name === 'incidents' && <Incidents />}
      {route.name === 'incident' && <IncidentDetail id={route.id} />}
      {route.name === 'investigations' && <Investigations />}
      {route.name === 'settings' && <Settings />}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Shell>
  )
}

function App() {
  return (
    <StoreProvider>
      <RoutedApp />
    </StoreProvider>
  )
}

export default App
