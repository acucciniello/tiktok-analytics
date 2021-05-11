const { chromium } = require('playwright');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  const browser = await chromium.launch({headless: false, slowMo: 185});
  const page = await browser.newPage()
  await page.goto('https://tiktok.com')
  await sleep(1000)
  await page.click('.login-wrapper button')
  await sleep(10000)
  await page.click('.jsx-2041920090 div:has-text("Log in with Google")')
  await sleep(2000)
  // create pages, interact with UI elements, assert values
  await browser.close()
})()
