
# SCHANJ API

## webtask-schanj-refresh-rate
This is the function hosted on Webtask in order to scrape and cache all how much the US dollar's worth in each Haitian bank. 

### Why?
So there are no API to get these data. And they were the ones needed for the SChanj application as they were what really interest the user.
The only way was scrapping each homepage and retrieve the values. As the scraping is too long (>3 seconds) we could not implement
the logic in the android app. What we require is somewhere for the logic to run and some way persistence layer to cache the data.

My first choice was the Firebase platform, but I've reached the project's limit. So I searched for another one and I found [Webtask](https://webtask.io).
Unfortunately, Webtask does not provide a database, but it has a small storage solution (A json file) and an API to interact with it.
That was perfect, As I only needed to store a small set of value. So I wrote the function, uploaded it and created a cron task to run it
hourly as the data was somewhat static.

As for this repo, I've created a sample runner and mocked the Storage API, for the function to run alone. It's a small code, nothing complex
just in order to run the function on localhost. This function was intended for Webtask and is not expected to run well on another platform.

Installation:

`npm install`

To Start the sample:

`node index.js`

To Test:
First issue a POST request to populate the cache using `curl -d "" http:\\localhost:3000` or another program 
and then you can retrieve the value using `curl http:\\localhost:3000`

### SChanj App on Google Play
Click [here](https://play.google.com/store/apps/details?id=tech.skydev.schanj) to download it.
