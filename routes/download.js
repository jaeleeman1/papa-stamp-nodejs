var express = require('express');
var router = express.Router();

const TAG = '[DOWNLOAD] ';

router.get('/papastamp.apk', function(req, res, next) {
    var filepath = __dirname + '/../download/papastamp-v1.0.0.apk'
    console.log(TAG, 'filepath: ' + filepath);
    res.download(filepath);
});

module.exports = router;