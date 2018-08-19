const http = require('http');
const refreshRate = require('./refreshRate');

// Mocking the context object and its child storage

const Storage = function() {
  const setData = (data, options, callback) => {
    this.data = data;
    callback(null);
  }

  const getData = (callback) => {
    callback(null, this.data);
  }

  this.set = setData;
  this.get = getData;
}

const context = {
  storage: new Storage(),
};

// Now set a server real quick
const port = 3000;
const server = http.createServer((req, res) => refreshRate(context, req, res));

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
})


