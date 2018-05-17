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

    res.render('common/papa-stamp', { view: 'event', url:config.url, userId: userId, shopId:'', webCheck:webCheck});
});

//Get Event Shop Page
router.post('/main', function(req, res, next) {
    logger.info(TAG, 'Get event main information');

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

    res.render('common/papa-stamp', { view: 'event', url:config.url, userId: userId, shopId:'', webCheck:webCheck});
});

module.exports = router;
