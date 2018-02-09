var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

/* GET shop page. */
router.get('/main', function(req, res, next) {
    res.render('common/papa-stamp', { view: 'shop', url:config.url, userId:'7c28d1c5088f01cda7e4ca654ec88ef8' });
});

module.exports = router;
