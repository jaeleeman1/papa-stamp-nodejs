var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[SHOP INFO] ";

//Get Shop Main Page
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get shop main information');

    var userId = req.query.user_id;
    logger.debug(TAG, 'User id : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid location parameter error');
        res.status(400);
        res.send('Invalid location parameter error');
    }

    getConnection(function (err, connection){
        var selectShopListMainQuery = 'select SSI.SHOP_ID, SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'having distance < 250 ' +
            'order by distance limit 0, 10';
        connection.query(selectShopListMainQuery, function (err, shopListMainData) {
            if (err) {
                logger.error(TAG, "Select shop list main error : " + err);
                res.status(400);
                res.send('Select shop list main error');
            }else{
                logger.debug(TAG, 'Select shop list main success : ' + JSON.stringify(shopListMainData));
                res.status(200);
                res.render('common/papa-stamp', {view:'shop', url:config.url, userId:userId, shopId:'', popupCheck:false, shopListMainData:shopListMainData});
            }
            connection.release();
        });
    });
});

//Get select shop data
router.get('/shopData', function(req, res, next) {
    logger.info(TAG, 'Get shop data');

    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;

    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(currentLat == null || currentLat == undefined &&
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid loaction parameter error');
        res.status(400);
        res.send('Invalid loaction parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectShopDataQuery = 'select * from SB_SHOP_INFO as SSI ' +
            'where SSI.SHOP_LAT =' + mysql.escape(currentLat)+ ' and SSI.SHOP_LNG =' + mysql.escape(currentLng);
        connection.query(selectShopDataQuery, function (err, shopData) {
            if (err) {
                console.error("Select shop data error : ", err);
                res.status(400);
                res.send('Select shop data error');
            } else {
                logger.debug(TAG, 'Select shop data success : ' + JSON.stringify(shopData));
                res.status(200);
                res.send({shopData: shopData[0]});
            }
            connection.release();
        });
    });
});

module.exports = router;
