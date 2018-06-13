// var enviromentConfig = require('config');
var config = {};

//Database
//config.host = 'http://localhost:8080';
config.host = 'papastamp.cgbapsrwofhr.ap-northeast-1.rds.amazonaws.com';
config.port = 43306;
config.username = 'ipark';
config.password = 'lee2336^^';
// config.database = 'PAPA_STAMP';
config.database = 'BEST_FOOD';

//Domain
config.url = 'http://52.69.251.194:8050';
//config.url = 'https://papastamp.com';

//Logging
config.loglevel = 'debug';

//Firebase
config.serverKey = 'AAAAHIVXzfk:APA91bHqH863OCv5t6oNHwoYjDp5kmqd-D6GtrrU-QW_ikVCkW2HteP6pnvCT58XhKH4bobu0jOPZyzF2w1DFE1z4ktQ1bVS59iXQi70qqGFyW8g9LNLR8KgksXrm9lzQ1_FVsDsQZt0';

//Firebase Custom Push
config.fcmKey = 'key=AIzaSyASnovAUqeRII4F7npkdPPea7j8oxUUu6A';

//AES Key
config.secrectKey = 'Glu0r6o0GzBZIe0Qsrh2FA==';

//Send SMS
config.smsKey = '52dd6cd8667611e894300cc47a1fcfae';

module.exports = config;
