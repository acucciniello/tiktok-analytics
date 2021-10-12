# tiktok-analytics
Analytics pulled from Tiktok

## How it Works

There are two scripts that are needed for this to work.
One scraps the data, the other uploads the data.

### pull-analytics.js

This is the file that creates a firefox window.

Your first time using this in a while you must sign in. 

In order to scrape the analytics of someone's account, you must be signed in as them an on their profile.

If both of those conditions are met it should start scraping, until it cannot find the next button.

It seems tiktok automatically removes this to prevent scraping.

So, once the button is not showing any more you will neeed to manually go to the next video after the app hits its internall time out.

This will start the process again.

You can do this as many times as you like, but the deeper you go the worse it gets.

If you are done collecting videos, just let it time out. Once it times out it will automatically write the descriptions to its own file and their analytics to its own file.

### data-to-google-sheets.js

This is the script that will read those files and upload them to google sheets.

In order for this to work, you must have a sheet already and updated the ID in the code.

You can update as many times as you want but it will overwrite what you had on that sheet.

There was a bug with the google library with refreshing the token, so if its not working, delete your token, reauthenticate and then try again.