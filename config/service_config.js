// var enviromentConfig = require('config');
var config = {};

//Database
config.host = '127.0.0.1';
// config.host = 'papastamp.cgbapsrwofhr.ap-northeast-1.rds.amazonaws.com';
config.port = 43306;
config.username = 'ipark';
config.password = 'lee2336^^';
config.database = 'BEST_FOOD';

//Domain
config.url = 'http://localhost:8080';
// config.url = 'https://whereareevent.com';

//Logging
config.loglevel = 'debug';

//Firebase
config.serverKey = 'AAAAHIVXzfk:APA91bHqH863OCv5t6oNHwoYjDp5kmqd-D6GtrrU-QW_ikVCkW2HteP6pnvCT58XhKH4bobu0jOPZyzF2w1DFE1z4ktQ1bVS59iXQi70qqGFyW8g9LNLR8KgksXrm9lzQ1_FVsDsQZt0';

//AES Key
config.secrectKey = 'Glu0r6o0GzBZIe0Qsrh2FA==';

module.exports = config;
