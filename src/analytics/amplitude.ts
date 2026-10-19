import * as amplitude from '@amplitude/analytics-browser'

let ready = false
let initPromise: Promise<void> | null = null

export function initAnalytics(): void {
  const key = import.meta.env.VITE_AMPLITUDE_API_KEY as string | undefined
  if (!key || initPromise) return

  initPromise = (async () => {
    try {
      await amplitude.init(key, undefined, {
        defaultTracking: {
          sessions: true,
          pageViews: false,
          formInteractions: false,
          fileDownloads: false,
        },
        // Send quickly so events show in Amplitude Live Events during QA
        flushIntervalMillis: 1000,
        flushQueueSize: 1,
      }).promise
      ready = true
      if (import.meta.env.DEV) {
        console.info('[amplitude] initialized')
      }
    } catch (err) {
      ready = false
      if (import.meta.env.DEV) {
        console.warn('[amplitude] init failed', err)
      }
    }
  })()
}

export function track(event: string, props?: Record<string, string | number | boolean>): void {
  const run = () => {
    if (!ready) return
    try {
      amplitude.track(event, props)
      void amplitude.flush()
      if (import.meta.env.DEV) {
        console.info('[amplitude] track', event, props ?? {})
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[amplitude] track failed', event, err)
      }
    }
  }

  if (ready) {
    run()
    return
  }
  // Queue after init finishes (app_open often fires in the same tick as init)
  if (initPromise) {
    void initPromise.then(run)
  }
}
