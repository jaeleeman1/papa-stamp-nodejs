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

    res.render('common/papa-stamp', { view: 'event', url:config.url, userId: userId, shopId:'', popupCheck:false});
});

module.exports = router;
