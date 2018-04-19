var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[COUPON INFO] ";

//Get Coupon Shop Page
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get coupon shop main information');

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
        var selectCouponList = 'select SSI.SHOP_ID, SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SUC.COUPON_IMG, SUC.COUPON_NAME, SUC.COUPON_PRICE, ' +
            'SUC.EXPIRATION_DT, date_format(SUC.USED_DT, "%Y-%m-%d, %h:%i") as USED_DT, SUC.COUPON_NUMBER, SUC.USED_YN, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            ' from SB_USER_COUPON as SUC ' +
            'inner join SB_SHOP_INFO as SSI on SUC.SHOP_ID = SSI.SHOP_ID ' +
            'where SUC.MAPPING_YN = "Y" and SUC.DEL_YN="N" and SUC.USER_ID = ' + mysql.escape(userId) + ' ' +
            'having distance < 25 ' +
            'order by distance limit 0, 10';
        connection.query(selectCouponList, function (err, couponListData) {
            if (err) {
                logger.error(TAG, "DB select coupon shop main error : " + err);
                res.status(400);
                res.send('Select coupon shop main error');
            }else{
                logger.debug(TAG, 'Select coupon shop main success : ' + JSON.stringify(couponListData));
                res.status(200);
                res.render('common/papa-stamp', {view:'coupon', url:config.url, userId:userId, shopId:'', couponNum:'', popupCheck:false, couponListData:couponListData});
            }
            connection.release();
        });
    });
});

//Get Shop List
router.get('/shopList', function (req, res, next) {
    logger.info(TAG, 'Get coupon shop list');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User id : ' + userId);

    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid location parameter error');
        res.status(400);
        res.send('Invalid location parameter error');
    }

    //Shop List API
    getConnection(function (err, connection){
        var selectShopListQuery = 'select SSI.SHOP_LAT, SSI.SHOP_LNG ,' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_COUPON as SUC on SUC.SHOP_ID = SSI.SHOP_ID ' +
            'where SSI.DEL_YN = "N" and SUC.USER_ID =' + mysql.escape(userId) + ' ' +
            'having distance < 25 ' +
            'order by distance limit 0, 10';
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
            connection.release();
        });
    });
});

//Get Shop Data
router.get('/shopData', function(req, res, next) {
    logger.info(TAG, 'Get coupon shop data');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User id : ' + userId);

    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid location parameter error');
        res.status(400);
        res.send('Invalid location parameter error');
    }


    //Shop Data API
    getConnection(function (err, connection) {
        var selectShopDataQuery = 'select SSI.SHOP_ID, SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SSI.SHOP_LAT, SSI.SHOP_LNG, SSI.SHOP_PHONE, SSI.SHOP_ADDR,' +
            'SUC.COUPON_IMG, SUC.COUPON_NAME, SUC.COUPON_PRICE, SUC.EXPIRATION_DT, ' +
            'SUC.COUPON_NUMBER, SUC.USED_YN, date_format(SUC.USED_DT, "%Y-%m-%d, %h:%i") as USED_DT ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_COUPON as SUC on SUC.SHOP_ID = SSI.SHOP_ID ' +
            'where SSI.SHOP_LAT =' + mysql.escape(currentLat)+ ' and SSI.SHOP_LNG =' + mysql.escape(currentLng)  +' and SUC.USER_ID =' + mysql.escape(userId) + ' ' +
            'and SUC.DEL_YN = "N"';
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
            connection.release();
        });
    });
});

//Put Coupon Data
router.put('/couponData', function(req, res, next) {
    logger.info(TAG, 'Get coupon shop data');

    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Shop id : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    //Coupon Data API
    getConnection(function (err, connection) {
        var updatePushHistory = 'update SB_USER_PUSH_HIS set USED_YN = "Y" ' +
            'where  SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(userId) + ' and USED_YN = "N" and DEL_YN = "N" ' +
            'order by REG_DT DESC limit 10';
        connection.query(updatePushHistory, function (err, UpdateHistoryData) {
            if (err) {
                logger.error(TAG, "DB updatePushHistory error : " + err);
                res.status(400);
                res.send('Update push history error');
            }else{
                logger.debug(TAG, 'Update push history success');

                var updateCouponMapping = 'update SB_USER_COUPON SET USER_ID = ' + mysql.escape(userId) + ', MAPPING_YN = "Y"' +
                    'where MAPPING_YN = "N" and USED_YN = "N" and SHOP_ID = ' + mysql.escape(shopId) + ' ' +
                    'order by REG_DT ASC limit 1';
                connection.query(updateCouponMapping, function (err, UpdateCouponData) {
                    if (err) {
                        logger.error(TAG, "DB updateCouponMapping error : " + err);
                        res.status(400);
                        res.send('Update coupon mapping error');
                    }else{
                        logger.debug(TAG, 'Update coupon mapping success',  UpdateCouponData);
                        var selectShopData = 'select (select date_format(NOW(), "%y-%m-%d")) as TODAY_DT, (select date_format(NOW(), "%Y-%m-%d %h:%i:%s")) as VISIT_DATE, ' +
                            'SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, SSI.SHOP_STAMP_IMG ' +
                            'from SB_SHOP_INFO as SSI ' +
                            'where SSI.SHOP_ID = ' + mysql.escape(shopId) +
                            'limit 1';
                        connection.query(selectShopData, function (err, shopData) {
                            if (err) {
                                logger.error(TAG, "DB select shop data error : " + err);
                                res.status(400);
                                res.send('Select shop data error');
                            } else {
                                logger.debug(TAG, 'Select shop info success',  shopData);
                                res.send({shopData:shopData[0]});
                            }
                        });
                    }
                });
            }
            connection.release();
        });
    });
});

//Put Use Card Data
router.put('/useCoupon', function(req, res, next) {
    logger.info(TAG, 'Update use coupon data');

    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    var couponNumber = req.body.coupon_number;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Coupon number : ' + couponNumber);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    if(couponNumber == null || couponNumber == undefined) {
        logger.debug(TAG, 'Invalid coupon number parameter error');
        res.status(400);
        res.send('Invalid coupon number parameter error');
    }

    //Use Coupon Data API
    getConnection(function (err, connection) {
        var useCouponNumber = 'update SB_USER_COUPON set USED_YN = "Y" ' +
            'where SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId)+' and MAPPING_YN = "Y" and COUPON_NUMBER = '+mysql.escape(couponNumber);
        connection.query(useCouponNumber, function (err, useCouponData) {
            if (err) {
                logger.error(TAG, "DB useCoupon error : " + err);
                res.status(400);
                res.send('Update use coupon error');
            }else{
                var selectCouponData = 'select (select date_format(NOW(), "%Y-%m-%d %h:%i:%s")) as VISIT_DATE ' +
                    'from SB_USER_COUPON as SUC ' +
                    'where SUC.SHOP_ID = ' + mysql.escape(shopId) + ' ' +
                    'limit 1';
                connection.query(selectCouponData, function (err, couponDateData) {
                    if (err) {
                        logger.error(TAG, "DB useCoupon error : " + err);
                        res.status(400);
                        res.send('Update use coupon error');
                    } else {
                        logger.debug(TAG, 'Update use coupon success', couponDateData);
                        res.send({shopId: shopId, couponNumber: couponNumber, viewDate:couponDateData[0].VISIT_DATE});
                    }
                });
            }
            connection.release();
        });
    });
});

//Put Delete Card Data
router.put('/deleteCoupon', function(req, res, next) {
    logger.info(TAG, 'Update delete coupon data');

    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    var couponNumber = req.body.coupon_number;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Coupon number : ' + couponNumber);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    if(couponNumber == null || couponNumber == undefined) {
        logger.debug(TAG, 'Invalid coupon number parameter error');
        res.status(400);
        res.send('Invalid coupon number parameter error');
    }

    //Delete Coupon Data API
    getConnection(function (err, connection) {
        var useCouponNumber = 'update SB_USER_COUPON set DEL_YN = "Y" ' +
            'where SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId)+' and COUPON_NUMBER = '+mysql.escape(couponNumber);
        connection.query(useCouponNumber, function (err, DeleteCouponData) {
            if (err) {
                logger.error(TAG, "DB deleteCoupon error : " + err);
                res.status(400);
                res.send('Update delete coupon error');
            }else{
                logger.debug(TAG, 'Update delete coupon success');
                res.send({result: 'success'});
            }
            connection.release();
        });
    });
});

module.exports = router;
