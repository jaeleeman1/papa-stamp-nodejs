var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var request = require('request');
var admin = require("firebase-admin");
var serviceAccount = require("../config/papastamp-a72f6-firebase-adminsdk-qqp2q-6484dc5daa.json");

const TAG = '[USER INFO] ';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://papastamp-a72f6.firebaseio.com"
});

//Get User Location
router.get('/userLocation', function (req, res, next) {
    logger.info(TAG, 'Get user location');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User id : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    getConnection(function (err, connection){
        var selectUserLocationQuery = 'select SUI.CURRENT_LAT, SUI.CURRENT_LNG from SB_USER_INFO as SUI ' +
            'where SUI.USER_ID =' + mysql.escape(userId);
        connection.query(selectUserLocationQuery, function (err, userLocationData) {
            if (err) {
                logger.error(TAG, "Select user location error : " + err);
                res.status(400);
                res.send('Select user location error');
            }else{
                logger.debug(TAG, 'Select user location success : ' + JSON.stringify(userLocationData));
                res.status(200);
                res.send({userLocationData:userLocationData[0]});
            }
            connection.release();
        });
    });
});

// Get User Login
router.post('/userLogin', function(req, res, next) {
    logger.info(TAG, 'Get user login');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User ID : ' + userId);

    var userEmail = req.body.user_email;
    var userPassword = req.body.user_password;

    logger.debug(TAG, 'Login EMAIL : ' + userEmail);
    logger.debug(TAG, 'Login PW : ' + userPassword);

    if(userEmail == null || userEmail == undefined &&
        userPassword == null || userPassword == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var userEmailCheck = '0';
        var userPwCheck = '0';
        var selectLoginQuery = "select USER_PASSWORD, (select exists (select * from SB_USER_INFO where USER_EMAIL = "+ mysql.escape(userEmail) + ")) as EMAIL_CHECK" +
            " from SB_USER_INFO where USER_TYPE = 001 and USER_EMAIL = "+ mysql.escape(userEmail);
        connection.query(selectLoginQuery, function (err, userLogin) {
            if (err) {
                logger.error(TAG, "DB selectLoginQuery error : " + err);
                res.status(400);
                res.send('User sign in error');
            }else{
                logger.debug(TAG, 'Select user login success : ' + JSON.stringify(userLogin));
                if(userLogin.length < 1) {
                    res.status(500);
                    res.send('No user info');
                }else {
                    var userInfo = {
                        user_id : userId
                    }

                    userEmailCheck = userLogin[0].EMAIL_CHECK

                    if(userLogin[0].USER_PASSWORD == userPassword) {
                        userPwCheck = '1';
                    }
                    // req.session.userInfo = userInfo;
                    res.send({userId: userLogin[0].USER_ID, userEmailCheck: userEmailCheck, userPwCheck: userPwCheck});
                }
            }
            connection.release();
        });
    });
});

// Get Firebase User Create
router.get('/userCreate', function(req, res, next) {
    logger.info(TAG, 'Get user auth');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User ID : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid headers value');
        res.status(400);
        res.send('Invalid headers error');
    }

    admin.auth().createCustomToken(userId)
        .then(function(customToken) {
            // Send token back to client
            logger.debug(TAG, 'Custom token : ', customToken);
            res.send({customToken:customToken});
        })
        .catch(function(error) {
            logger.error(TAG, 'Error creating custom token : ', error);
            console.log("Error creating custom token:", error);
        });
});

//Put User Location
router.put('/updateLocation', function (req, res, next) {
    logger.info(TAG, 'Update user location');

    var userId = req.headers.user_id;
    var currentLat = req.body.latitude;
    var currentLng = req.body.longitude;

    logger.debug(TAG, 'User iD : ' + userId);
    logger.debug(TAG, 'Current latitude : ' + currentLat);
    logger.debug(TAG, 'Current longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id value');
        res.status(400);
        res.send('Invalid user id error');
    }

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid location parameter error');
        res.status(400);
        res.send('Invalid location parameter error');
    }

    getConnection(function (err, connection){
        var updateUserLocationQuery = 'insert into SB_USER_INFO (USER_ID, CURRENT_LAT, CURRENT_LNG) value ("'+ userId +'", "'+ currentLat +'", "' + currentLng +'") ' +
            'on duplicate key update CURRENT_LAT = "'+ currentLat +'", CURRENT_LNG = "'+ currentLng +'"';
        connection.query(updateUserLocationQuery, function (err, userLocationData) {
            if (err) {
                logger.error(TAG, "DB updateUserLocationQuery error : " + err);
                res.status(400);
                res.send('Update user location error');
            }else{
                logger.debug(TAG, 'Update user location success');
                res.status(200);
                res.send();
            }
            connection.release();
        });
    });
});

//Get Shop Beacon
router.get('/beaconToShopId', function (req, res, next) {
    logger.info(TAG, 'Get shop beacon');

    var beaconId = req.body.beacon_id;
    logger.debug(TAG, 'Beacon id : ' + beaconId);

    if(beaconId == null || beaconId == undefined) {
        logger.debug(TAG, 'Invalid beacon id parameter error');
        res.status(400);
        res.send('Invalid beacon id parameter error');
    }

    getConnection(function (err, connection){
        var selectBeaconIdQuery = 'select SHOP_ID from SB_SHOP_INFO as SSI ' +
            'where SSI.SHOP_BEACON =' + mysql.escape(beaconId);
        connection.query(selectBeaconIdQuery, function (err, beaconIdData) {
            if (err) {
                logger.error(TAG, "Select beacon id error : " + err);
                res.status(400);
                res.send('Select beacon id error');
            }else{
                logger.debug(TAG, 'Select beacon id success : ' + JSON.stringify(beaconIdData));
                res.status(200);
                res.send({beaconIdData:beaconIdData[0]});
            }
            connection.release();
        });
    });
});

module.exports = router;