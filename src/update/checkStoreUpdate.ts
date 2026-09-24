import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { APP_BUNDLE_ID, APP_VERSION } from '../version'

const DISMISS_KEY = 'hsk-deck-update-dismissed'

export type StoreUpdateInfo = {
  storeVersion: string
  storeUrl: string
}

type LookupResult = {
  resultCount: number
  results: Array<{
    version?: string
    trackViewUrl?: string
    trackId?: number
  }>
}

/** Compare dotted versions like 1.0 vs 1.1. Returns positive if a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

export async function getInstalledVersion(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo()
      if (info.version) return info.version
    } catch {
      // fall through
    }
  }
  return APP_VERSION
}

export function wasUpdateDismissed(storeVersion: string): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === storeVersion
  } catch {
    return false
  }
}

export function dismissUpdate(storeVersion: string): void {
  try {
    localStorage.setItem(DISMISS_KEY, storeVersion)
  } catch {
    // ignore
  }
}

export async function fetchStoreUpdate(): Promise<StoreUpdateInfo | null> {
  const installed = await getInstalledVersion()
  const url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(APP_BUNDLE_ID)}&t=${Date.now()}`

  const res = await fetch(url)
  if (!res.ok) return null

  const data = (await res.json()) as LookupResult
  const app = data.results[0]
  if (!app?.version) return null

  const storeUrl =
    app.trackViewUrl ??
    (app.trackId ? `https://apps.apple.com/app/id${app.trackId}` : null)
  if (!storeUrl) return null

  if (compareVersions(app.version, installed) <= 0) return null
  if (wasUpdateDismissed(app.version)) return null

  return { storeVersion: app.version, storeUrl }
}
