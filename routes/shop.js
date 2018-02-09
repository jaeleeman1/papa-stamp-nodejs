var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[SHOP INFO] ";

/* GET shop main page. */
router.get('/main/:userId', function(req, res, next) {
    logger.info(TAG, 'Get shop information');

    var userId = '7c28d1c5088f01cda7e4ca654ec88ef8'; //req.params.userId;
    var currentLat = 37.5;//req.query.current_lat;
    var currentLng = 127;//req.query.current_lng;
    logger.debug(TAG, 'User ID : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id error');
        res.status(400);
        res.send('Invalid user id error');
    }

    getConnection(function (err, connection){
        var selectShopList = 'select SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ( 3959 * acos( cos( radians('+currentLat+') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians('+currentLng+') ) + sin( radians('+currentLat+') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'having distance < 25 ' +
            'order by distance limit 0, 10';
        // console.log(selectShopList);
        connection.query(selectShopList, function (err, shopListData) {
            if (err) {
                logger.error(TAG, "DB select shop list error : " + err);
                res.status(400);
                res.send('Select shop list error');
            }else{
                logger.debug(TAG, 'Select shop list success : ' + JSON.stringify(shopListData));
                res.status(200);
                res.render('common/papa-stamp', {view:'shop', url:config.url, userId:userId, shopListData:shopListData});
            }
            connection.release();
        });
    });
});

module.exports = router;
