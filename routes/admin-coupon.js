var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var crypto = require( "crypto" );

const TAG = '[ADMIN COUPON INFO] ';

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
    logger.info(TAG, 'Get Admin Coupon Main');
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
        var selectIssuedCouponTotalQuery = 'select USER_ID, count(USER_ID) as ISSUED_CNT, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as ISSUED_DATE ' +
            'from SB_USER_COUPON where ISSUED_DT > date_add(now(),interval -10 day) ' +
            'and SHOP_ID = ' + mysql.escape(shopId) + ' and MAPPING_YN="Y" and USED_YN="N" ' +
            'group by ISSUED_DATE';
        connection.query(selectIssuedCouponTotalQuery, function (err, shopIssuedCouponTotalData) {
            if (err) {
                logger.error(TAG, 'Select issued coupon grgaph daily data error', err);
                res.status(400);
                res.send('Select issued coupon grgaph daily data error');
            }else {
                logger.debug('Select issued coupon grgaph daily data success : ' + JSON.stringify(shopIssuedCouponTotalData));
                var selectUsedCouponTotalQuery = 'select USER_ID, count(USER_ID) as USED_CNT, DATE_FORMAT(USED_DT, "%Y-%m-%d") as USED_DATE ' +
                    'from SB_USER_COUPON where USED_DT > date_add(now(),interval -10 day) ' +
                    'and SHOP_ID = ' + mysql.escape(shopId) + ' and MAPPING_YN="Y" and USED_YN="Y" ' +
                    'group by USED_DATE';
                connection.query(selectUsedCouponTotalQuery, function (err, shopUsedCouponTotalData) {
                    if (err) {
                        logger.error(TAG, 'Select used coupon grgaph daily data error', err);
                        res.status(400);
                        res.send('Select used coupon  grgaph daily data error');
                    } else {
                        logger.debug('Select used coupon grgaph daily data success : ' + JSON.stringify(shopUsedCouponTotalData));
                        //Today data
                        var selectCouponIssuedTodayQuery = 'select USER_ID, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE, ' +
                            'DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE ' +
                            'from SB_USER_COUPON ' +
                            'where SHOP_ID = ' + mysql.escape(shopId) + ' and DEL_YN="N" and MAPPING_YN="Y" and ISSUED_DT >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d") order by ISSUED_DT desc';
                        connection.query(selectCouponIssuedTodayQuery, function (err, shopCouponIssuedTodayData) {
                            if (err) {
                                logger.error(TAG, 'Select today data error', err);
                                res.status(400);
                                res.send('Select today data error');
                            }else {
                                logger.debug('Select today data success : ' + JSON.stringify(shopCouponIssuedTodayData));
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
                                        var issuedDate = [];
                                        var usedDate = [];

                                        var tempIssuedCoupon = [];
                                        var tempUsedCoupon = [];

                                        var issuedCoupon = [];
                                        var usedCoupon = [];

                                        for(var i=0; i<shopIssuedCouponTotalData.length; i++) {
                                            issuedDate.push(shopIssuedCouponTotalData[i].ISSUED_DATE);
                                            tempIssuedCoupon.push(shopIssuedCouponTotalData[i].ISSUED_CNT);
                                        }

                                        for(var i=0; i<shopUsedCouponTotalData.length; i++) {
                                            usedDate.push(shopUsedCouponTotalData[i].USED_DATE);
                                            tempUsedCoupon.push(shopUsedCouponTotalData[i].USED_CNT);
                                        }

                                        for(var i=0; i<shopWeeklyData.length; i++) {
                                            viewDate.push(shopWeeklyData[i].VIEW_DATE);
                                            if(i == (shopWeeklyData.length -1)) {
                                                today = shopWeeklyData[i].WEEKLY_DATE;
                                            }

                                            if((issuedDate.indexOf(shopWeeklyData[i].WEEKLY_DATE) > -1)) {
                                                var indexIssued = issuedDate.indexOf(shopWeeklyData[i].WEEKLY_DATE);
                                                issuedCoupon.push(tempIssuedCoupon[indexIssued]);
                                            }else {
                                                issuedCoupon.push(0);
                                            }

                                            if((usedDate.indexOf(shopWeeklyData[i].WEEKLY_DATE) > -1)) {
                                                var indexUsed = usedDate.indexOf(shopWeeklyData[i].WEEKLY_DATE);
                                                usedCoupon.push(tempUsedCoupon[indexUsed]);
                                            }else {
                                                usedCoupon.push(0);
                                            }

                                        }

                                        for(var i=0; i<shopCouponIssuedTodayData.length; i++) {
                                            var tempId = shopCouponIssuedTodayData[i].USER_ID;
                                            shopCouponIssuedTodayData[i].USER_ID = decryptUid(tempId);
                                        }

                                        res.status(200);
                                        res.render('common/papa-admin',{view:'coupon', url:config.url, shopId:shopId, userEmail:userEmail, shopName: shopName, shopIcon: shopIcon, today:today,
                                            shopCouponTodayData:shopCouponIssuedTodayData, viewDate:viewDate, issuedCoupon:issuedCoupon, usedCoupon:usedCoupon});
                                    }
                                });
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
    // logger.info(TAG, 'Get shop data');
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
        var selectUserCouponQuery = 'select USER_ID, COUPON_NUMBER, USED_YN, DEL_YN, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as ISSUED_DATE, DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE ' +
            'from SB_USER_COUPON where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' +mysql.escape(encryptUid(userNumber)) + ' and MAPPING_YN = "Y"';
            if(usedYn != "ALL") {
                selectUserCouponQuery += " and USED_YN = '"+ usedYn +"'";
            }
            if(delYn != "ALL") {
                selectUserCouponQuery += " and DEL_YN = '" + delYn + "'";
            }
        selectUserCouponQuery += " order by ISSUED_DATE desc";
        connection.query(selectUserCouponQuery, function (err, userCouponData) {
            if (err) {
                logger.error(TAG, 'Select user coupon data error', err);
                res.status(400);
                res.send('Select user coupon data error');
            } else {
                logger.debug('Select user coupon data success : ' + JSON.stringify(userCouponData));
                for(var i=0; i<userCouponData.length; i++) {
                    var tempId = userCouponData[i].USER_ID;
                    userCouponData[i].USER_ID = decryptUid(tempId);
                }

                res.status(200);
                res.send({userCouponData: userCouponData});
            }
            connection.release();
        });
    });
});

//Get User Data
router.get('/period-data', function(req, res, next) {
    // logger.info(TAG, 'Get shop data');
    var shopId = req.headers.shop_id;
    var startDate = req.query.start_date;
    var endDate = req.query.end_date;
    var usedYn = req.query.used_yn;
    var delYn = req.query.del_yn;

    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Start Date : ' + startDate);
    logger.debug(TAG, 'End Date : ' + endDate);
    logger.debug(TAG, 'User yn : ' + usedYn);
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
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as ISSUED_DATE, DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE from SB_USER_COUPON ' +
                    'where ISSUED_DT between "'+ paramStartDate + '" and DATE_FORMAT(DATE_ADD("' + paramEndDate + '",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) +' and MAPPING_YN = "Y"';
            }else {
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as ISSUED_DATE, DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE from SB_USER_COUPON ' +
                    'where ISSUED_DT between "'+ paramStartDate + '" and DATE_FORMAT(DATE_ADD("'+ paramStartDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = '+ mysql.escape(shopId) +' and MAPPING_YN = "Y"';
            }
        }else {
            if(endDate.length > 0) {
                paramEndDate = endDate.substr(6, 4) +'-'+ endDate.substr(3, 2) +'-'+ endDate.substr(0, 2);
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as ISSUED_DATE, DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE from SB_USER_COUPON ' +
                    'where ISSUED_DT between "'+ paramEndDate + '" and DATE_FORMAT(DATE_ADD("'+ paramEndDate +'",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = '+ mysql.escape(shopId) +' and MAPPING_YN = "Y"';
            }else {
                selectPeriodDataQuery = 'select USER_ID, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as ISSUED_DATE, DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE from SB_USER_COUPON ' +
                    'where ISSUED_DT >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) +' and MAPPING_YN = "Y"';
            }
        }
        if(usedYn != "ALL") {
            selectPeriodDataQuery += ' and USED_YN = "' + usedYn + '"';
        }
        if(delYn != "ALL") {
            selectPeriodDataQuery += ' and DEL_YN = "' + delYn + '"';
        }
        selectPeriodDataQuery += ' order by ISSUED_DT';

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

router.get('/manager', function(req, res, next) {
    var shopId = req.query.shop_id;
    var shopName = req.query.shop_name;
    var shopIcon = req.query.shop_icon;
    var userEmail = req.query.user_email;

    getConnection(function (err, connection) {
        var selectCouponUsedListQuery = 'select USER_ID, COUPON_NUMBER, USED_YN, DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as ISSUED_DATE ' +
            'from SB_USER_COUPON where SHOP_ID = ' + mysql.escape(shopId) + ' and MAPPING_YN = "Y" group by COUPON_NUMBER order by ISSUED_DATE desc';
        connection.query(selectCouponUsedListQuery, function (err, couponUsedListData) {
            if (err) {
                console.error("*** initPage select id Error : " , err);
                res.status(400);
                res.send('Select user push history error');
            }else {
                logger.debug('Select coupon used list data success : ' + JSON.stringify(couponUsedListData));
                var selectCouponIssuedListQuery = 'select COUPON_NUMBER, COUPON_NAME, COUPON_PRICE, EXPIRATION_DT ' +
                    'from SB_USER_COUPON where SHOP_ID = ' + mysql.escape(shopId) + ' and MAPPING_YN = "N" group by COUPON_NUMBER order by REG_DT desc';
                connection.query(selectCouponIssuedListQuery, function (err, couponIssuedListData) {
                    if (err) {
                        console.error("*** initPage select id Error : ", err);
                        res.status(400);
                        res.send('Select user push history error');
                    } else {
                        var selectCurrentQuery = 'select DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d") as TODAY';
                        connection.query(selectCurrentQuery, function (err, selectCurrentData) {
                            if (err) {
                                console.error("*** initPage select id Error : ", err);
                                res.status(400);
                                res.send('Select user push history error');
                            } else {

                                for(var i=0; i<couponUsedListData.length; i++) {
                                    var tempId = couponUsedListData[i].USER_ID;
                                    couponUsedListData[i].USER_ID = decryptUid(tempId);
                                }

                                res.status(200);
                                res.render('common/papa-admin',{view:'manager', url:config.url, shopId:shopId, userEmail:userEmail, shopName: shopName, shopIcon: shopIcon,  today:selectCurrentData[0].TODAY, couponUsedListData:couponUsedListData, couponIssuedListData:couponIssuedListData});
                            }
                        });
                    }
                });
            }
            connection.release();
        });
    });
});

router.post('/createCoupon', function(req, res, next) {
    var shopId = req.headers.shop_id;
    logger.debug(TAG, 'Shop id : ' + shopId);

    var couponCount = req.body.coupon_count;
    var couponNumber = req.body.coupon_number;
    var couponName = req.body.coupon_name;
    var couponPrice = req.body.coupon_price;

    couponPrice = Number(couponPrice.replace("원","").replace(",",""));
    var couponNumberSplit = couponNumber.split("\n");

    logger.debug(TAG, 'Shop id : ' + shopId);
    logger.debug(TAG, 'Coupon Count: ' + couponCount);
    logger.debug(TAG, 'Coupon Number : ' + couponName);
    logger.debug(TAG, 'Coupon Price : ' + couponPrice);

    /*    if(shopId == null || shopId == undefined &&
     userId == null || userId == undefined) {
     logger.debug(TAG, 'Invalid id parameter error');
     res.status(400);
     res.send('Invalid id parameter error');
     }*/

    getConnection(function (err, connection) {
        var selectCouponImgQuery = 'select SHOP_BACK_IMG from SB_SHOP_INFO where  SHOP_ID = ' + mysql.escape(shopId);
        connection.query(selectCouponImgQuery, function (err, couponImgData) {
            if (err) {
                console.error("*** initPage select id Error : ", err);
                res.status(400);
                res.send('Select user push history error');
            } else {
                var inputData = '';
                var inputLength = couponNumberSplit.length;
                for(var i=0; i<inputLength; i++) {
                    if(i != (inputLength - 1)) {
                        inputData += '("'+ shopId +'", "'+couponImgData[0].SHOP_BACK_IMG+'", "' + couponNumberSplit[i] + '", "' + couponName + '", ' + couponPrice + '), ';
                    }else {
                        inputData += '("'+ shopId +'", "'+couponImgData[0].SHOP_BACK_IMG+'", "' + couponNumberSplit[i] + '", "' + couponName + '", ' + couponPrice + ')';
                    }
                }
                var selectCouponListQuery = 'insert into SB_USER_COUPON (SHOP_ID, COUPON_IMG, COUPON_NUMBER, COUPON_NAME, COUPON_PRICE) value ' + inputData;
                connection.query(selectCouponListQuery, function (err, couponListData) {
                    if (err) {
                        console.error("*** initPage select id Error : " , err);
                        res.status(400);
                        res.send('Select user push history error');
                    }else {
                        res.status(200);
                        res.send({resultData: 'Insert coupon data success'});
                    }
                });
            }
            connection.release();
        });
    });
});

module.exports = router;