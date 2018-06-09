var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var crypto = require( "crypto" );

const TAG = '[ADMIN STAMP INFO] ';

var encryptUid = function(unumber) {
    unumber = unumber.replace(/-/gi, '');
    unumber = '082'+ unumber;
    var secrect = config.secrectKey;
    var cipher = crypto.createCipher("aes-128-ecb", secrect);
    var crypted = cipher.update(unumber, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

var decryptUid = function(uid) {
    var secrect = config.secrectKey;
    var cipher = crypto.createDecipher('aes-128-ecb', secrect);
    var decrypted = cipher.update(uid, 'hex', 'utf8');
    decrypted += cipher.final('utf8');
    var returnValue = decrypted.substr(3,3) + '-' + decrypted.substr(6,4) + '-' + decrypted.substr(10,4);
    return returnValue;
}

/* GET stamp listing. */
router.get('/main', function(req, res, next) {
    var shopId = req.query.shop_id;
    var shopName = req.query.shop_name;
    var shopIcon = req.query.shop_icon;
    var userEmail = req.query.user_email;

    getConnection(function (err, connection) {
        //Grgaph daily data
        var selectStampTotalQuery = 'select count(USER_ID) as STAMP_CNT, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d") AS COMPARE_DATE ' +
            'from SB_USER_PUSH_HIS where UPDATE_DT > date_add(now(),interval -10 day) ' +
            'and SHOP_ID = ' + mysql.escape(shopId) + ' and USED_YN="N" ' +
            'group by COMPARE_DATE';
        connection.query(selectStampTotalQuery, function (err, shopStampTotalData) {
            if (err) {
                console.error("*** initPage select id Error : " , err);
                res.status(400);
                res.send('Select user push history error');
            }else {
                console.log('Select user push history success : ' + JSON.stringify(shopStampTotalData));
                //Today data
                var selectStampTodayQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_PUSH_HIS ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and DEL_YN="N" and UPDATE_DT >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d") order by UPDATE_DT desc';
                connection.query(selectStampTodayQuery, function (err, shopsStampTodayData) {
                    if (err) {
                        console.error("*** initPage select id Error : " , err);
                        res.status(400);
                        res.send('Select stamp shop list error');
                    }else {
                        console.log('Select coupon list success : ' + JSON.stringify(shopsStampTodayData));
                        //Weekly data
                        var selectWeeklyQuery = 'select DATE_FORMAT(DATE_NAME.WEEKLY_DAY, "%Y-%m-%d") as WEEKLY_DATE, DATE_FORMAT(DATE_NAME.WEEKLY_DAY, "%m/%d") as VIEW_DATE ' +
                            'from (select curdate() - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY as WEEKLY_DAY ' +
                            'from (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a ' +
                            'cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b ' +
                            'cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as c ' +
                            'limit 10) DATE_NAME order by WEEKLY_DAY';
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

                                var tempViewStamp = [];

                                var viewStamp = [];

                                for(var i=0; i<shopStampTotalData.length; i++) {
                                    stampDate.push(shopStampTotalData[i].COMPARE_DATE);
                                    tempViewStamp.push(shopStampTotalData[i].STAMP_CNT);
                                }



                                for(var i=0; i<shopWeeklyData.length; i++) {
                                    viewDate.push(shopWeeklyData[i].VIEW_DATE);
                                    if(i == (shopWeeklyData.length -1)) {
                                        today = shopWeeklyData[i].WEEKLY_DATE;
                                    }

                                    if((stampDate.indexOf(shopWeeklyData[i].WEEKLY_DATE) > -1)) {
                                        var index = stampDate.indexOf(shopWeeklyData[i].WEEKLY_DATE);
                                        viewStamp.push(tempViewStamp[index]);
                                    }else {
                                        viewStamp.push(0);
                                    }
                                }

                                for(var i=0; i<shopsStampTodayData.length; i++) {
                                    var tempId = shopsStampTodayData[i].USER_ID;
                                    shopsStampTodayData[i].USER_ID = decryptUid(tempId);
                                }

                                res.status(200);
                                res.render('common/papa-admin',{view:'stamp', url:config.url, fcmKey:config.fcmKey, shopId:shopId, userEmail:userEmail, shopName: shopName, shopIcon: shopIcon, today:today, shopsStampTodayData:shopsStampTodayData, viewDate:viewDate, viewStamp:viewStamp});
                            }
                        });
                    }
                });
            }
            connection.release();
        });
    });
});

//Get User Data
router.get('/user-data', function(req, res, next) {
    logger.info(TAG, 'Get shop data');

    var shopId = req.headers.shop_id;
    logger.debug(TAG, 'Shop id : ' + shopId);

    var userNumber = req.query.user_number;
    var usedYn = req.query.used_yn;
    var delYn = req.query.del_yn;
    logger.debug(TAG, 'User number : ' + userNumber);

    if(userNumber == null || userNumber == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectUserHisDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_PUSH_HIS ' +
            'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(encryptUid(userNumber));
        if(usedYn != "ALL") {
            selectUserHisDataQuery += " and USED_YN = '"+ usedYn +"'";
        }
        if(delYn != "ALL") {
            selectUserHisDataQuery += " and DEL_YN = '" + delYn + "'";
        }
        selectUserHisDataQuery += " group by UPDATE_DT desc";
        console.log(selectUserHisDataQuery);
        connection.query(selectUserHisDataQuery, function (err, userHisData) {
            if (err) {
                console.error("Select shop data Error : ", err);
                res.status(400);
                res.send('Select shop data error');
            } else {
                var selectUserInfoDataQuery = 'select USER_STAMP from SB_USER_PUSH_INFO ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = '+ mysql.escape(encryptUid(userNumber));
                console.log(selectUserInfoDataQuery);
                connection.query(selectUserInfoDataQuery, function (err, userInfoData) {
                    if (err) {
                        console.error("Select shop data Error : ", err);
                        res.status(400);
                        res.send('Select shop data error');
                    } else {
                        for(var i=0; i<userHisData.length; i++) {
                            var tempId = userHisData[i].USER_ID;
                            userHisData[i].USER_ID = decryptUid(tempId);
                        }

                        res.status(200);
                        res.send({userHisData: userHisData, userStamp: userInfoData[0].USER_STAMP});
                    }
                });
            }
            connection.release();
        });
    });
});

//Get User Data
router.get('/period-data', function(req, res, next) {
    logger.info(TAG, 'Get period data');

    var shopId = req.headers.shop_id;
    logger.debug(TAG, 'Shop id : ' + shopId);

    var startDate = req.query.start_date;
    var endDate = req.query.end_date;
    var usedYn = req.query.used_yn;
    var delYn = req.query.del_yn;
    console.log('startDate : '+startDate);
    console.log('endDate : ' +endDate);

    /*    if(startDate == null || startDate == undefined &&
     endDate == null || endDate == undefined) {
     logger.debug(TAG, 'Invalid location parameter error');
     res.status(400);
     res.send('Invalid location parameter error');
     }*/

    //Shop Data API
    getConnection(function (err, connection) {
        var selectPeriodDataQuery;
        var paramStartDate;
        var paramEndDate;

        if(startDate.length > 0) {
            paramStartDate = startDate.substr(6, 4) +'-'+ startDate.substr(3, 2) +'-'+ startDate.substr(0, 2);
            if(endDate.length > 0) {
                paramEndDate = endDate.substr(6, 4) +'-'+ endDate.substr(3, 2) +'-'+ endDate.substr(0, 2);
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where UPDATE_DT between "'+ paramStartDate +'" and DATE_FORMAT(DATE_ADD("'+ paramEndDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) ;
            }else {
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where UPDATE_DT between "'+ paramStartDate +'" and DATE_FORMAT(DATE_ADD("'+ paramStartDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) ;
            }
            if(usedYn != "ALL") {
                selectPeriodDataQuery += ' and USED_YN = "' + usedYn + '"';
            }
            if(delYn != "ALL") {
                selectPeriodDataQuery += ' and DEL_YN = "' + delYn + '"';
            }
            selectPeriodDataQuery += 'group by VISIT_DATE';
        }else {
            if(endDate.length > 0) {
                paramEndDate = endDate.substr(6, 4) +'-'+ endDate.substr(3, 2) +'-'+ endDate.substr(0, 2);
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where UPDATE_DT between "'+ paramEndDate +'" and DATE_FORMAT(DATE_ADD("'+ paramEndDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) ;
            }else {
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d") as "VIEW_DATE", DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and UPDATE_DT >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d"")';
            }
            if(usedYn != "ALL") {
                selectPeriodDataQuery += ' and USED_YN = "' + usedYn + '"';
            }
            if(delYn != "ALL") {
                selectPeriodDataQuery += ' and DEL_YN = "' + delYn + '"';
            }
            selectPeriodDataQuery += 'group by VISIT_DATE';
        }

        console.log(selectPeriodDataQuery);
        connection.query(selectPeriodDataQuery, function (err, periodData) {
            if (err) {
                console.error("Select shop data Error : ", err);
                res.status(400);
                res.send('Select shop data error');
            } else {
                console.log('Select shop data success : ' + JSON.stringify(periodData));
                for(var i=0; i<periodData.length; i++) {
                    var tempId = periodData[i].USER_ID;
                    periodData[i].USER_ID = decryptUid(tempId);
                }

                res.status(200);
                res.send({periodData: periodData});
            }
            connection.release();
        });
    });
});

//Put Card Data
router.put('/deleteStamp', function(req, res, next) {
    console.log('Delete stamp data');

    var shopId = req.headers.shop_id;
    var userId = req.body.user_id;
    var visitDate = req.body.visit_date;

    console.log('User id : ' + userId);
    console.log('Shop id : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        console.log('Invalid id parameter error');
        res.status(400);
        res.send('Invalid id parameter error');
    }

    //Card Data API
    getConnection(function (err, connection) {
        var deletePushInfo = 'update SB_USER_PUSH_HIS set DEL_YN = "Y" ' +
            'where SHOP_ID = "' + mysql.escape(shopId) + '" and USER_ID = "' + mysql.escape(userId) + '" and DATE_FORMAT(UPDATE_DT,"%Y-%m-%d %h:%i:%s") = "' + visitDate +'"';
        console.log(deletePushInfo);
        connection.query(deletePushInfo, function (err, DeletePushInfoData) {
            if (err) {
                console.error("DB deletePushInfo error : " + err);
                res.status(400);
                res.send('Delete push info error');
            }else{
                console.log('Delete push info success');
                res.send({result: 'success'});
            }
            connection.release();
        });
    });
});

module.exports = router;