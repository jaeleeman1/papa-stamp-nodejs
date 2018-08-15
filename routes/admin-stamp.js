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
    logger.info(TAG, 'Get Admin Stamp Main');
    var shopId = req.query.shop_id;
    var shopName = req.query.shop_name;
    var shopIcon = req.query.shop_icon;
    var userEmail = req.query.user_email;

    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Shop name: ' + shopName);
    logger.debug(TAG, 'User email : ' + userEmail);

    if(shopId == null || shopId == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection) {
        //Grgaph daily data
        var selectStampTotalQuery = 'select count(USER_ID) as STAMP_CNT, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d") AS COMPARE_DATE ' +
            'from SB_USER_PUSH_HIS where UPDATE_DT > date_add(now(),interval -10 day) ' +
            'and SHOP_ID = ' + mysql.escape(shopId) + ' and USED_YN="N" ' +
            'group by COMPARE_DATE';
        connection.query(selectStampTotalQuery, function (err, shopStampTotalData) {
            if (err) {
                logger.error(TAG, 'Select grgaph daily data error', err);
                res.status(400);
                res.send('Select grgaph daily data error');
            }else {
                logger.debug('Select grgaph daily data success : ' + JSON.stringify(shopStampTotalData));
                //Today data
                var selectStampTodayQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s,%f") as VISIT_DATE from SB_USER_PUSH_HIS ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and USED_YN="N" and DEL_YN="N" and UPDATE_DT >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d") order by UPDATE_DT desc';
                connection.query(selectStampTodayQuery, function (err, shopStampTodayData) {
                    if (err) {
                        logger.error(TAG, 'Select today data error', err);
                        res.status(400);
                        res.send('Select today data error');
                    }else {
                        logger.debug('Select today data success : ' + JSON.stringify(shopStampTodayData));
                        //Weekly data
                        var selectWeeklyQuery = 'select DATE_FORMAT(DATE_NAME.WEEKLY_DAY, "%Y-%m-%d") as WEEKLY_DATE, DATE_FORMAT(DATE_NAME.WEEKLY_DAY, "%m/%d") as VIEW_DATE ' +
                            'from (select curdate() - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY as WEEKLY_DAY ' +
                            'from (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a ' +
                            'cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b ' +
                            'cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as c ' +
                            'limit 10) DATE_NAME order by WEEKLY_DAY';
                        connection.query(selectWeeklyQuery, function (err, shopWeeklyData) {
                            if (err) {
                                logger.error(TAG, 'Select weekly data error', err);
                                res.status(400);
                                res.send('Select weekly data error');
                            }else {
                                logger.debug('Select weekly data success : ' + JSON.stringify(shopWeeklyData));
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

                                for(var i=0; i<shopStampTodayData.length; i++) {
                                    var tempId = shopStampTodayData[i].USER_ID;
                                    shopStampTodayData[i].USER_ID = decryptUid(tempId);
                                }

                                res.status(200);
                                res.render('common/papa-admin',{view:'stamp', url:config.url, fcmKey:config.fcmKey, shopId:shopId, userEmail:userEmail, shopName: shopName, shopIcon: shopIcon, today:today, shopStampTodayData:shopStampTodayData, viewDate:viewDate, viewStamp:viewStamp});
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
    logger.info(TAG, 'Get Admin User Data');

    var shopId = req.headers.shop_id;
    var userNumber = req.query.user_number;
    var usedYn = req.query.used_yn;
    var delYn = req.query.del_yn;

    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'User number : ' + userNumber);
    logger.debug(TAG, 'User yn : ' + usedYn);
    logger.debug(TAG, 'Del yn : ' + delYn);

    if(shopId == null || shopId == undefined &&
        userNumber == null || userNumber == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectUserHisDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s,%f") as VISIT_DATE from SB_USER_PUSH_HIS ' +
            'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(encryptUid(userNumber));
        if(usedYn != "ALL") {
            selectUserHisDataQuery += " and USED_YN = '"+ usedYn +"'";
        }
        if(delYn != "ALL") {
            selectUserHisDataQuery += " and DEL_YN = '" + delYn + "'";
        }
        selectUserHisDataQuery += " order by UPDATE_DT desc";
        connection.query(selectUserHisDataQuery, function (err, userHisData) {
            if (err) {
                logger.error(TAG, 'Select user stamp history data error', err);
                res.status(400);
                res.send('Select user stamp history error');
            } else {
                logger.debug('Select user stamp history success : ' + JSON.stringify(userHisData));
                var selectUserInfoDataQuery = 'select USER_STAMP from SB_USER_PUSH_INFO ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = '+ mysql.escape(encryptUid(userNumber));
                connection.query(selectUserInfoDataQuery, function (err, userInfoData) {
                    if (err) {
                        logger.error(TAG, 'Select user stamp info data error', err);
                        res.status(400);
                        res.send('Select user stamp info data error');
                    } else {
                        logger.debug('Select user stamp info data success : ' + JSON.stringify(userInfoData));
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
    var startDate = req.query.start_date;
    var endDate = req.query.end_date;
    var usedYn = req.query.used_yn;
    var delYn = req.query.del_yn;

    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Start date : ' + startDate);
    logger.debug(TAG, 'End date : ' + endDate);
    logger.debug(TAG, 'Used yn : ' + usedYn);
    logger.debug(TAG, 'Del yn : ' + delYn);

    if(shopId == null || shopId == undefined &&
        startDate == null || startDate == undefined &&
        endDate == null || endDate == undefined) {
        logger.debug(TAG, 'Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectPeriodDataQuery;
        var paramStartDate;
        var paramEndDate;

        if(startDate.length > 0) {
            paramStartDate = startDate.substr(6, 4) +'-'+ startDate.substr(3, 2) +'-'+ startDate.substr(0, 2);
            if(endDate.length > 0) {
                paramEndDate = endDate.substr(6, 4) +'-'+ endDate.substr(3, 2) +'-'+ endDate.substr(0, 2);
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s,%f") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where UPDATE_DT between "'+ paramStartDate +'" and DATE_FORMAT(DATE_ADD("'+ paramEndDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) ;
            }else {
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s,%f") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where UPDATE_DT between "'+ paramStartDate +'" and DATE_FORMAT(DATE_ADD("'+ paramStartDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) ;
            }
        }else {
            if(endDate.length > 0) {
                paramEndDate = endDate.substr(6, 4) +'-'+ endDate.substr(3, 2) +'-'+ endDate.substr(0, 2);
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s,%f") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where UPDATE_DT between "'+ paramEndDate +'" and DATE_FORMAT(DATE_ADD("'+ paramEndDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) ;
            }else {
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, DATE_FORMAT(UPDATE_DT, "%Y-%m-%d") as "VIEW_DATE", DATE_FORMAT(UPDATE_DT, "%Y-%m-%d %h:%i:%s,%f") as "VISIT_DATE" from SB_USER_PUSH_HIS ' +
                    'where UPDATE_DT >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d"") and SHOP_ID = ' + mysql.escape(shopId);
            }
        }
        if(usedYn != "ALL") {
            selectPeriodDataQuery += ' and USED_YN = "' + usedYn + '"';
        }
        if(delYn != "ALL") {
            selectPeriodDataQuery += ' and DEL_YN = "' + delYn + '"';
        }
        selectPeriodDataQuery += ' order by VISIT_DATE';
        connection.query(selectPeriodDataQuery, function (err, periodData) {
            if (err) {
                logger.error(TAG, 'Select shop data  error', err);
                res.status(400);
                res.send('Select shop data error');
            } else {
                logger.debug('Select shop data success : ' + JSON.stringify(periodData));
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

//Put Stamp Data
router.put('/deleteStamp', function(req, res, next) {
    logger.info('Delete Stamp Data');

    var shopId = req.headers.shop_id;
    var userId = req.body.user_id;
    var visitDate = req.body.visit_date;

    logger.debug('User id : ' + userId);
    logger.debug('Shop id : ' + shopId);

    if(shopId == null || shopId == undefined &&
        userId == null || userId == undefined) {
        logger.debug('Invalid parameter error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Card Data API
    getConnection(function (err, connection) {
        var deletePushInfo = 'update SB_USER_PUSH_HIS set DEL_YN = "Y" ' +
            'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' + mysql.escape(encryptUid(userId)) + ' and DATE_FORMAT(UPDATE_DT,"%Y-%m-%d %h:%i:%s,%f") = "' + visitDate +'"';
        logger.log(deletePushInfo);
        connection.query(deletePushInfo, function (err, DeletePushInfoData) {
            if (err) {
                logger.error("Delete stamp history data error : " + err);
                res.status(400);
                res.send('Delete stamp history data error');
            }else{
                logger.log('Delete stamp history data success');
                res.send({result: 'success'});
            }
            connection.release();
        });
    });
});

module.exports = router;