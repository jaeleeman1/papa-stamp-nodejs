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

/* GET stamp page. */
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get my shop information');

    var userId = req.query.userId;
    var currentLat = '37.650804099999995';//req.body.latitude;
    var currentLng = '126.88645269999999';//req.body.longitude;
    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Current Latitude : ' + currentLat);
    logger.debug(TAG, 'Current Longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id error');
        res.status(400);
        res.send('Invalid user id error');
    }

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectShopList = 'select SUPI.USER_STAMP, SSI.SHOP_ID, SSI.SHOP_STAMP_IMG, SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ' +
            '( 3959 * acos( cos( radians('+currentLat+') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians('+currentLng+') ) + sin( radians('+currentLat+') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SSI.SHOP_ID = SUPI.SHOP_ID ' +
            'where SUPI.USER_ID = "'+ userId + '"' +
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
                res.render('common/papa-stamp', {view:'stamp', url:config.url, userId:userId, shopListData:shopListData});
            }
            connection.release();
        });
    });
});

//Get Shop List
router.get('/shopList', function (req, res, next) {
    logger.info(TAG, 'Get shop list');

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
        var selectShopListQuery = 'select SUPI.USER_ID, SSI.SHOP_LAT, SSI.SHOP_LNG, SUPI.USER_STAMP from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SUPI.SHOP_ID = SSI.SHOP_ID ' +
            'where SSI.DEL_YN = "N" and SUPI.USER_ID =' +mysql.escape(userId);
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
        });
    });
});

//Get Shop Data
router.get('/shopData', function(req, res, next) {
    logger.info(TAG, 'Get shop data');

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
        var selectShopDataQuery = 'select SSI.*, SUPI.USER_STAMP from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SUPI.SHOP_ID = SSI.SHOP_ID ' +
            'where SHOP_LAT =' + mysql.escape(currentLat)+ ' and SHOP_LNG =' + mysql.escape(currentLng)  +' and SUPI.USER_ID =' +mysql.escape(userId) ;
        console.log(selectShopDataQuery);
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
        });
    });
});

//Get Select Stamp Date
router.get('/selectStampDate', function(req, res) {
    logger.info(TAG, 'Select user stamp date');
    var userId = req.headers.user_id;
    var shopId = req.query.shop_id;

    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Shop ID : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectStampPushCount = 'select date_format(REG_DT, "%Y-%m-%d") as REG_DT from SB_USER_PUSH_HIS where USED_YN = "N" and SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId);
        connection.query(selectStampPushCount, function (err, stampDate) {
            if (err) {
                logger.error(TAG, "DB selectStampDate error : " + err);
                res.status(400);
                res.send('Select stamp date error');
            }else{
                logger.debug(TAG, 'Select stamp date success : ' + JSON.stringify(stampDate));
                res.status(200);
                res.send({stampDate:stampDate});
            }
            connection.release();
        });
    });
});

router.post('/update-stamp', function (req, res, next) {
    logger.info(TAG, 'Insert user stamp history');
    var userId = '7c28d1c5088f01cda7e4ca654ec88ef8';//req.headers.user_id;
    var shopId = 'SB-SHOP-00001';//req.body.shop_id;

    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Shop ID : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var insertUserPushQuery = 'insert into SB_USER_PUSH_INFO (SHOP_ID, USER_ID, USER_STAMP) value (' + mysql.escape(shopId) + ',' + mysql.escape(userId) +
            ', 1) on duplicate key update USER_STAMP = USER_STAMP +1';
        connection.query(insertUserPushQuery, function (err, userPushData) {
            if (err) {
                logger.error(TAG, "DB insertUserPushQuery error : " + err);
                res.status(400);
                res.send('Insert user push info error');
            } else {
                var selectStampHistoryCount = 'select count(*) as CNT from SB_USER_PUSH_HIS where USED_YN = "N" and SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId);
                connection.query(selectStampHistoryCount, function (err, stampHistoryCount) {
                    if (err) {
                        logger.error(TAG, "DB selectStampHistoryCount error : " + err);
                        res.status(400);
                        res.send('select user push history count error');
                    }else{
                        if(stampHistoryCount[0].CNT < 10) {
                            var insertStampHistory = 'insert into SB_USER_PUSH_HIS (SHOP_ID, USER_ID) value (' + mysql.escape(shopId) + ', ' + mysql.escape(userId) + ')';
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
                        if (stampHistoryCount[0].CNT == 9) {
                            var updatePushHistory = 'update SB_USER_PUSH_HIS set USED_YN = "Y" where  SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId)+' and USED_YN = "N" order by REG_DT ASC limit 10';
                            connection.query(updatePushHistory, function (err, UpdateCouphoneData) {
                                if (err) {
                                    logger.error(TAG, "DB updatePushHistory error : " + err);
                                    res.status(400);
                                    res.send('Update push history error');
                                }else{
                                    logger.debug(TAG, 'Update push history success');

                                    var updateCouphoneMapping = 'update SB_USER_COUPHONE SET USER_ID = '+mysql.escape(userId)+', MAPPING_YN = "Y"' +
                                        'where MAPPING_YN = "N" and USED_YN = "N" and SHOP_ID = '+mysql.escape(shopId)+' order by REG_DT ASC limit 1';
                                    connection.query(updateCouphoneMapping, function (err, UpdateCouphoneData) {
                                        if (err) {
                                            logger.error(TAG, "DB updateCouphoneMapping error : " + err);
                                            res.status(400);
                                            res.send('Update couphone mapping error');
                                        }else{
                                            logger.debug(TAG, 'Update couphone mapping success');

                                            res.status(200);
                                            res.send({resultData:'Update couphone mapping success'});
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
