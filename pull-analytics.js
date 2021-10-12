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
  // change this if you want to update the account the browser will open to
  const accountHandle = `investarters`
  // stores my password this way I can stay signed in
  const browser = await firefox.launchPersistentContext('antonio-firefox', {headless: false, slowMo: 185});
  const page = await browser.newPage()
  await Promise.all([
    page.waitForNavigation(),
    page.goto(`https://www.tiktok.com/@${accountHandle}?`)
  ])  
  // Uncomment the line below if you need to log in to a new account
  // await sleep('100000')
  // click on latest video
  await Promise.all([
    page.waitForNavigation(),
    page.click('.video-card-mask')
  ])
  let allVideoAnalytics = []
  let eachVideosDescription = []
  let breakTheLoop = false
  // loop while there is a > on the page 
  // count represents the amount of times we went before tiktok stopped showing the arrow to the next video.
  count = 0
  while(page.$('.control-icon-arrow-right') !== null && !breakTheLoop && count < 3) {
  let videosDescription = await page.textContent('.video-meta-title')
  console.log(videosDescription)
  eachVideosDescription.push(videosDescription)
    try {
      await page.click('text=View Analytics')
      const finishedParsingAnalytics = new Promise((resolve, reject) => {
      page.on('response', async (response) => {
        if (response.url().includes('https://api.tiktok.com/aweme/v1/data/insighs/?tz_offset=-18000&aid=1233&carrier_region=US')) {
          const json = await response.json()
          let videoAnalytics = {}
          if (json.video_info.create_time !== null || json.video_info.create_time !== undefined) {
            videoAnalytics.uploadDate = convertToDate(json.video_info.create_time * 1000)
          }
          videoAnalytics.views = json.video_info.statistics.play_count
          videoAnalytics.videoLength = (json.video_info.video.duration / 1000.0)
          if (json.video_per_duration.value !== null || json.video_per_duration.value !== undefined) {
            videoAnalytics.avgWatchTime = (json.video_per_duration.value / 1000.0)
          } else {
            videoAnalytics.avgWatchTime = 0
          }
          if (json.finish_rate.value !== null || json.finish_rate.value !== undefined) {
            videoAnalytics.watchFullVidPercentage = (json.finish_rate.value * 100)
          } else{
            videoAnalytics.watchFullVidPercentage = 0
          }
          videoAnalytics.likes = json.video_info.statistics.digg_count
          videoAnalytics.comments = json.video_info.statistics.comment_count
          videoAnalytics.shares = json.video_info.statistics.share_count
          if (json.video_total_duration.value !== null || json.video_total_duration.value !== undefined) {
            videoAnalytics.totalPlayTime = msToTime(json.video_total_duration.value)
          } else {
            videoAnalytics.totalPlayTime = `00h:00m:00s`
          }
          if(json.video_page_percent.value) {
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
          } else {
            videoAnalytics.fyp = 0
            videoAnalytics.followingPercentage = 0
            videoAnalytics.personalProfilePercentage = 0
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
        count = count + 1
        await sleep('20000')
      }
    } catch (err) {
      breakTheLoop = true
      console.log('no view analytics options')
    }
  }

  const allVideoAnalyticsString = JSON.stringify(allVideoAnalytics)

  const eachVideosDescriptionString = JSON.stringify(eachVideosDescription)
  console.log(allVideoAnalyticsString)
  try {
    //write the file with analytics
    const promiseToFileForAnalytics = fsPromises.writeFile('video-analytics.json', allVideoAnalyticsString)
    await promiseToFileForAnalytics
    console.log('analytics are written')
    try {
      // write the file with all descriptions
      const promiseToFileForDescriptions = fsPromises.writeFile('video-names.json', eachVideosDescriptionString)
      await promiseToFileForDescriptions
      console.log('descriptions are written')
    } catch(e) {
      console.log('descriptions were not written)')
    }
  } catch(e) {
    console.log('analytics were not written)')
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
