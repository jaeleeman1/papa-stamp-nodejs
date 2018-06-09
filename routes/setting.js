var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var crypto = require( "crypto" );

const TAG = "[SETTING INFO] ";

var decryptUid = function(uid) {
    var secrect = config.secrectKey;
    var cipher = crypto.createDecipher('aes-128-ecb', secrect);
    var decrypted = cipher.update(uid, 'hex', 'utf8');
    decrypted += cipher.final('utf8');
    var returnValue = decrypted.substr(3,3) + '-' + decrypted.substr(6,4) + '-' + decrypted.substr(10,4);
    return returnValue;
}

//Get Setting Page
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get setting main information');

    var userId = req.query.user_id;
    var webCheck = req.query.web_check;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Web check : ' + webCheck);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    if(userId.length > 0) {
        getConnection(function (err, connection){
            var selectUserInfo = 'select USER_ID, USER_EMAIL from SB_USER_INFO where USER_ID = ' + mysql.escape(userId);
            connection.query(selectUserInfo, function (err, userInfoData) {
                if (err) {
                    logger.error(TAG, "Select user info error : " + err);
                    res.status(400);
                    res.send('Select user info error');
                }else{
                    logger.debug(TAG, 'Select user info success : ' + JSON.stringify(userInfoData));
                    res.status(200);
                    res.render('common/papa-stamp', {view:'setting', url:config.url, fcmKey:config.fcmKey, userId:userId, userNumber:decryptUid(userId) , shopId:'', userInfoData:userInfoData[0], webCheck:webCheck});
                }
                connection.release();
            });
        });
    }else {
        logger.debug(TAG, 'Blank user info success');
        res.status(200);
        res.render('common/papa-stamp', {view:'setting', url:config.url, userId:'', fcmKey:config.fcmKey, userNumber:'로그인 하시기 바랍니다.', shopId:'', userInfoData:{USER_EMAIL:"papastamp@naver.com"}, webCheck:webCheck});
    }

});

//Get Setting Page
router.post('/main', function(req, res, next) {
    logger.info(TAG, 'Get setting main information');

    var userId = req.body.user_id;
    var webCheck = req.body.web_check;

    logger.debug(TAG, 'User id : ' + userId);
    logger.debug(TAG, 'Web check : ' + webCheck);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    if(userId.length > 0) {
        getConnection(function (err, connection){
            var selectUserInfo = 'select USER_ID, USER_EMAIL from SB_USER_INFO where USER_ID = ' + mysql.escape(userId);
            connection.query(selectUserInfo, function (err, userInfoData) {
                if (err) {
                    logger.error(TAG, "Select user info error : " + err);
                    res.status(400);
                    res.send('Select user info error');
                }else{
                    logger.debug(TAG, 'Select user info success : ' + JSON.stringify(userInfoData));
                    res.status(200);
                    res.render('common/papa-stamp', {view:'setting', url:config.url, fcmKey:config.fcmKey, userId:userId, userNumber:decryptUid(userId) , shopId:'', userInfoData:userInfoData[0], webCheck:webCheck});
                }
                connection.release();
            });
        });
    }else {
        logger.debug(TAG, 'Blank user info success');
        res.status(200);
        res.render('common/papa-stamp', {view:'setting', url:config.url, fcmKey:config.fcmKey, userId:'', userNumber:'로그인 하시기 바랍니다.', shopId:'', userInfoData:{USER_EMAIL:"papastamp@naver.com"}, webCheck:webCheck});
    }

});

//GET Password Data
router.get('/checkPassword', function(req, res, next) {
    logger.info(TAG, 'Get check password information');

    var userId = req.query.userId;

    logger.debug(TAG, 'User id : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    getConnection(function (err, connection){
        var selectPasswordQuery = 'select USER_PASSWORD from SB_USER_INFO where USER_ID = ' + mysql.escape(userId);
        connection.query(selectPasswordQuery, function (err, passwordData) {
            if (err) {
                logger.error(TAG, "Select check password error : " + err);
                res.status(400);
                res.send('Select user info error');
            }else{
                logger.debug(TAG, 'Select check password success : ' + JSON.stringify(passwordData));
                res.status(200);
                res.send({checkPassword:passwordData[0].USER_PASSWORD});
            }
            connection.release();
        });
    });
});

//Put Change Password Data
router.put('/changePassword', function(req, res, next) {
    logger.info(TAG, 'Update user password data');

    var userId = req.headers.user_id;
    var newPassword = req.body.input_password;

    logger.debug(TAG, 'User id : ' + userId);

    if(userId == null || userId == undefined &&
        newPassword == null || newPassword == undefined)  {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Update Change Password Data API
    getConnection(function (err, connection) {
        var selectPasswordQuery = "update SB_USER_INFO set USER_PASSWORD = password(" + mysql.escape(newPassword) + ") " +
            "where USER_ID = " + mysql.escape(userId);
        connection.query(selectPasswordQuery, function (err, DeleteCouponData) {
            if (err) {
                logger.error(TAG, "Update user password error : " + err);
                res.status(400);
                res.send('Update user password error');
            }else{
                logger.debug(TAG, 'Update user password success');
                res.send({result: 'success'});
            }
            connection.release();
        });
    });
});

module.exports = router;
