var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = "[SETTING INFO] ";

//Get Setting Page
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get setting main information');

    var userId = req.query.user_id;

    logger.debug(TAG, 'User id : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

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
                res.render('common/papa-stamp', {view:'setting', url:config.url, userId:userId, userInfoData:userInfoData[0]});
            }
            connection.release();
        });
    });
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

    logger.debug(TAG, 'User id : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    //Update Change Password Data API
    getConnection(function (err, connection) {
        var selectPasswordQuery = 'select USER_PASSWORD from SB_USER_INFO where USER_ID = ' + mysql.escape(userId);
        connection.query(selectPasswordQuery, function (err, DeleteCouponData) {
            if (err) {
                logger.error(TAG, "Select user password error : " + err);
                res.status(400);
                res.send('Select user password error');
            }else{
                logger.debug(TAG, 'Select user password success');
                res.send({result: 'success'});
            }
            connection.release();
        });
    });
});

module.exports = router;
