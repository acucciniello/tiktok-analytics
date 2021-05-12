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
  const loginIframe = await page.$('iframe')
  const loginPage = await loginIframe.contentFrame()
  await loginPage.click('.')
  await sleep(2000)
  // create pages, interact with UI elements, assert values
  await browser.close()
})()
