require('dotenv').config()
const { chromium, firefox } = require('playwright');
const fsPromises = require('fs/promises')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + "h:" + minutes + "m:" + seconds + "s" 
}

function convertToDate(secondsSinceUTC) {
  let date = new Date(secondsSinceUTC)
  let year = date.getFullYear()
  let month = (date.getMonth() + 1)
  let day = date.getUTCDate()

  month = (month < 10) ? "0" + month : month;
  day = (day < 10) ? "0" + day : day;
  return `${month}/${day}/${year}`
}


(async () => {
  const browser = await firefox.launchPersistentContext('antonio-firefox', {headless: false, slowMo: 185});
  const page = await browser.newPage()
  await Promise.all([
    page.waitForNavigation(),
    page.goto('https://www.tiktok.com/@investarters?')
  ])  
  
  // click on latest video
  await Promise.all([
    page.waitForNavigation(),
    page.click('.video-card-mask')
  ])
  let allVideoAnalytics = []
  let breakTheLoop = false
  // loop while there is a > on the page 
  while(page.$('.control-icon-arrow-right') !== null && !breakTheLoop) {
    try {
      await page.click('text=View Analytics')
      const finishedParsingAnalytics = new Promise((resolve, reject) => {
      page.on('response', async (response) => {
        if (response.url().includes('https://api.tiktok.com/aweme/v1/data/insighs/?tz_offset=-18000&aid=1233&carrier_region=US')) {
          const json = await response.json()
          let videoAnalytics = {}
          videoAnalytics.uploadDate = convertToDate(json.video_info.create_time * 1000)
          videoAnalytics.views = json.video_info.statistics.play_count
          videoAnalytics.videoLength = (json.video_info.video.duration / 1000.0)
          videoAnalytics.avgWatchTime = (json.video_per_duration.value / 1000.0)
          videoAnalytics.watchFullVidPercentage = (json.finish_rate.value * 100)
          videoAnalytics.likes = json.video_info.statistics.digg_count
          videoAnalytics.comments = json.video_info.statistics.comment_count
          videoAnalytics.shares = json.video_info.statistics.share_count
          videoAnalytics.totalPlayTime = msToTime(json.video_total_duration.value)
          for(let i = 0; i< json.video_page_percent.value.length; i++) {
            if(json.video_page_percent.value[i].key == 'For You') {
              videoAnalytics.fyp = (json.video_page_percent.value[i].value * 100)
            }
            else if(json.video_page_percent.value[i].key == 'Follow') {
              videoAnalytics.followingPercentage = (json.video_page_percent.value[i].value * 100)
            }
            else if(json.video_page_percent.value[i].key == 'Personal Profile') {
              videoAnalytics.personalProfilePercentage = (json.video_page_percent.value[i].value * 100)
            }
          }
          resolve(videoAnalytics)
        }
      })
    })
      try {
        let oneVideosAnalytics = await finishedParsingAnalytics
        page.removeListener('response', async() => {})
        await page.click('.close-btn')
        await page.click('.arrow-right')
        allVideoAnalytics.push(oneVideosAnalytics)
      } catch (e) {
        console.log('could not parse analytics')
        await page.click('.user-username')
        await sleep('10000')
      }
    } catch (err) {
      breakTheLoop = true
      console.log('no view analytics options')
    }
  }

  const allVideoAnalyticsString = JSON.stringify(allVideoAnalytics)
  console.log(allVideoAnalyticsString)
  try {
    const promiseToFile = fsPromises.writeFile('video-analytics.json', allVideoAnalyticsString)
    await promiseToFile
    console.log('its written')
  } catch(e) {
    console.log('nothign was written)')
  }
  

  // click view analytics
  
  await sleep(10000) 
  await browser.close()
})()

// not needed right now
// async function logInWithout2FA(page) {
//   new Promise((resolve, reject) => {
//     await page.click('text=Log in')
//     await sleep(1000)
//     // get the iframes on the page, there should be two
//     const mainiFrames = await page.frames()
//     // select the second iframe which is the login windor
//     const loginFrame = mainiFrames[1]
//     // click the div so you can log in with Google!
//     let [googleLogInPage] = await Promise.all([
//       browser.waitForEvent('page'),
//       loginFrame.click('text=Log in with Google')
//     ])
//     await googleLogInPage.waitForLoadState();
  
//     await googleLogInPage.type('input', process.env.GOOGLE_USER, {delay: 100});
//     await Promise.all([
//       googleLogInPage.waitForNavigation(),
//       googleLogInPage.click("#identifierNext")
//     ])
//     await googleLogInPage.waitForLoadState()
//     console.log(process.env.GOOGLE_PWD)
//     await googleLogInPage.type('input', process.env.GOOGLE_PWD);
//     await sleep(2000)
//     await googleLogInPage.click("#passwordNext");
//     resolve()
//   })
  
// }
