var express = require('express');
var router = express.Router();

/* GET shop page. */
router.get('/main', function(req, res, next) {
  res.render('papa-shop/shop', { title: 'Express', title2: 'Express2' });
});

module.exports = router;
