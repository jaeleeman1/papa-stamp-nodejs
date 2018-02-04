var express = require('express');
var router = express.Router();

/* GET stamp page. */
router.get('/main', function(req, res, next) {
  res.render('papa-stamp/stamp', { title: 'Express', title2: 'Express2' });
});

module.exports = router;
