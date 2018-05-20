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

router.get('/login/userCheck', function(req, res, next) {
    var loginEmail = req.query.login_email;
    var loginPassword = req.query.login_password;
    getConnection(function (err, connection){
        var selectIdQuery = 'select exists (select * from SB_USER_INFO where USER_TYPE="300" and USER_EMAIL = ' + mysql.escape(loginEmail) + ') as ID_CHECK';
        connection.query(selectIdQuery, function (err, loginEmailData) {
            if (err) {
                console.error("*** initPage select id Error : " , err);
            }else{
                var loginEmailCheck = loginEmailData[0].ID_CHECK;
                var loginPwCheck = '0';
                if(loginEmailCheck == '1') {
                    var selectPwQuery = 'select count(*) as PW_CHECK, USER_ID, CURRENT_LAT, CURRENT_LNG ' +
                        'from SB_USER_INFO ' +
                        'where USER_TYPE = "300" and USER_EMAIL = ' + mysql.escape(loginEmail) + ' and USER_PASSWORD = ' + mysql.escape(loginPassword);
                    connection.query(selectPwQuery, function (err, loginPwData) {
                        if (err) {
                            console.error("*** initPage select password Error : ", err);
                        } else {
                            loginPwCheck = loginPwData[0].PW_CHECK;
                            var userInfo = {
                                user_email : loginEmail
                            }
                            req.session.userInfo = userInfo;
                            res.send({loginEmailCheck: loginEmailCheck, loginPwCheck: loginPwCheck, userId: loginPwData[0].USER_ID, currentLat:loginPwData[0].CURRENT_LAT, currentLng: loginPwData[0].CURRENT_LNG});
                        }
                    });
                }else {
                    res.send({loginEmailCheck: loginEmailCheck, loginPwCheck: loginPwCheck});
                }
            }
            connection.release();
        });
    });
});

module.exports = router;