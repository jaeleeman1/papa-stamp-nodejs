var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');

const TAG = '[LOGIN INFO] ';

/* GET users listing. */
router.get('/', function(req, res, next) {
    var user_email = '';
    if(req.session.userInfo) {
        var userInfo = req.session.userInfo;
        user_email = userInfo.user_email;
        res.render('login', {url:config.url, userEmail: user_email});
    }else {
        res.render('login', {url:config.url, userEmail: "E-Mail"});
    }
});

router.get('/signup', function(req, res, next) {
    res.render('signup', {url:config.url});
});

router.get('/logout', function(req, res, next) {
    req.session.destory(function(err){
        if(err) console.err('err', err);
        res.render('papa-admin/admin-signin', {url:config.url, userId: "Username"});
    });
});

module.exports = router;