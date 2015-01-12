var http = require('http');
var mongoose = require('mongoose');

var buffer = '';

var options = {
    host : 'hq.sinajs.cn',
    port : 80,
    path : '/list=sh000001',
    method : 'GET'
};

var dbName = 'stock_db';
var addr = process.env.MONGO_PORT_27017_TCP_ADDR || 'silverreef.chinacloudapp.cn';
var uri = 'mongodb://' + addr + ':27017/' + dbName;
console.info('mongodb uri: ' + uri);

mongoose.connect(uri, function(err) {
    console.info('connection status: ' + (err ? err.message : 'ok'));    
});

var db = mongoose.connection;
db.on('error', function(err) {
    console.error('failed to connect to mongo db: ' + err.message);    
});
db.once('open', function() {
    console.info('succeed to connect to mongo db');    
});

var Schema = mongoose.Schema;
var QuoteSchema = new Schema({
    code: String,
    time: Number,
    price: Number    
});

exports.fetchStockData = function() {
    var quoteReq = http.get(options, function(quoteRes) {
        console.log('res statusCode: ' + quoteRes.statusCode);
        var quoteData = null;
        quoteRes.on('data', function(chunk) { 
            buffer += chunk.toString(); 
        });
        quoteRes.on('end', function() { 
            quoteData = extractData(); 
            buffer = '';
            if (quoteData != null) {
                storeData(quoteData.code, quoteData.price, quoteData.time);
            } else {
                console.error("failed to fetch data from sina: quoteData is null");
            }
        });
        
    });
    quoteReq.on('error', function(err) {
        console.error('request to fetch data failed' + err.message);
    });
    quoteReq.end();
}

function extractData() {
    console.log('extractData: ' + buffer);
    var quoteStr = buffer.substring(buffer.indexOf('\"') + 1, buffer.lastIndexOf('\"'));
    var paramArr = quoteStr.split(',');
    var curPrice = paramArr[3];
    var dateArr = paramArr[30].split('-');
    var timeArr = paramArr[31].split(':');
    var date = new Date(parseInt(dateArr[0]), parseInt(dateArr[1])-1, parseInt(dateArr[2]), 
        parseInt(timeArr[0]), parseInt(timeArr[1]), parseInt(timeArr[2]));
    date.setTime(date.getTime() + getUtcDiff());
    console.log('price=' + curPrice + ', date=' + date.toString());
    
    return {code: 'sh000001', price: curPrice, time: date.getTime()};
}

function getUtcDiff() {
    var d = new Date();
    return (-8) * 3600000;
}

function storeData(code, price, time) {
    console.log('\nstoreData: code=' + code + ', price=' + price + ', date=' + time);
    var model = mongoose.model('Quote', QuoteSchema, 'stocks');

    var quoteExisted = model
    .find({code : code})
    .where('time').equals(time)
    .exec(function(err, quotes) {
        var quoteExisted = false;

        if (err) {
            console.error("failed to query data from mongodb: " + err.message);
        }

        if (quotes != null && quotes.length > 0) {
            quoteExisted = true;
            console.log('quote already existed. Wont insert data');
        }

        if (quoteExisted == false) {
            console.log('try to insert new quote to mongodb');
            var quote = new model({code: code, time: time, price: price});
            quote.save(function(err) {
                if (err) console.error(err);
                else console.log('data inserted to mongodb');
            });
        }
        else {
            console.log('Quote data not inserted: quote at time ' + time + ' already existed in db');
        }
    });
}
