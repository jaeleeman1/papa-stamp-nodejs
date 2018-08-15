var express = require('express');
var router = express.Router();
var logger = require('../config/logger');

const TAG = '[DOWNLOAD] ';

router.get('/papastamp.apk', function(req, res, next) {
    var filepath = __dirname + '/../download/papastamp-v1.0.0.apk'
    logger.log(TAG, 'filepath: ' + filepath);
    res.download(filepath);
});

router.get('/admin.apk', function(req, res, next) {
    var filepath = __dirname + '/../download/admin-papastamp.apk'
    logger.log(TAG, 'filepath: ' + filepath);
    res.download(filepath);
});

module.exports = router;