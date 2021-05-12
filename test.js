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
  // get the iframes on the page, there should be two
  const mainiFrames = await page.frames()
  // select the second iframe which is the login windor
  const loginFrame = mainiFrames[1]
  // click the div so you can log in with Google!
  await loginFrame.click('text=Log in with Google')
  await sleep(2000)
  // create pages, interact with UI elements, assert values
  await browser.close()
})()
