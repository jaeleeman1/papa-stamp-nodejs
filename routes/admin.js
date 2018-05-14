var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var request = require('request');

const TAG = '[ADMIN INFO] ';

/* GET users listing. */
router.get('/signin', function(req, res, next) {
    var user_id = '';
    if(req.session.userInfo) {
        var userInfo = req.session.userInfo;
        user_id = userInfo.user_id;
        res.render('papa-admin/admin-signin', {url:config.url, userId: user_id});
    }else {
        res.render('papa-admin/admin-signin', {url:config.url, userId: "Username"});
    }
});

router.get('/signout', function(req, res, next) {
    req.session.destory(function(err){
        if(err) console.err('err', err);
        res.render('papa-admin/admin-signin', {url:config.url, userId: "Username"});
    });
});

router.get('/signin/userCheck', function(req, res, next) {
    getConnection(function (err, connection){
        var signinId = req.query.signin_id;
        var signinPassword = req.query.signin_password;

        var selectIdQuery = 'select exists (select * from SB_USER_INFO as SUI where SUI.USER_EMAIL = ' + mysql.escape(signinId) + ') as ID_CHECK';
        connection.query(selectIdQuery, function (err, rowId) {
            if (err) {
                console.error("*** initPage select id Error : " , err);
            }else{
                var signinIdCheck = rowId[0].ID_CHECK;
                var signinPwCheck = '0';
                if(signinIdCheck == '1') {
                    var selectPwQuery = 'select count(*) as PW_CHECK, SUI.SHOP_ID, SSI.SHOP_STAMP_IMG, SSI.SHOP_NAME from SB_USER_INFO as SUI ' +
                        'inner join SB_SHOP_INFO as SSI on SSI.SHOP_ID = SUI.SHOP_ID ' +
                        'where SUI.USER_TYPE = "200" and SUI.USER_EMAIL = ' + mysql.escape(signinId) + ' and SUI.USER_PASSWORD = ' + mysql.escape(signinPassword);
                    connection.query(selectPwQuery, function (err, dataPw) {
                        if (err) {
                            console.error("*** initPage select password Error : ", err);
                        } else {
                            signinPwCheck = dataPw[0].PW_CHECK;
                            var userInfo = {
                                user_id : signinId
                            }
                            req.session.userInfo = userInfo;
                            res.send({signinIdCheck: signinIdCheck, signinPwCheck: signinPwCheck, shopId: dataPw[0].SHOP_ID, signinId:signinId, shopName: dataPw[0].SHOP_NAME, shopIcon: dataPw[0].SHOP_STAMP_IMG});
                        }
                    });
                }else {
                    res.send({signinIdCheck: signinIdCheck, signinPwCheck: signinPwCheck});
                }
            }
            connection.release();
        });
    });
});

router.get('/signin/initPage', function(req, res, next) {
    var shopId = req.query.shop_id;
    var shopName = req.query.shop_name;
    var shopIcon = req.query.shop_icon;
    var userEmail = req.query.user_email;

    getConnection(function (err, connection) {
        var selectShopTotalQuery = "select count(DISTINCT(USER_ID)) as VISIT_CNT, count(USER_ID) as STAMP_CNT, DATE_FORMAT(`UPDATE_DT`, '%Y-%m-%d') AS VIEWDATE " +
            "from SB_USER_PUSH_HIS where UPDATE_DT > date_add(now(),interval -7 day) " +
            "and SHOP_ID = " + mysql.escape(shopId) +
            "group by VIEWDATE";
        connection.query(selectShopTotalQuery, function (err, shopTotalData) {
            if (err) {
                console.error("*** initPage select id Error : " , err);
                res.status(400);
                res.send('Select user push history error');
            }else {
                console.log('Select user push history success : ' + JSON.stringify(shopTotalData));
                var selectShopCouponQuery = "select count(USER_ID) as ISSUED_CNT, USER_ID, DATE_FORMAT(ISSUED_DT,'%Y-%m-%d') as VIEWDATE " +
                    "from SB_USER_COUPON where USED_DT > date_add(now(),interval -7 day) " +
                    "and MAPPING_YN = 'Y' and SHOP_ID = " + mysql.escape(shopId) +
                    "group by VIEWDATE";
                connection.query(selectShopCouponQuery, function (err, shopCouponData) {
                    if (err) {
                        console.error("*** initPage select id Error : " , err);
                        res.status(400);
                        res.send('Select stamp shop list error');
                    }else {
                        console.log('Select coupon list success : ' + JSON.stringify(shopCouponData));
                        var selectWeeklyQuery = "select DATE_FORMAT(DATE_NAME.WEEKLY_DAY,'%Y-%m-%d') as WEEKLYDATE, DATE_FORMAT(DATE_NAME.WEEKLY_DAY,'%m/%d') as VIEWDATE " +
                            "from (select curdate() - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY as WEEKLY_DAY " +
                            "from (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a " +
                            "cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b " +
                            "cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as c " +
                            "limit 7) DATE_NAME order by WEEKLY_DAY";
                        connection.query(selectWeeklyQuery, function (err, shopWeeklyData) {
                            if (err) {
                                console.error("*** initPage select id Error : " , err);
                                res.status(400);
                                res.send('Select stamp shop list error');
                            }else {
                                console.log('Select weekly list success : ' + JSON.stringify(shopWeeklyData));
                                var today;
                                var viewDate = [];
                                var stampDate = [];
                                var couponDate = [];

                                var tempViewVisit = [];
                                var tempViewStamp = [];
                                var tempViewCoupon = [];

                                var viewVisit = [];
                                var viewStamp = [];
                                var viewCoupon = [];

                                for(var i=0; i<shopTotalData.length; i++) {
                                    stampDate.push(shopTotalData[i].VIEWDATE);
                                    tempViewVisit.push(shopTotalData[i].VISIT_CNT);
                                    tempViewStamp.push(shopTotalData[i].STAMP_CNT);
                                }

                                for(var j=0; j<shopCouponData.length; j++) {
                                    couponDate.push(shopCouponData[j].VIEWDATE);
                                    tempViewCoupon.push(shopCouponData[j].ISSUED_CNT);
                                }

                                for(var i=0; i<shopWeeklyData.length; i++) {
                                    viewDate.push(shopWeeklyData[i].VIEWDATE);
                                    if(i == (shopWeeklyData.length -1)) {
                                        today = shopWeeklyData[i].WEEKLYDATE;
                                    }

                                    if((stampDate.indexOf(shopWeeklyData[i].WEEKLYDATE) > -1)) {
                                        var index = stampDate.indexOf(shopWeeklyData[i].WEEKLYDATE);
                                        viewVisit.push(tempViewVisit[index]);
                                        viewStamp.push(tempViewStamp[index]);
                                    }else {
                                        viewVisit.push(0);
                                        viewStamp.push(0);
                                    }

                                    if((couponDate.indexOf(shopWeeklyData[i].WEEKLYDATE) > -1)) {
                                        var index = couponDate.indexOf(shopWeeklyData[i].WEEKLYDATE);
                                        viewCoupon.push(tempViewCoupon[index]);
                                    }else {
                                        viewCoupon.push(0);
                                    }
                                }
                                res.status(200);
                                res.render('common/papa-admin',{view:'main', url:config.url, shopId:shopId, userEmail:userEmail, shopName: shopName, shopIcon: shopIcon, today:today, shopTotalData:shopTotalData, shopCouponData:shopCouponData, viewDate:viewDate, viewVisit:viewVisit, viewStamp:viewStamp, viewCoupon:viewCoupon});
                            }
                        });
                    }
                });
            }
            connection.release();
        });
    });
});

module.exports = router;