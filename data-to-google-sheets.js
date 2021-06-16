const fs = require('fs');
const fsPromises = require('fs/promises');
const {google} = require('googleapis');
const readlineSync = require('readline-sync');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'


main()

// Load client secrets from a local file.
async function main() {
  let analyticsData = fs.readFileSync('video-analytics.json');
  let descriptions = fs.readFileSync('video-names.json')
  let videoAnalytics = JSON.parse(analyticsData);
  let videoDescriptions = JSON.parse(descriptions)
  try {
    let content = await fsPromises.readFile('credentials.json')
    try {
      let auth = await authorize(JSON.parse(content))
      let rowData = convertAnalyticsToRows(videoAnalytics, videoDescriptions)
      try {
        await listMajors(auth, rowData)
      } catch (LMError) {
        console.log(LMError)
      }
    } catch (authError) {
      return console.log(authError)
    }
  } catch (err) {
    return console.log('Error loading client secret file:', err);
  }
}



/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
 function authorize(credentials) {
   return new Promise(async (resolve, reject) => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
    try {
      const token = await fsPromises.readFile(TOKEN_PATH)
      oAuth2Client.setCredentials(JSON.parse(token))
      resolve(oAuth2Client)
    } catch (tokenError) {
      console.log(tokenError)
      resolve(getNewToken(oAuth2Client))
    }
   })
  }
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
  return new Promise(async (resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    // const rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout,
    // });
    try {
      let code = await readlineSync.question('Enter the code from that page here: ')
      try {
        let token = await oAuth2Client.getToken(code)
        oAuth2Client.setCredentials(token)
        // Store the token to disk for later program executions
        try {
          await fsPromises.writeFile(TOKEN_PATH, JSON.stringify(token))
          console.log('Token stored to', TOKEN_PATH)
          resolve(oAuth2Client)
        } catch (writeFileErr) {
          console.log(writeFileErr)
          reject(writeFileErr)
        }
      } catch (getTokenErr) {
        console.error('Error while trying to retrieve access token', getTokenErr);
        reject(getTokenErr)
      }
    } catch (rlError) {
      reject(rlError)
    }
  })
}  

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth, rowData) {
  return new Promise(async (resolve, reject) => {
    // console.log(auth)
    const sheets = google.sheets({version: 'v4', auth});
    const spreadsheetId = `111y8pNkoY3Pxu224_0jWsnjxM1jF7nTTy6039vkVCPU`
    const valueInputOption = `USER_ENTERED`
    const resource = { data: rowData, valueInputOption }
    try {
      let res = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId, resource
      })
      console.log('cells updated.');
      resolve()
    } catch (spreadsheetFail) {
      console.log('we in the spreadsheet error area')
      console.log(spreadsheetFail)
      reject(spreadsheetFail)
    }
  })
}


function convertAnalyticsToRows (videoAnalytics, videoDescriptions) {
  let rowData = []
  let nameOfSheet = `Antonio's Data`
  for (let i = videoAnalytics.length-1; i > 0; i--) {
    let range = `${nameOfSheet}!A${i+2}:N${i+2}`
    console.log(videoAnalytics[i])
    let values = [videoDescriptions[i],
                  'fill in later',
                  videoAnalytics[i].uploadDate.toString(),
                  videoAnalytics[i].views.toString(),
                  videoAnalytics[i].videoLength.toString(),
                  videoAnalytics[i].avgWatchTime.toString(),
                  videoAnalytics[i].watchFullVidPercentage.toString(),
                  videoAnalytics[i].likes.toString(),
                  videoAnalytics[i].comments.toString(),
                  videoAnalytics[i].shares.toString(),
                  videoAnalytics[i].totalPlayTime.toString(),
                  videoAnalytics[i].followingPercentage.toString(),
                  videoAnalytics[i].fyp.toString(),
                  videoAnalytics[i].personalProfilePercentage.toString()
                ]
                console.log(values)
    let oneRowsData = {range, values: [values]}
    rowData.push(oneRowsData)
  }
  return rowData
}