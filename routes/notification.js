var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var http = require('http');
var path = require('path');
var FCM = require('fcm-push');
var crypto = require( "crypto" );
var https = require("https");
var credential = 'Basic '+new Buffer('Papa-stamp:'+config.smsKey).toString('base64');

const TAG = '[NOTIFICATION INFO] ';

var encryptUid = function(unumber) {
    unumber = unumber.replace(/-/gi, '');
    unumber = '082'+ unumber;
    var secrect = config.secrectKey;
    var cipher = crypto.createCipher("aes-128-ecb", secrect);
    var crypted = cipher.update(unumber, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

var decryptUid = function(uid) {
    var secrect = config.secrectKey;
    var cipher = crypto.createDecipher('aes-128-ecb', secrect);
    var decrypted = cipher.update(uid, 'hex', 'utf8');
    decrypted += cipher.final('utf8');
    var returnValue = decrypted.substr(3,3) + '-' + decrypted.substr(6,4) + '-' + decrypted.substr(10,4);
    return returnValue;
}

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
    var retryCheck = req.body.retry_check;

    getConnection(function (err, connection) {
        var selectStampCount = 'select USER_STAMP from SB_USER_PUSH_INFO ' +
            'where DEL_YN = "N" and SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(userId);
        connection.query(selectStampCount, function (err, selectStampCountData) {
            if (err) {
                logger.error(TAG, "DB Select stamp count error : " + err);
                res.status(400);
                res.send('Select stamp count error');
            } else {
                logger.debug(TAG, 'Select stamp count success');

                var selectCouponQuery = 'select COUPON_NAME, COUPON_NUMBER, EXPIRATION_DT from SB_USER_COUPON ' +
                    'where SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId) +' and MAPPING_YN="Y" and USED_YN="N" and DEL_YN="N" ' +
                    'order by ISSUED_DT ASC';
                connection.query(selectCouponQuery, function (err, selectCouponData) {
                    if (err) {
                        logger.error(TAG, "Select Coupon error : " + err);
                        res.status(400);
                        res.send('Select coupon error');
                    } else {
                        logger.debug(TAG, 'Select coupon success');
                        if(retryCheck == 'true') {
                            io.sockets.emit(userId, {type:"request-stamp", sendId: shopId});
                        }
                        if(selectStampCountData.length > 0) {
                            io.sockets.emit(shopId, {type:"request-stamp", sendId: userId, phoneNumber: decryptUid(userId), userStamp: selectStampCountData[0].USER_STAMP, selectCouponData: selectCouponData});
                        }else {
                            io.sockets.emit(shopId, {type:"request-stamp", sendId: userId, phoneNumber: decryptUid(userId), userStamp: 0, selectCouponData: selectCouponData});
                        }
                        res.status(200);
                        res.send({resultData: 'request success'});
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
                        logger.debug(TAG, 'select user push history success');

                        var arrayValue = 'value ';
                        for(var i=0; i<stampNumber; i++) {
                            if(i != (stampNumber -1))
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
                            }else{
                                var insertUserPushQuery = 'insert into SB_USER_PUSH_INFO (SHOP_ID, USER_ID, USER_STAMP) ' +
                                    'value (' + mysql.escape(shopId) + ',' + mysql.escape(userId) + ', '+ stampNumber +') ' +
                                    'on duplicate key update USER_STAMP = USER_STAMP + ' + stampNumber;
                                connection.query(insertUserPushQuery, function (err, userPushData) {
                                    if (err) {
                                        logger.error(TAG, "Insert user push info error : " + err);
                                        res.status(400);
                                        res.send('Insert user push info error');
                                    } else {
                                        logger.debug(TAG, 'Insert user push info success');
                                        io.sockets.emit(userId, {type:"update", sendId: shopId, userCheck:userCheckData[0], stampCnt:userCheckData[0].USER_STAMP, stampNumber:stampNumber, shopData:shopData[0]});
                                        res.status(200);
                                        res.send({userId: userId, visitDate: shopData[0].VISIT_DATE, stampNumber:stampNumber});
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

router.post('/request-coupon', function (req, res, next) {
    logger.info(TAG, 'request user coupon');
    var userId = req.headers.user_id;
    var shopId = req.body.shop_id;
    var couponNumber = req.body.coupon_number;
    var retryCheck = req.body.retry_check;
    logger.info(TAG, 'request userId' , userId);
    logger.info(TAG, 'request shopId', shopId);
    logger.info(TAG, 'request couponNumber', couponNumber);

    getConnection(function (err, connection) {
        var selectStampCount = 'select USER_STAMP from SB_USER_PUSH_INFO ' +
            'where DEL_YN = "N" and SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(userId);
        connection.query(selectStampCount, function (err, selectStampCountData) {
            if (err) {
                logger.error(TAG, "DB Select stamp count error : " + err);
                res.status(400);
                res.send('Select stamp count error');
            } else {
                logger.debug(TAG, 'Select stamp count success');

                var selectCouponQuery = 'select COUPON_NAME, COUPON_NUMBER, EXPIRATION_DT from SB_USER_COUPON ' +
                    'where SHOP_ID = '+mysql.escape(shopId)+' and USER_ID = '+mysql.escape(userId) +' and MAPPING_YN="Y" and USED_YN="N" and DEL_YN="N" ' +
                    'order by ISSUED_DT ASC';
                connection.query(selectCouponQuery, function (err, selectCouponData) {
                    if (err) {
                        logger.error(TAG, "Select Coupon error : " + err);
                        res.status(400);
                        res.send('Select coupon error');
                    } else {
                        logger.debug(TAG, 'Select coupon success');
                        if(retryCheck == 'true') {
                            io.sockets.emit(userId, {type:"request-coupon", sendId: shopId});
                        }
                        if(selectStampCountData.length > 0) {
                            io.sockets.emit(shopId, {type:"request-coupon", sendId: userId, phoneNumber: decryptUid(userId), couponNumber:couponNumber, userStamp: selectStampCountData[0].USER_STAMP, selectCouponData: selectCouponData});
                        }else {
                            io.sockets.emit(shopId, {type:"request-coupon", sendId: userId, phoneNumber: decryptUid(userId), couponNumber:couponNumber, userStamp: 0, selectCouponData: selectCouponData});
                        }
                        res.status(200);
                        res.send({resultData: 'request success'});
                    }
                });
            }
            connection.release();
        });
    });
});

router.post('/issued-coupon', function (req, res, next) {
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
        var selectCouponData = 'select (select date_format(NOW(), "%Y-%m-%d %h:%i:%s")) as VISIT_DATE ' +
            'from SB_USER_COUPON ' +
            'where MAPPING_YN="Y" and DEL_YN="N" and SHOP_ID = ' + mysql.escape(shopId) + ' ' +
            'limit 1';
        console.log('dd ' + selectCouponData);
        connection.query(selectCouponData, function (err, useCouponData) {
            if (err) {
                logger.error(TAG, "DB useCoupon error : " + err);
                res.status(400);
                res.send('Update use coupon error');
            }else{
                logger.debug(TAG, 'Update use coupon success');
                io.sockets.emit(userId, {type:"issued-coupon", sendId: shopId, couponNumber:couponNumber, useCouponData:useCouponData[0], visitDate:useCouponData[0].VISIT_DATE});
                res.send({userId: userId, visitDate: useCouponData[0].VISIT_DATE, couponNumber:couponNumber});
            }
            connection.release();
        });
    });
});

router.post('/sendsms', function(req, res, next) {
    var userNumber = req.body.user_number;
    var sendType = req.body.send_type;
    var authCode = req.body.auth_code;
    userNumber = userNumber.replace(/-/gi, '');

    logger.debug(TAG, 'User Number : ' + userNumber);
    logger.debug(TAG, 'Send Type : ' + sendType);
    logger.debug(TAG, 'Auth Code : ' + authCode);

    var sendMsg = '';

    if(sendType == 'signup') {
        sendMsg = '가입 인증번호는 ['
    }else if(sendType == 'usingCoupon'){
        sendMsg = '쿠폰 사용 인증번호는 ['
    }

    var data = {
        "sender"     : "01037291715",
        "receivers"  : [userNumber],
        "content"    : sendMsg + authCode + '] - 파파 스탬프'
    }

    /*var body = JSON.stringify(data);

    var options = {
        host: 'api.bluehouselab.com',
        port: 443,
        path: '/smscenter/v1.0/sendsms',
        headers: {
            'Authorization': credential,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(body)
        },
        method: 'POST'
    };
    var req = https.request(options, function(res) {
        console.log(res.statusCode);
        var body = "";
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function(d) {
            if(res.statusCode==200)
                console.log(JSON.parse(body));
            else
                console.log(body);
        });
    });
    req.write(body);
    req.end();
    req.on('error', function(e) {
        console.error(e);
    });*/

    res.send({result:"success"});
});

module.exports = router;