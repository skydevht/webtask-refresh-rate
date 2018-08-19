'use latest';
/*
 * Only this file is necessary if you're going to use it as a webtask severless function
 *
 */
const cheerio = require('cheerio'); // html parser
const rp = require('request-promise').defaults({
  transform: function(body) {
    return cheerio.load(body); // here instead of every time in the function
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' // For BUH
  },
  jar: true, // For unibank
});

// Haitian Gourdes is the reference and its value is set to 1
// Just some constants to help identify them, client side (and lighter too)
const ids = {
  haitianGourde: 1,
  usInternational: 2,
  usBRH: 3,
  usBuyBUH: 4,
  usSellBUH: 5,
  usBuyUnibank: 6,
  usSellUnibank: 7,
  usBuyCapital: 12,
  usSellCapital: 13,
  usBuyBNC: 14,
  usSellBNC: 15,
  usBuyBPH: 16,
  usSellBPH: 17,
  usBuySogebank: 8,
  usSellSogebank: 9,
  euroSogebank: 10,
  canadianSogebankDollar: 11,
};

// We do nothing, really
function handleScrapingError(err) {
  console.log('Error:', err);
}

// This function just send the error to the client
function sendError(err, res) {
  res.writeHead(500, { 'Content-Type': 'application/json'});
  res.end(JSON.stringify(err));
}

// Tired of writing those too lines of code so we make it dry
function sendData(data, res) {
  res.writeHead(200, { 'Content-Type': 'application/json'});
  res.end(JSON.stringify(data));
}

// The main function
// @param ctx : An object provided by Webtask api
function refreshRate(ctx, req, res) {
  // In webtask the cron task call the endpoint using POST
  // and anyone else use GET, so it's a quicky way to differentiate the two
  if (req.method === 'GET') {
    // GET request, everyone, that's why the cache
    ctx.storage.get(function(error, data) {
      if (error) sendError(error, res);
      else sendData(data, res);
    })
  } else {
    // POST request, either cron or manual
    // We use promise a lot
    global.Promise.all([
      // So UNIBANK store a cookie with a session id (why?), if it does not find
      // it goes to this link and store one, then redirect back to the main page
      // So we go there first, store the cookie, then ask for the home page
      rp('https://www.unibankhaiti.com/wp-content/themes/unibank/s2.php') // gimme a cookie, you
      .then(function() {
        // now the real thing
        return rp('https://www.unibankhaiti.com/').then(function($) {
          const brhRate = Number($('#right > div > table > tbody > tr:nth-child(2) > td:nth-child(2) > span').text().split(' ')[0]);
          const unibankBuyRate = Number($('#login > div > div > table > tbody > tr:nth-child(2) > td:nth-child(2) > strong').text().split(' ')[0])
          const unibankSellRate = Number($('#login > div > div > table > tbody > tr:nth-child(2) > td:nth-child(3) > strong').text().split(' ')[0])

          return global.Promise.resolve([
            {
              id: ids.usBRH,
              value: brhRate,
            },
            {
              id: ids.haitianGourde,
              value: 1,
            },
            {
              id: ids.usBuyUnibank,
              value: unibankBuyRate,
            },
            {
              id: ids.usSellUnibank,
              value: unibankSellRate,
            },
          ]);
        }, handleScrapingError);
      }, handleScrapingError),
      rp('https://www.sogebank.com/')
      .then(function($) {
        const sogebankBuyRate = Number($('#1494605072863-1c04ec8a-60f0 > div.vc_tta-panel-body > div > div > table > tbody > tr:nth-child(2) > td:nth-child(2)').clone().children().remove().end().text().split(' ')[0])
        const sogebankSellRate = Number($('#1494605072863-1c04ec8a-60f0 > div.vc_tta-panel-body > div > div > table > tbody > tr:nth-child(2) > td:nth-child(3)').clone().children().remove().end().text().split(' ')[0])
        return global.Promise.resolve([
          {
            id: ids.usBuySogebank,
            value: sogebankBuyRate,
          },
          {
            id: ids.usSellSogebank,
            value: sogebankSellRate,
          },
        ]);
      }, handleScrapingError),
      rp('https://www.capitalbankhaiti.biz/')
      .then(function($) {
        const capitalBuyRate = Number($('#RPage > div:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(2)').text())
        const capitalSellRate = Number($('#RPage > div:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(3)').text())
        return global.Promise.resolve([
          {
            id: ids.usBuyCapital,
            value: capitalBuyRate,
          },
          {
            id: ids.usSellCapital,
            value: capitalSellRate,
          },
        ]);
      }, handleScrapingError),
      rp('https://www.bnconline.com/')
      .then(function($) {
        const bncBuyRate = Number($('#bannermodule > div > div.moduletable_taux > table > tbody > tr:nth-child(2) > td:nth-child(2)').text().split(' ')[0])
        const bncSellRate = Number($('#bannermodule > div > div.moduletable_taux > table > tbody > tr:nth-child(2) > td:nth-child(3)').text().split(' ')[0])
        return global.Promise.resolve([
          {
            id: ids.usBuyBNC,
            value: bncBuyRate,
          },
          {
            id: ids.usSellBNC,
            value: bncSellRate,
          },
        ]);
      }, handleScrapingError),
      rp('http://www.bphhaiti.com/bk/')
      .then(function($) {
        const bphBuyRate = Number($('#main > div.footer-special > div:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(2)').text().split(' ')[0])
        const bphSellRate = Number($('#main > div.footer-special > div:nth-child(1) > table > tbody > tr:nth-child(2) > td:nth-child(3)').text().split(' ')[0])
        return global.Promise.resolve([
          {
            id: ids.usBuyBPH,
            value: bphBuyRate,
          },
          {
            id: ids.usSellBPH,
            value: bphSellRate,
          },
        ]);
      }, handleScrapingError),
      rp('http://buh.ht')
      .then(function($) {
        const buhRates = $('#text_icl-8 > div > article > div > div > p').clone().children().remove().end().text().split('\n');
        const buhBuyRate = Number(buhRates[0].split('=')[1].trim().split(' ')[0]);
        const buhSellRate = Number(buhRates[1].split('=')[1].trim().split('\xa0')[0]);
        return global.Promise.resolve([
          {
            id: ids.usBuyBUH,
            value: buhBuyRate,
          },
          {
            id: ids.usSellBUH,
            value: buhSellRate,
          },
        ]);
      }, handleScrapingError)
    ]).then(function(r){
      // so r is an array of the arrays returned by the functions above, so we flatten them and save them in the context
      const rates = r.reduce(function(acc, val) { return acc.concat(val); }, []);
      ctx.storage.set(rates, {force: 1}, function(err) {
        if (err) sendError(err, res);
        else sendData(rates, res);
      });
    });
  }
}

module.exports = refreshRate;
