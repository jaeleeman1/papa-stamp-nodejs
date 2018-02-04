var winston = require('winston');
require('winston-daily-rotate-file');
require('date-utils');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            name:'consoleLog',
            level:'debug',
            colorize:false,
            timestamp: function(){return new Date().toFormat('YYYY-MM-DD HH24:MI:SS')},
            json:false
        }),
        new (winston.transports.File)({
            name: 'errorLog',
            level:'error',
            filename: './logs/err.log',
            maxsize:1000000,
            maxFiles:5,
            timestamp: function(){return new Date().toFormat('YYYY-MM-DD HH24:MI:SS')},
            json:false
        }),
        new (winston.transports.DailyRotateFile)({
            name: 'dailyInfoLog',
            level:'info',
            filename: './logs/daily-',
            timestamp: function(){return new Date().toFormat('YYYY-MM-DD HH24:MI:SS')},
            datePattern : 'yyyyMMdd',
            json:false
        })
    ]
});

module.exports = logger;
