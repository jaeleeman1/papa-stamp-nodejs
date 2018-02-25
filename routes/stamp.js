var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var http = require('http');
var path = require('path');

const TAG = "[STAMP INFO] ";

//Setting Socket.io
var app = express();
app.use(express.static(path.join(__dirname, 'public')));

var httpServer =http.createServer(app).listen(8060, function(req,res){
    logger.debug(TAG, 'Socket IO server has been started');
});

var io = require('socket.io').listen(httpServer);
io.sockets.on('connection',function(socket){
    socket.on('shopClient',function(data){
        logger.debug(TAG, 'Socket papa stamp success! : '+data.userData);
        io.sockets.emit(data.userData,'Send message success!');
    })
});

//Get Stamp Shop Page
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get stamp shop information');

    var userId = req.query.userId;
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

    getConnection(function (err, connection){
        var selectStampShopList = 'select SUPI.USER_STAMP, SSI.SHOP_ID, SSI.SHOP_STAMP_IMG, SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ' +
            '( 3959 * acos( cos( radians(' + mysql.escape(currentLat) + ') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians(' + mysql.escape(currentLng) + ') ) + sin( radians(' + mysql.escape(currentLat) + ') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SSI.SHOP_ID = SUPI.SHOP_ID ' +
            'where SUPI.USER_ID = ' + mysql.escape(userId) + ' and SUPI.DEL_YN = "N" ' +
            'having distance < 25 ' +
            'order by distance limit 0, 10';
        connection.query(selectStampShopList, function (err, stampShopListData) {
            if (err) {
                logger.error(TAG, "Select stamp shop list error : " + err);
                res.status(400);
                res.send('Select stamp shop list error');
            }else{
                logger.debug(TAG, 'Select stamp shop list success : ' + JSON.stringify(stampShopListData));
                res.status(200);
                res.render('common/papa-stamp', {view:'stamp', url:config.url, userId:userId, stampShopListData:stampShopListData});
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
            'having distance < 25 ' +
            'order by distance limit 0, 10';
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
                logger.error(TAG, "DB selectStampDate error : " + err);
                res.status(400);
                res.send('Select stamp date error');
            }else {
                var selectAvailableCoupon = 'select count(*) as COUPON_CNT from SB_USER_COUPON ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(userId) +' and USED_YN = "N"';
                connection.query(selectAvailableCoupon, function (err, availableCoupon) {
                    if (err) {
                        logger.error(TAG, "Select available coupon error : " + err);
                        res.status(400);
                        res.send('Select available coupon error');
                    } else {
                        logger.debug(TAG, 'Select available coupon success : ' + JSON.stringify(availableCoupon));
                        res.status(200);
                        res.send({stampDateList: stampDateList, availableCoupon: availableCoupon[0]});
                    }
                });
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

                var deletePushHistory = 'update SB_USER_PUSH_HIS set DEL_YN = "Y" ' +
                    'where SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId);
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

router.post('/update-stamp', function (req, res, next) {
    logger.info(TAG, 'Insert user stamp history');

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

    getConnection(function (err, connection){
        var insertUserPushQuery = 'insert into SB_USER_PUSH_INFO (SHOP_ID, USER_ID, USER_STAMP) ' +
            'value (' + mysql.escape(shopId) + ',' + mysql.escape(userId) + ', 1) ' +
            'on duplicate key update USER_STAMP = USER_STAMP +1, DEL_YN = "N"';
        connection.query(insertUserPushQuery, function (err, userPushData) {
            if (err) {
                logger.error(TAG, "DB insertUserPushQuery error : " + err);
                res.status(400);
                res.send('Insert user push info error');
            } else {
                var selectStampHistoryCount = 'select count(*) as CNT ' +
                    'from SB_USER_PUSH_HIS ' +
                    'where USED_YN = "N" and SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(userId);
                connection.query(selectStampHistoryCount, function (err, stampHistoryCount) {
                    if (err) {
                        logger.error(TAG, "DB selectStampHistoryCount error : " + err);
                        res.status(400);
                        res.send('select user push history count error');
                    }else{
                        if(stampHistoryCount[0].CNT < 10) {
                            var insertStampHistory = 'insert into SB_USER_PUSH_HIS (SHOP_ID, USER_ID) ' +
                                'value (' + mysql.escape(shopId) + ', ' + mysql.escape(userId) + ')';
                            connection.query(insertStampHistory, function (err, row) {
                                if (err) {
                                    logger.error(TAG, "DB insertStampHistory error : " + err);
                                    res.status(400);
                                    res.send('Insert user push history error');
                                } else {
                                    var selectShopData = 'select SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, SSI.SHOP_STAMP_IMG ' +
                                        'from SB_SHOP_INFO as SSI ' +
                                        'where SSI.SHOP_ID = ' + mysql.escape(shopId) +
                                        'limit 1';
                                    connection.query(selectShopData, function (err, shopData) {
                                        if (err) {
                                            logger.error(TAG, "DB select shop data error : " + err);
                                            res.status(400);
                                            res.send('Select shop data error');
                                        } else {
                                            logger.debug(TAG, 'Insert user push history success');

                                            io.sockets.emit(userId, {sendId: shopId, stampCnt:(stampHistoryCount[0].CNT+1), stampData:shopData[0]});
                                            logger.debug(TAG, 'API papa stamp success!');

                                            res.status(200);
                                            res.send({resultData: 'Insert user push history success'});
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
            connection.release();
        });
    });
});

module.exports = router;
