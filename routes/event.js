var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

/* GET home page. */
router.get('/main', function(req, res, next) {

    res.render('papa-event/event', { title: 'Express', url:config.url, userId:'7c28d1c5088f01cda7e4ca654ec88ef8' });
});

//Get Shop Data
router.get('/shopData', function(req, res, next) {
    // logger.info(TAG, 'Get shop data');

    var userId = req.headers.user_id;
    // logger.debug(TAG, 'User ID : ' + userId);

    var currentLat = '37.4892105052';//req.query.current_lat;
    var currentLng = '127.0679616043';//req.query.current_lng;

    // logger.debug(TAG, 'Current Latitude : ' + currentLat);
    // logger.debug(TAG, 'Current Longitude : ' + currentLng);

    if(currentLat == null || currentLat == undefined &&
        currentLng == null || currentLng == undefined) {
        // logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectShopDataQuery = 'select * from SB_SHOP_INFO where SHOP_LAT =' + mysql.escape(currentLat)+ ' and SHOP_LNG =' + mysql.escape(currentLng);
        connection.query(selectShopDataQuery, function (err, shopData) {
            if (err) {
                console.error("Select shop data Error : ", err);
                res.status(400);
                res.send('Select shop data error');
            } else {
                // logger.debug(TAG, 'Select shop data success : ' + JSON.stringify(shopData));
                res.status(200);
                res.send({shopData: shopData[0], userId: userId});
            }
        });
    });
});

module.exports = router;
