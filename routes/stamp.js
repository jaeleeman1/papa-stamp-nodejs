var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[STAMP INFO] ";

//Get Stamp Shop Page
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get stamp shop information');

    var userId = req.query.user_id;
    var shopId = req.query.shop_id;
    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;
    var webCheck = req.query.web_check;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);
    logger.debug(TAG, 'Web check : ' + userId);

    if(userId == null || userId == undefined ||
        shopId == null || shopId == undefined ||
        currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectStampShopList = 'select SUPI.USER_STAMP, SSI.SHOP_ID, SSI.SHOP_STAMP_IMG, SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SSI.SHOP_ID = SUPI.SHOP_ID ' +
            'where SUPI.USER_ID = ' + mysql.escape(userId) + ' and SUPI.DEL_YN = "N" ' +
            'having distance < 250 ' +
            'order by distance';
        connection.query(selectStampShopList, function (err, stampShopListData) {
            if (err) {
                logger.error(TAG, "Select stamp shop list error : " + err);
                res.status(400);
                res.send('Select stamp shop list error');
            }else{
                logger.debug(TAG, 'Select stamp shop list success : ' + JSON.stringify(stampShopListData));

                res.status(200);
                res.render('common/papa-stamp', {view:'stamp', url:config.url, userId:userId, shopId:shopId, stampShopListData:stampShopListData, webCheck:webCheck});
            }
            connection.release();
        });
    });
});

//Get Stamp Shop Page
router.post('/main', function(req, res, next) {
    logger.info(TAG, 'Get stamp shop information');

    var userId = req.body.user_id;
    var shopId = req.body.shop_id;
    var currentLat = req.body.current_lat;
    var currentLng = req.body.current_lng;
    var webCheck = req.body.web_check;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);
    logger.debug(TAG, 'Web check : ' + userId);

    if(userId == null || userId == undefined ||
        shopId == null || shopId == undefined ||
        currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectStampShopList = 'select SUPI.USER_STAMP, SSI.SHOP_ID, SSI.SHOP_STAMP_IMG, SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SSI.SHOP_ID = SUPI.SHOP_ID ' +
            'where SUPI.USER_ID = ' + mysql.escape(userId) + ' and SUPI.DEL_YN = "N" ' +
            'having distance < 250 ' +
            'order by distance';
        connection.query(selectStampShopList, function (err, stampShopListData) {
            if (err) {
                logger.error(TAG, "Select stamp shop list error : " + err);
                res.status(400);
                res.send('Select stamp shop list error');
            }else{
                logger.debug(TAG, 'Select stamp shop list success : ' + JSON.stringify(stampShopListData));

                res.status(200);
                res.render('common/papa-stamp', {view:'stamp', url:config.url, userId:userId, shopId:shopId, stampShopListData:stampShopListData, webCheck:webCheck});
            }
            connection.release();
        });
    });
});

//Get Shop List
router.get('/shopList', function (req, res, next) {
    logger.info(TAG, 'Get shop list');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User id : ' + userId);

    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id error');
        res.status(400);
        res.send('Invalid user id error');
    }

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid location parameter error');
        res.status(400);
        res.send('Invalid location parameter error');
    }

    //Shop List API
    getConnection(function (err, connection){
        var selectShopListQuery = 'select SUPI.USER_ID, SSI.SHOP_LAT, SSI.SHOP_LNG, SUPI.USER_STAMP, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SUPI.SHOP_ID = SSI.SHOP_ID ' +
            'where SUPI.DEL_YN = "N" and SUPI.USER_ID =' + mysql.escape(userId) + ' ' +
            'having distance < 250 ' +
            'order by distance';
        connection.query(selectShopListQuery, function (err, shopListData) {
            if (err) {
                console.error("Select shop lIst Error : ", err);
                res.status(400);
                res.send('Select shop lIst error');
            } else {
                logger.debug(TAG, 'Select shop lIst success : ' + JSON.stringify(shopListData));
                res.status(200);
                res.send({shopListData:shopListData});
            }
            connection.release();
        });
    });
});

//Get Shop Data
router.get('/shopData', function(req, res, next) {
    logger.info(TAG, 'Get shop data');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User id : ' + userId);

    var currentLat = req.query.current_lat;
    var currentLng = req.query.current_lng;
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id error');
        res.status(400);
        res.send('Invalid user id error');
    }

    if(currentLat == null || currentLat == undefined &&
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid location parameter error');
        res.status(400);
        res.send('Invalid location parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectShopDataQuery = 'select SSI.SHOP_ID, SSI.SHOP_NAME, SSI.SHOP_SUB_NAME, SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, SSI.SHOP_STAMP_IMG, ' +
            'SSI.SHOP_LAT, SSI.SHOP_LNG, SSI.SHOP_PHONE, SSI.SHOP_ADDR, SUPI.USER_STAMP ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SUPI.SHOP_ID = SSI.SHOP_ID ' +
            'where SSI.SHOP_LAT =' + mysql.escape(currentLat)+ ' and SSI.SHOP_LNG =' + mysql.escape(currentLng)  +' and SUPI.USER_ID =' +mysql.escape(userId) ;
        connection.query(selectShopDataQuery, function (err, shopData) {
            if (err) {
                console.error("Select shop data Error : ", err);
                res.status(400);
                res.send('Select shop data error');
            } else {
                logger.debug(TAG, 'Select shop data success : ' + JSON.stringify(shopData));
                res.status(200);
                res.send({shopData: shopData[0], userId: userId});
            }
            connection.release();
        });
    });
});

//Get Select Stamp Date
router.get('/selectStampDate', function(req, res) {
    logger.info(TAG, 'Select stamp date');

    var userId = req.headers.user_id;
    var shopId = req.query.shop_id;

    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Shop ID : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    getConnection(function (err, connection){
        var selectStampPushCount = 'select date_format(SUPH.REG_DT, "%y-%m-%d") as REG_DT ' +
            'from SB_USER_PUSH_HIS as SUPH ' +
            'where SUPH.USED_YN = "N" and SUPH.DEL_YN = "N" and SUPH.SHOP_ID = '+mysql.escape(shopId)+' and SUPH.USER_ID = '+mysql.escape(userId);
        connection.query(selectStampPushCount, function (err, stampDateList) {
            if (err) {
                logger.error(TAG, "Select stamp date error : " + err);
                res.status(400);
                res.send('Select stamp date error');
            }else {
                var selectCheckStamp = 'select USER_STAMP from SB_USER_PUSH_INFO ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(userId) +' and DEL_YN = "N"';
                connection.query(selectCheckStamp, function (err, stampCount) {
                    if (err) {
                        logger.error(TAG, "Select stamp count error : " + err);
                        res.status(400);
                        res.send('Select stamp count error');
                    } else {
                        logger.debug(TAG, 'Select stamp count success : ' + JSON.stringify(stampCount));
                        res.status(200);
                        res.send({stampDateList: stampDateList, stampCount:stampCount[0].USER_STAMP});
                    }
                });
            }
            connection.release();
        });
    });
});

//Get Select Popup Stamp Date
router.get('/selectPopupStampDate', function(req, res) {
    logger.info(TAG, 'Select popup stamp date');

    var userId = req.headers.user_id;
    var shopId = req.query.shop_id;

    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Shop ID : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    getConnection(function (err, connection){
        var selectStampPushCount = 'select date_format(SUPH.REG_DT, "%y-%m-%d") as REG_DT ' +
            'from SB_USER_PUSH_HIS as SUPH ' +
            'where SUPH.USED_YN = "N" and SUPH.DEL_YN = "N" and SUPH.SHOP_ID = '+mysql.escape(shopId)+' and SUPH.USER_ID = '+mysql.escape(userId);
        connection.query(selectStampPushCount, function (err, stampDateList) {
            if (err) {
                logger.error(TAG, "Select stamp date error : " + err);
                res.status(400);
                res.send('Select stamp date error');
            }else {
                var selectShopUserQuery = 'select SUPI.USER_STAMP, SSI.SHOP_FRONT_IMG, SSI.SHOP_STAMP_IMG ' +
                    'from SB_USER_PUSH_INFO as SUPI ' +
                    'inner join SB_SHOP_INFO as SSI on SSI.SHOP_ID = SUPI.SHOP_ID ' +
                    'where SUPI.SHOP_ID = ' + mysql.escape(shopId) + ' and SUPI.USER_ID = ' + mysql.escape(userId) +' and SUPI.DEL_YN = "N"';
                connection.query(selectShopUserQuery, function (err, shopUserData) {
                    if (err) {
                        logger.error(TAG, "Select available coupon error : " + err);
                        res.status(400);
                        res.send('Select available coupon error');
                    } else {
                        logger.debug(TAG, 'Select available coupon success : ' + JSON.stringify(shopUserData));
                        res.status(200);
                        res.send({stampDateList: stampDateList, shopUserData: shopUserData[0]});
                    }
                });
            }
            connection.release();
        });
    });
});

//Put Coupon Data
router.post('/update-stamp-admin', function(req, res, next) {
    logger.info(TAG, 'Put stamp history data');

    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    var stampNumber = req.body.stamp_number;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Stamp Number : ' + stampNumber);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined &&
        stampNumber == null || stampNumber == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    //Coupon Data API
    getConnection(function (err, connection) {
        var selectExistQuery  = 'select count(*) as USER_CHECK, USER_STAMP from SB_USER_PUSH_INFO ' +
            'where SHOP_ID =' + mysql.escape(shopId) + 'and USER_ID = ' + mysql.escape(userId);
        connection.query(selectExistQuery, function (err, userCheckData) {
            if (err) {
                logger.error(TAG, "Select user exist error : " + err);
                res.status(400);
                res.send('Select user exist error');
            } else {
                logger.debug(TAG, 'Select user exist success', userCheckData);

                var arrayValue = 'value ';
                for (var i = 0; i < stampNumber; i++) {
                    if (i != (stampNumber - 1))
                        arrayValue += '(' + mysql.escape(shopId) + ', ' + mysql.escape(userId) + '),';
                    else
                        arrayValue += '(' + mysql.escape(shopId) + ', ' + mysql.escape(userId) + ')';
                }
                var insertStampHistory = 'insert into SB_USER_PUSH_HIS (SHOP_ID, USER_ID) ' + arrayValue;
                connection.query(insertStampHistory, function (err, insertStampHistoryData) {
                    if (err) {
                        logger.error(TAG, "Insert stamp history error : " + err);
                        res.status(400);
                        res.send('Insert stamp history error');
                    } else {
                        var insertUserPushQuery = 'insert into SB_USER_PUSH_INFO (SHOP_ID, USER_ID, USER_STAMP) ' +
                            'value (' + mysql.escape(shopId) + ',' + mysql.escape(userId) + ', ' + stampNumber + ') ' +
                            'on duplicate key update USER_STAMP = USER_STAMP + ' + stampNumber;
                        connection.query(insertUserPushQuery, function (err, userPushData) {
                            if (err) {
                                logger.error(TAG, "Insert user push info error : " + err);
                                res.status(400);
                                res.send('Insert user push info error');
                            } else {
                                logger.debug(TAG, 'Insert user push info success');
                                res.send({result:'success', userCheck:userCheckData[0], stampCnt:userCheckData[0].USER_STAMP});
                            }
                        });
                    }
                });
            }
            connection.release();
        });
    });
});

//Insert Card Data
router.put('/insertCard', function(req, res, next) {
    logger.info(TAG, 'Insert card data');

    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;

    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Shop ID : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Card Data API
    getConnection(function (err, connection) {
        var insertPushInfo = 'insert into SB_USER_PUSH_INFO (USER_ID, SHOP_ID, USER_STAMP) value ' +
            '('+mysql.escape(userId)+','+mysql.escape(shopId)+', 0) on duplicate key update DEL_YN = "N"';
        connection.query(insertPushInfo, function (err, insertPushInfoData) {
            if (err) {
                logger.error(TAG, "DB insertPushInfo error : " + err);
                res.status(400);
                res.send('Insert push info error');
            }else{
                logger.debug(TAG, 'Insert push info success');
                res.send({result: 'success'});
            }
            connection.release();
        });
    });
});

//Put Card Data
router.put('/deleteCard', function(req, res, next) {
    logger.info(TAG, 'Delete card data');

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

    //Card Data API
    getConnection(function (err, connection) {
        var deletePushInfo = 'update SB_USER_PUSH_INFO set USER_STAMP = 0, DEL_YN = "Y" ' +
            'where SHOP_ID = ' + mysql.escape(shopId)+' and USER_ID = ' +mysql.escape(userId);
        connection.query(deletePushInfo, function (err, DeletePushInfoData) {
            if (err) {
                logger.error(TAG, "DB deletePushInfo error : " + err);
                res.status(400);
                res.send('Delete push info error');
            }else{
                logger.debug(TAG, 'Delete push info success');

                var deletePushHistory = 'delete from SB_USER_PUSH_HIS ' +
                    'where SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId) +' and DEL_YN = "N"';
                connection.query(deletePushHistory, function (err, DeletePushHisData) {
                    if (err) {
                        logger.error(TAG, "DB deletePushHis error : " + err);
                        res.status(400);
                        res.send('Delete push history error');
                    }else{
                        logger.debug(TAG, 'Delete push history success');
                        res.send({result: 'success'});
                    }
                });
            }
            connection.release();
        });
    });
});

module.exports = router;
