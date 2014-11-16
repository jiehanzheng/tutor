var express = require('express');
var router = express.Router();
var url = require('url');
var redis = require('redis');
var https = require('https');
var querystring = require('querystring');
var debug = require('debug')('duke_api');


var DUKE_API_CACHE_NS = 'duke_api_cache';
var redisClient = redis.createClient();


router.use('/', function(req, res, next) {
  var parsedUrl = url.parse(req.url, true);
  var pathname = parsedUrl.pathname;
  var query = parsedUrl.query;

  var cacheKey = DUKE_API_CACHE_NS + ':' + JSON.stringify({pathname: pathname, query: query});

  res.set('Access-Control-Allow-Origin', '*');

  redisClient.get(cacheKey, function(err, cachedData) {
    if (!err && cachedData != null) {
      debug('cache hit');
      res.send(cachedData);
    } else {
      debug('cache missed');
      
      query['access_token'] = process.env.DUKE_API_KEY;

      var apiRequest = https.get({
        host: 'streamer.oit.duke.edu',
        port: 443,
        path: pathname + '?' + querystring.stringify(query)
      }, function(apiRes) {
        var allData = "";
        apiRes.on('data', function(data) {
          res.write(data);
          allData += data;
        });

        apiRes.on('end', function() {
          res.end();
          redisClient.set(cacheKey, allData);
        });
      });

      apiRequest.on('error', function() {
        debug('API proxy error');
        res.end("API proxy error");
      });
    }
  });
});

module.exports = router;
