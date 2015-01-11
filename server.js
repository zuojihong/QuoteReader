var http = require('http');
var quoteReader = require('./quoteReader');

var port = process.env.port || 8886;
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('QuoteReader Started\n');

    setInterval(quoteReader.fetchStockData, 5000);
}).listen(port);