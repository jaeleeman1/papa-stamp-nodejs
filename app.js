var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var shop = require('./routes/shop');
var stamp = require('./routes/stamp');
var coupon = require('./routes/coupon');
var event = require('./routes/event');
var setting = require('./routes/setting');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const shopUrl = '/v1/shop';
const stampUrl = '/v1/stamp';
const couponUrl = '/v1/coupon';
const eventUrl = '/v1/event';
const settingUrl = '/v1/setting';

app.use(shopUrl, shop);
app.use(stampUrl, stamp);
app.use(couponUrl, coupon);
app.use(eventUrl, event);
app.use(settingUrl, setting);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
