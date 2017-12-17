var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/main', function(req, res, next) {
  res.render('shop-main/shopMain', { title: 'Express', title2: 'Express2' });
});

router.get('/stamp', function(req, res, next) {
    res.render('shop-stamp/stampMain', { title: 'Express', title2: 'Express2' });
});

router.get('/coupon', function(req, res, next) {
    res.render('shop-coupon/couponList', { title: 'Express', title2: 'Express2' });
});

router.get('/map', function(req, res, next) {
    res.render('shop-map/shopMap', { title: 'Express', title2: 'Express2' });
});

router.get('/setting', function(req, res, next) {
    res.render('setting/setting', { title: 'Express', title2: 'Express2' });
});

module.exports = router;
