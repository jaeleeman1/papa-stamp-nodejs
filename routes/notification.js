var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var http = require('http');
var path = require('path');
var FCM = require('fcm-push');


const TAG = '[NOTIFICATION INFO] ';
const serverKey = 'AAAAHIVXzfk:APA91bHqH863OCv5t6oNHwoYjDp5kmqd-D6GtrrU-QW_ikVCkW2HteP6pnvCT58XhKH4bobu0jOPZyzF2w1DFE1z4ktQ1bVS59iXQi70qqGFyW8g9LNLR8KgksXrm9lzQ1_FVsDsQZt0';

var notificationType = {
    "NOTIFICATION_TYPE_UNDEFINED" : 0,
    "NOTIFICATION_TYPE_ORDER_NOTIFICATION" : 1
};

router.post('/finish_order/:uid/', function(req, res, next) {
    console.log(TAG, 'POST: Send notification');

    var uid = req.params.uid;




    console.log(TAG, 'requested UID: ' + uid);

    var info = {
        uid: uid,
        nickname: "[주문 완료]"
    };

    sendNotification("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI3YzI4ZDFjNTA4OGYwMWNkYTdlNGNhNjU0ZWM4OGVmOCIsImlhdCI6MTUyMjU4MDMxOSwiZXhwIjoxNTIyNTgzOTE5LCJhdWQiOiJodHR",
        notificationType.NOTIFICATION_TYPE_ORDER_NOTIFICATION, info);

    res.status(200);
    res.send('sendSsupNotification response ok');
});

var sendNotification = function sendNotification(accessToken, notiType, info) {

    switch (notiType) {
        case notificationType.NOTIFICATION_TYPE_ORDER_NOTIFICATION:
            var callapse_key = 'ORDER';
            var title = info.nickname;
            var body = '01026181715 님의 주문이 완료되었습니다.';
            var tag = 1;
            break;
        default:
            console.log(TAG, 'Undefined notification type');
            return;
    }


    var message = {
        to: accessToken,
        collapse_key: callapse_key,
        notification: {
            title: title,
            body: body,
            icon: '/images/cafejass/couphone.png',
            tag: tag
        },
        data: {
            msgType: callapse_key,
            uid: info.uid,
            nickname: info.nickname
        }
    };


    var fcm = new FCM(serverKey);
    fcm.send(message, function(err, res){
        if (err) {
            console.log(TAG, "Failed to send notification, error: " + err);
        } else {
            console.log(TAG, "Successfully sent with response: ", res);
        }
    });
};

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

router.post('/request-stamp', function (req, res, next) {
    logger.info(TAG, 'request user stamp');
    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    io.sockets.emit(userId, {type:"request-stamp", sendId: shopId});
    io.sockets.emit(shopId, {type:"request-stamp", sendId: userId});
    res.status(200);
    res.send({resultData: 'request success'});
});

router.post('/update-stamp', function (req, res, next) {
    logger.info(TAG, 'Insert user stamp history');

    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    var stampNumber = req.body.param_number;

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

    getConnection(function (err, connection){
        var selectExistQuery  = 'select count(*) as USER_CHECK, USER_STAMP from SB_USER_PUSH_INFO ' +
            'where SHOP_ID =' + mysql.escape(shopId) + 'and USER_ID = ' + mysql.escape(userId);
        connection.query(selectExistQuery, function (err, userCheckData) {
            if (err) {
                logger.error(TAG, "Select user exist error : " + err);
                res.status(400);
                res.send('Select user exist error');
            } else {
                logger.debug(TAG, 'Select user exist success', userCheckData);

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
                        logger.debug(TAG, 'Insert user push history success');
                        io.sockets.emit(userId, {type:"update", sendId: shopId, userCheck:userCheckData[0], stampCnt:userCheckData[0].USER_STAMP, stampNumber:stampNumber, shopData:shopData[0]});
                        res.status(200);
                        res.send({userId: userId, visitDate: shopData[0].VISIT_DATE, stampNumber:stampNumber});
                    }
                });
            }
            connection.release();
        });
    });
});

router.post('/request-coupon', function (req, res, next) {
    logger.info(TAG, 'request user coupon');
    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    io.sockets.emit(userId, {type:"request-coupon", sendId: shopId});
    io.sockets.emit(shopId, {type:"request-coupon", sendId: userId});
    res.status(200);
    res.send({resultData: 'request success'});
});

router.post('/issued-coupon', function (req, res, next) {
    logger.info(TAG, 'Update use coupon data');

    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    var couponNumber = req.body.param_number;

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
                logger.debug(TAG, 'Update use coupon success');
                io.sockets.emit(userId, {type:"issued"});
                res.send({result: 'success'});
            }
            connection.release();
        });
    });
});

module.exports = router;