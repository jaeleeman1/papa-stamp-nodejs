var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var request = require('request');

const TAG = '[ADMIN TABLET INFO] ';

/* GET Tablet Main */
router.get('/main', function(req, res, next) {
    var shopId = req.query.shop_id;
    var userId = '9c4e059cb007a6d5065017d8f07133cd';//req.query.user_id;

    logger.debug(TAG, 'Shop ID : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    // Select shop order number
    getConnection(function (err, connection){
        var selectShopDataQuery = 'select SHOP_CURRENT_NUM, DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d") as TODAY from SB_SHOP_PUSH_INFO as SSM where SHOP_ID ='+mysql.escape(shopId);
        connection.query(selectShopDataQuery, function (err, currentShopData) {
            if (err) {
                logger.error(TAG, "DB selectShopOrderNumber error : " + err);
                res.status(400);
                res.send('Select shop order number error');
            }else{
                logger.debug(TAG, 'Select shop order number success : ' + JSON.stringify(currentShopData));
                res.status(200);
                res.render('common/papa-admin',{view:'tablet', url:config.url, shopId:shopId, today:currentShopData[0].TODAY, currentNumberData:currentShopData[0]});
            }
            connection.release();
        });
    });
});

module.exports = router;