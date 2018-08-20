var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[EVENT INFO] ";

//Get Event Shop Page
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get event main information');

    var userId = req.query.user_id;
    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;
    var webCheck = req.query.web_check;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);
    logger.debug(TAG, 'Web check : ' + userId);

    if(userId == null || userId == undefined ||
        currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectEventShopListQuery = 'select SSI.SHOP_ID, SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SSI.SHOP_EVENT_ID, SSI.SHOP_EVENT_COUNT, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'having distance < 5 ' +
            'order by distance limit 0, 10';
        connection.query(selectEventShopListQuery, function (err, shopEventListData) {
            if (err) {
                logger.error(TAG, "Select shop list main error : " + err);
                res.status(400);
                res.send('Select event shop list main error');
            }else{
                logger.debug(TAG, 'Select event shop list main success : ' + JSON.stringify(shopEventListData));
                var returnEventShop = [];
                var returnEventUser = [];

                var selectEventUserQuery = 'select SUPI.SHOP_ID, SUPI.USER_STAMP, SEH.EVENT_ID from SB_USER_PUSH_INFO as SUPI ' +
                    'left join SB_EVENT_HIS as SEH on SUPI.SHOP_ID = SEH.SHOP_ID ' +
                    'where SUPI.USER_ID = '+ mysql.escape(userId);
                connection.query(selectEventUserQuery, function (err, eventUserData) {
                    if (err) {
                        logger.error(TAG, "Select event shop user error : " + err);
                        res.status(400);
                        res.send('Select event shop user error');
                    }else {
                        logger.debug(TAG, 'Select event user data success : ' + JSON.stringify(eventUserData));
                        for(var i=0; i<shopEventListData.length; i++) {
                            if(shopEventListData[i].SHOP_EVENT_COUNT > 0) {
                                returnEventShop.push(shopEventListData[i]);
                                var shopId = shopEventListData[i].SHOP_ID;

                                if(eventUserData.length > 0) {
                                    var containCheck = 0;
                                    for(var j=0; j<eventUserData.length; j++) {
                                        if(shopId == eventUserData[j].SHOP_ID){
                                            returnEventUser.push(eventUserData[j]);
                                            containCheck = 1;
                                            break;
                                        }
                                    }
                                    if(containCheck == 0) {
                                        returnEventUser.push(0);
                                    }
                                }else {
                                    returnEventUser.push(0);
                                }
                            }
                        }
                        res.render('common/papa-stamp', { view: 'event', url:config.url, userId: userId, returnEventShop:returnEventShop, returnEventUser:returnEventUser, shopId:'', webCheck:webCheck});
                    }
                });
            }
            connection.release();
        });
    });
});

//Get Event Shop Page
router.post('/main', function(req, res, next) {
    logger.info(TAG, 'Post event main information');

    var userId = req.body.user_id;
    var currentLat = req.body.current_lat;
    var currentLng = req.body.current_lng;
    var webCheck = req.body.web_check;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);
    logger.debug(TAG, 'Web check : ' + userId);

    if(userId == null || userId == undefined ||
        currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectEventShopListQuery = 'select SSI.SHOP_ID, SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SSI.SHOP_EVENT_ID, SSI.SHOP_EVENT_COUNT, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'having distance < 5 ' +
            'order by distance limit 0, 10';
        connection.query(selectEventShopListQuery, function (err, shopEventListData) {
            if (err) {
                logger.error(TAG, "Select shop list main error : " + err);
                res.status(400);
                res.send('Select event shop list main error');
            }else{
                logger.debug(TAG, 'Select event shop list main success : ' + JSON.stringify(shopEventListData));
                var returnEventShop = [];
                var returnEventUser = [];

                var selectEventUserQuery = 'select SUPI.SHOP_ID, SUPI.USER_STAMP, SEH.EVENT_ID from SB_USER_PUSH_INFO as SUPI ' +
                    'left join SB_EVENT_HIS as SEH on SUPI.SHOP_ID = SEH.SHOP_ID ' +
                    'where SUPI.USER_ID = '+ mysql.escape(userId);
                connection.query(selectEventUserQuery, function (err, eventUserData) {
                    if (err) {
                        logger.error(TAG, "Select event shop user error : " + err);
                        res.status(400);
                        res.send('Select event shop user error');
                    }else {
                        logger.debug(TAG, 'Select event user data success : ' + JSON.stringify(eventUserData));
                        for(var i=0; i<shopEventListData.length; i++) {
                            if(shopEventListData[i].SHOP_EVENT_COUNT > 0) {
                                returnEventShop.push(shopEventListData[i]);
                                var shopId = shopEventListData[i].SHOP_ID;

                                if(eventUserData.length > 0) {
                                    var containCheck = 0;
                                    for(var j=0; j<eventUserData.length; j++) {
                                        if(shopId == eventUserData[j].SHOP_ID){
                                            returnEventUser.push(eventUserData[j]);
                                            containCheck = 1;
                                            break;
                                        }
                                    }
                                    if(containCheck == 0) {
                                        returnEventUser.push(0);
                                    }
                                }else {
                                    returnEventUser.push(0);
                                }
                            }
                        }
                        logger.debug(TAG, "returnEventUser "+ JSON.stringify(returnEventUser));
                        res.render('common/papa-stamp', { view: 'event', url:config.url, userId: userId, returnEventShop:returnEventShop, returnEventUser:returnEventUser, shopId:'', webCheck:webCheck});
                    }
                });
            }
            connection.release();
        });
    });
});

//Get Shop Data
router.get('/shopData', function(req, res, next) {
    logger.info(TAG, 'Get coupon shop data');

    var userId = req.headers.user_id;
    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(userId == null || userId == undefined &&
        currentLat == null || currentLat == undefined &&
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectShopDataQuery = 'select SSI.SHOP_ID, SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SSI.SHOP_LAT, SSI.SHOP_LNG, ' +
            'SSI.SHOP_PHONE, SSI.SHOP_ADDR, SSI.SHOP_EVENT_ID, SSI.SHOP_EVENT_COUNT ' +
            'from SB_SHOP_INFO as SSI ' +
            'where SSI.SHOP_LAT =' + mysql.escape(currentLat)+ ' and SSI.SHOP_LNG =' + mysql.escape(currentLng)  + ' limit 1';
        connection.query(selectShopDataQuery, function (err, shopEventData) {
            if (err) {
                logger.error("Select coupon shop data Error : ", err);
                res.status(400);
                res.send('Select coupon shop data error');
            } else {
                logger.debug(TAG, 'Select coupon shop data success : ' + JSON.stringify(shopEventData));
                var shopId = shopEventData[0].SHOP_ID;
                var selectUserDataQuery = 'select SUPI.SHOP_ID, SUPI.USER_STAMP, SEH.EVENT_ID from SB_USER_PUSH_INFO as SUPI ' +
                    'left join SB_EVENT_HIS as SEH on SUPI.SHOP_ID = SEH.SHOP_ID ' +
                    'where SUPI.USER_ID = '+ mysql.escape(userId) + ' and SUPI.SHOP_ID = '+ mysql.escape(shopId);
                connection.query(selectUserDataQuery, function (err, userEventData) {
                    if (err) {
                        logger.error("Select event exist data Error : ", err);
                        res.status(400);
                        res.send('Select event exist data error');
                    } else {
                        logger.debug(TAG, 'Select event exist data success : ' + JSON.stringify(userEventData));
                        res.status(200);
                        res.send({shopEventData: shopEventData[0], userEventData: userEventData[0], userId: userId});
                    }
                });
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
    var eventId = req.body.event_id;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Shop id : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined &&
        eventId == null || eventId == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    //Coupon Data API
    getConnection(function (err, connection) {
        var insertEventHistoryQuery = 'insert into SB_EVENT_HIS (EVENT_ID, SHOP_ID, USER_ID) ' +
            'values('+ mysql.escape(eventId) + ","+ mysql.escape(shopId) + "," + mysql.escape(userId)+') ' +
            'on duplicate key update DEL_YN="N"';
        connection.query(insertEventHistoryQuery, function (err, insertEventHistory) {
            if (err) {
                logger.error(TAG, "DB insertEventHistory error : " + err);
                res.status(400);
                res.send('Insert event history error');
            }else{
                var updateEventCountQuery = 'update SB_SHOP_INFO set SHOP_EVENT_COUNT = SHOP_EVENT_COUNT-1 ' +
                    'where SHOP_ID = '+ mysql.escape(shopId);
                connection.query(updateEventCountQuery, function (err, updateEventCountData) {
                    if (err) {
                        logger.error(TAG, "DB insertEventHistory error : " + err);
                        res.status(400);
                        res.send('Insert event history error');
                    }else {
                        logger.debug(TAG, 'Insert event history success');
                        var countDay = 'select (select date_format(NOW(), "%Y-%m-%d")) as STARTDAY, (select date_format(DATE_SUB(NOW(), INTERVAL -1 YEAR), "%Y-%m-%d")) as ENDDAY';
                        connection.query(countDay, function (err, countDayData) {
                            if (err) {
                                logger.error(TAG, "DB count day error : " + err);
                                res.status(400);
                                res.send('select count day error');
                            } else {
                                logger.debug(TAG, 'Update coupon mapping success', countDayData);
                                var updateCouponMapping = 'update SB_USER_COUPON set USER_ID = ' + mysql.escape(userId) + ', EVENT_ID = ' + mysql.escape(eventId) + ', MAPPING_YN = "Y", ISSUED_DT = NOW(), EXPIRATION_DT = "' + countDayData[0].STARTDAY + ' ~ ' + countDayData[0].ENDDAY + '" ' +
                                    'where MAPPING_YN = "N" and USED_YN = "N" and SHOP_ID = ' + mysql.escape(shopId) + ' ' +
                                    'order by REG_DT ASC limit 1';
                                connection.query(updateCouponMapping, function (err, UpdateCouponData) {
                                    if (err) {
                                        logger.error(TAG, "DB updateCouponMapping error : " + err);
                                        res.status(400);
                                        res.send('Update coupon mapping error');
                                    } else {
                                        logger.debug(TAG, 'Update coupon mapping success', UpdateCouponData);
                                        res.send({result: 'success'});
                                    }
                                });
                            }
                        });
                    }
                });
            }
            connection.release();
        });
    });
});

module.exports = router;
