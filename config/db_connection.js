var mysql = require('mysql');
var config = require('../config/service_config');
var logger = require('../config/logger');

const TAG = "[DATABASE CONNECTION] ";

var pool = mysql.createPool( {
    host : config.host,
    port : config.port,
    user : config.username,
    password : config.password,
    database : config.database,
    connectionLimit: 100,
    waitForConnections: false
});

var getConnection = function (cb) {
    pool.getConnection(function (err, connection) {
        logger.info(TAG, ' Database Connection Pool');
        if(err) {
            logger.error(TAG, "Database connection pool error : " + err);
            cb(err, connection);
        }else {
            logger.debug(TAG, 'Database connection pool success');
            cb(null, connection);
        }
    });
};
module.exports = getConnection;
