var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[COUPON INFO] ";

/* GET home page. */
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get coupon shop main information');

    var userId = req.query.userId;

    logger.debug(TAG, 'User ID : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectCouponList = 'select SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SUC.COUPON_IMG, SUC.COUPON_NAME, SUC.COUPON_PRICE, SUC.EXPIRATION_DT from SB_USER_COUPON as SUC ' +
                'inner join SB_SHOP_INFO as SSI on SUC.SHOP_ID = SSI.SHOP_ID ' +
                'where SUC.MAPPING_YN = "N" and SUC.USER_ID ='+mysql.escape(userId);
        connection.query(selectCouponList, function (err, couponListData) {
            if (err) {
                logger.error(TAG, "DB select coupon shop main error : " + err);
                res.status(400);
                res.send('Select coupon shop main error');
            }else{
                logger.debug(TAG, 'Select coupon shop main success : ' + JSON.stringify(couponListData));
                res.status(200);
                res.render('common/papa-stamp', {view:'coupon', url:config.url, userId:userId, couponListData:couponListData});
            }
            connection.release();
        });
    });
});

//Get Shop List
router.get('/shopList', function (req, res, next) {
    logger.info(TAG, 'Get coupon shop list');

    var userId = req.headers.user_id;
    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;

    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Current Latitude : ' + currentLat);
    logger.debug(TAG, 'Current Longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid headers value');
        res.status(400);
        res.send('Invalid headers error');
    }

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop List API
    getConnection(function (err, connection){
        var selectShopListQuery = 'select SSI.SHOP_LAT, SSI.SHOP_LNG from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_COUPON as SUC on SUC.SHOP_ID = SSI.SHOP_ID ' +
            'where SSI.DEL_YN = "N" and SUC.USER_ID =' +mysql.escape(userId);
        connection.query(selectShopListQuery, function (err, shopListData) {
            if (err) {
                console.error("Select coupon shop list Error : ", err);
                res.status(400);
                res.send('Select coupon shop list error');
            } else {
                logger.debug(TAG, 'Select coupon shop list success : ' + JSON.stringify(shopListData));
                res.status(200);
                res.send({shopListData:shopListData});
            }
        });
    });
});

//Get Shop Data
router.get('/shopData', function(req, res, next) {
    logger.info(TAG, 'Get coupon shop data');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User ID : ' + userId);

    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;

    logger.debug(TAG, 'Current Latitude : ' + currentLat);
    logger.debug(TAG, 'Current Longitude : ' + currentLng);

    if(currentLat == null || currentLat == undefined &&
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectShopDataQuery = 'select SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SSI.SHOP_LAT, SSI.SHOP_LNG, SSI.SHOP_PHONE, SSI.SHOP_ADDR,' +
            'SUC.COUPON_IMG, SUC.COUPON_NAME, SUC.COUPON_PRICE, SUC.EXPIRATION_DT from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_COUPON as SUC on SUC.SHOP_ID = SSI.SHOP_ID ' +
            'where SSI.SHOP_LAT =' + mysql.escape(currentLat)+ ' and SSI.SHOP_LNG =' + mysql.escape(currentLng)  +' and SUC.USER_ID =' +mysql.escape(userId) ;
        console.log(selectShopDataQuery);
        connection.query(selectShopDataQuery, function (err, shopData) {
            if (err) {
                console.error("Select coupon shop data Error : ", err);
                res.status(400);
                res.send('Select coupon shop data error');
            } else {
                logger.debug(TAG, 'Select coupon shop data success : ' + JSON.stringify(shopData));
                res.status(200);
                res.send({shopData: shopData[0], userId: userId});
            }
        });
    });
});

module.exports = router;
