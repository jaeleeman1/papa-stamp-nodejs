var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/main', function(req, res, next) {
    res.render('papa-setting/setting', { title: 'Express', title2: 'Express2' });
});

module.exports = router;
