var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[SHOP INFO] ";

/* GET Shop Main Page. */
router.get('/main/:userId', function(req, res, next) {
    logger.info(TAG, 'Get shop information');

    var userId = '7c28d1c5088f01cda7e4ca654ec88ef8'; //req.params.userId;
    logger.debug(TAG, 'User ID : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id error');
        res.status(400);
        res.send('Invalid user id error');
    }

    getConnection(function (err, connection){
        var selectUserLocationQuery = 'select CURRENT_LAT,CURRENT_LNG from SB_USER_INFO where USER_ID ='+mysql.escape(userId);
        connection.query(selectUserLocationQuery, function (err, currentLocationData) {
            if (err) {
                logger.error(TAG, "DB selectUserLocationQuery error : " + err);
                res.status(400);
                res.send('Select user current location error');
            }else{
                logger.debug(TAG, 'Select user current location success : ' + JSON.stringify(currentLocationData));
                var currentLat = currentLocationData[0].CURRENT_LAT;
                var currentLng = currentLocationData[0].CURRENT_LNG;
                var selectShopList = 'select SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ( 3959 * acos( cos( radians('+currentLat+') ) * cos( radians(SHOP_LAT) ) ' +
                    '* cos( radians(SHOP_LNG) - radians('+currentLng+') ) + sin( radians('+currentLat+') ) ' +
                    '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
                    'from SB_SHOP_INFO as SSI ' +
                    'having distance < 25 ' +
                    'order by distance limit 0, 10';
                connection.query(selectShopList, function (err, shopListData) {
                    if (err) {
                        logger.error(TAG, "DB select shop list error : " + err);
                        res.status(400);
                        res.send('Select shop list error');
                    }else{
                        logger.debug(TAG, 'Select shop list success : ' + JSON.stringify(shopListData));
                        res.status(200);
                        res.render('common/papa-stamp', {view:'shop', url:config.url, userId:userId, shopListData:shopListData, currentLocationData:currentLocationData[0]});
                    }
                });
            }
            connection.release();
        });
    });
});

//Get select shop data
router.get('/shopData', function(req, res, next) {
    // logger.info(TAG, 'Get shop data');
    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;

    logger.debug(TAG, 'Current Latitude : ' + currentLat);
    logger.debug(TAG, 'Current Longitude : ' + currentLng);

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
                logger.debug(TAG, 'Select shop data success : ' + JSON.stringify(shopData));
                res.status(200);
                res.send({shopData: shopData[0]});
            }
        });
    });
});

module.exports = router;
