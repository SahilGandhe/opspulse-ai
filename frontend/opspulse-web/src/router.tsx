import { useEffect, useState } from 'react'

export type Route =
  | { name: 'landing' }
  | { name: 'overview' }
  | { name: 'incidents' }
  | { name: 'incident'; id: string }
  | { name: 'investigations' }
  | { name: 'settings' }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'incidents' && parts[1]) return { name: 'incident', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'incidents') return { name: 'incidents' }
  if (parts[0] === 'investigations') return { name: 'investigations' }
  if (parts[0] === 'settings') return { name: 'settings' }
  if (parts[0] === 'overview') return { name: 'overview' }
  return { name: 'landing' }
}

export function routePath(route: Route): string {
  switch (route.name) {
    case 'landing': return '/'
    case 'incidents': return '/incidents'
    case 'incident': return `/incidents/${encodeURIComponent(route.id)}`
    case 'investigations': return '/investigations'
    case 'settings': return '/settings'
    default: return '/overview'
  }
}

export function navigate(path: string): void {
  const target = path.startsWith('/') ? `#${path}` : path
  if (window.location.hash === target) return
  window.location.hash = target
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
