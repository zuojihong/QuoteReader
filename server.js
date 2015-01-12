var http = require('http');
var quoteReader = require('./quoteReader');

var port = process.env.port || 8886;
http.createServer(function (req, res) {
    //res.writeHead(200, { 'Content-Type': 'text/plain' });
    //res.end('QuoteReader Started\n');

    setInterval(quoteReader.fetchStockData, 5000);
    /*
    var newDate = new Date();
    newDate.setHours(9, 0, 0, 0);
    console.log('\nnew date: ' + newDate.toString());
    console.log('\nnew date in milli: ' + newDate.getTime());

    var nDate = new Date();
    nDate.setTime(1421055827000);
    console.log('\nanother date: ' + nDate.toString());
    */
}).listen(port);