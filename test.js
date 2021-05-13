
require('dotenv').config()
const { chromium, firefox } = require('playwright');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  const browser = await firefox.launchPersistentContext('antonio-firefox', {headless: false, slowMo: 185});
  const page = await browser.newPage()
  await Promise.all([
    page.waitForNavigation(),
    page.goto('https://tiktok.com')
  ])  

  await browser.close()
})()

// not needed right now
async function logInWithout2FA(page) {
  new Promise((resolve, reject) => {
    await page.click('text=Log in')
    await sleep(1000)
    // get the iframes on the page, there should be two
    const mainiFrames = await page.frames()
    // select the second iframe which is the login windor
    const loginFrame = mainiFrames[1]
    // click the div so you can log in with Google!
    let [googleLogInPage] = await Promise.all([
      browser.waitForEvent('page'),
      loginFrame.click('text=Log in with Google')
    ])
    await googleLogInPage.waitForLoadState();
  
    await googleLogInPage.type('input', process.env.GOOGLE_USER, {delay: 100});
    await Promise.all([
      googleLogInPage.waitForNavigation(),
      googleLogInPage.click("#identifierNext")
    ])
    await googleLogInPage.waitForLoadState()
    console.log(process.env.GOOGLE_PWD)
    await googleLogInPage.type('input', process.env.GOOGLE_PWD);
    await sleep(2000)
    await googleLogInPage.click("#passwordNext");
    resolve()
  })
  
}