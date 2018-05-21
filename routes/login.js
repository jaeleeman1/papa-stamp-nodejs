var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var https = require("https");
var credential = 'Basic '+new Buffer('Papastamp:bc87948654b711e8a20d0cc47a1fcfae').toString('base64');

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

router.get('/sendSms', function(req, res, next) {
    var data = {
        "sender"     : "01037291715",
        "receivers"  : ["01026181715"],
        "content"    : "1234"
    }
    var body = JSON.stringify(data);

    var options = {
        host: 'api.bluehouselab.com',
        port: 443,
        path: '/smscenter/v1.0/sendsms',
        headers: {
            'Authorization': credential,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(body)
        },
        method: 'POST'
    };
    var req = https.request(options, function(res) {
        console.log(res.statusCode);
        var body = "";
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function(d) {
            if(res.statusCode==200)
                console.log(JSON.parse(body));
            else
                console.log(body);
        });
    });
    req.write(body);
    req.end();
    req.on('error', function(e) {
        console.error(e);
    });
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