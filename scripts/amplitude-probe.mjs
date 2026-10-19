import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const amplitudeTraffic = []
const consoleLogs = []

page.on('request', (req) => {
  const url = req.url()
  if (/amplitude\.com/i.test(url)) {
    amplitudeTraffic.push({
      kind: 'request',
      method: req.method(),
      url,
      postData: req.postData()?.slice(0, 800) ?? null,
    })
  }
})

page.on('response', async (res) => {
  const url = res.url()
  if (!/amplitude\.com/i.test(url)) return
  let body = ''
  try {
    body = (await res.text()).slice(0, 400)
  } catch {
    // ignore
  }
  amplitudeTraffic.push({ kind: 'response', status: res.status(), url, body })
})

page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => consoleLogs.push(`[pageerror] ${err.message}`))

await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(3500)

const probe = await page.evaluate(`(async () => {
  const mod = await import('/src/analytics/amplitude.ts')
  mod.initAnalytics()
  mod.track('agent_probe_event', { source: 'playwright' })
  mod.track('app_open', { source: 'playwright_probe' })
  return { tracked: true }
})()`)

await page.waitForTimeout(6000)

const firstButton = page.locator('button').first()
if ((await firstButton.count()) > 0) {
  await firstButton.click().catch(() => {})
  await page.waitForTimeout(2000)
}

console.log(
  JSON.stringify(
    {
      probe,
      amplitudeTraffic,
      consoleLogs: consoleLogs.slice(0, 40),
    },
    null,
    2,
  ),
)

await browser.close()
