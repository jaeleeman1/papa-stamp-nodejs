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
    var shopId = req.query.shop_id;
    var shopName = req.query.shop_name;
    var shopIcon = req.query.shop_icon;
    var userEmail = req.query.user_email;

    getConnection(function (err, connection) {
        //Grgaph daily data
        var selectCouponTotalQuery = 'select count(USER_ID) as ISSUED_CNT, USER_ID, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as COMPARE_DATE ' +
            'from SB_USER_COUPON where ISSUED_DT > date_add(now(),interval -10 day) ' +
            'and SHOP_ID = ' + mysql.escape(shopId) + ' and MAPPING_YN="Y" ' +
            'group by COMPARE_DATE';
        connection.query(selectCouponTotalQuery, function (err, shopCouponTotalData) {
            if (err) {
                console.error("*** initPage select id Error : " , err);
                res.status(400);
                res.send('Select user push history error');
            }else {
                console.log('Select user push history success : ' + JSON.stringify(shopCouponTotalData));
                //Today data
                var selectCouponTodayQuery = 'select USER_ID, MAPPING_YN, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_COUPON ' +
                    'where SHOP_ID = ' + mysql.escape(shopId) + ' and MAPPING_YN="Y" and ISSUED_DT >= DATE_FORMAT(CURRENT_DATE(), "%Y-%m-%d") group by ISSUED_DT desc';
                connection.query(selectCouponTodayQuery, function (err, shopsCouponTodayData) {
                    if (err) {
                        console.error("*** initPage select id Error : " , err);
                        res.status(400);
                        res.send('Select stamp shop list error');
                    }else {
                        console.log('Select coupon list success : ' + JSON.stringify(shopsCouponTodayData));
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
                                var couponDate = [];

                                var tempViewStamp = [];

                                var viewCoupon = [];

                                for(var i=0; i<shopCouponTotalData.length; i++) {
                                    couponDate.push(shopCouponTotalData[i].COMPARE_DATE);
                                    tempViewStamp.push(shopCouponTotalData[i].ISSUED_CNT);
                                }

                                for(var i=0; i<shopWeeklyData.length; i++) {
                                    viewDate.push(shopWeeklyData[i].VIEW_DATE);
                                    if(i == (shopWeeklyData.length -1)) {
                                        today = shopWeeklyData[i].WEEKLY_DATE;
                                    }

                                    if((couponDate.indexOf(shopWeeklyData[i].WEEKLY_DATE) > -1)) {
                                        var index = couponDate.indexOf(shopWeeklyData[i].WEEKLY_DATE);
                                        viewCoupon.push(tempViewStamp[index]);
                                    }else {
                                        viewCoupon.push(0);
                                    }
                                }

                                for(var i=0; i<shopsCouponTodayData.length; i++) {
                                    var tempId = shopsCouponTodayData[i].USER_ID;
                                    shopsCouponTodayData[i].USER_ID = decryptUid(tempId);
                                }

                                res.status(200);
                                res.render('common/papa-admin',{view:'coupon', url:config.url, shopId:shopId, userEmail:userEmail, shopName: shopName, shopIcon: shopIcon, today:today, shopsCouponTodayData:shopsCouponTodayData, viewDate:viewDate, viewCoupon:viewCoupon});
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
    logger.debug(TAG, 'Shop id : ' + shopId);

    var userNumber = req.query.user_number;
    var mappingYn = req.query.mapping_yn;
    var usedYn = req.query.used_yn;
    var delYn = req.query.del_yn;
    // logger.debug(TAG, 'User id : ' + userId);

    if(userNumber == null || userNumber == undefined) {
        // logger.debug(TAG, 'Invalid user id error');
        res.status(400);
        res.send('Invalid parameter error');
    }

    //Shop Data API
    getConnection(function (err, connection) {
        var selectUserCouponQuery = 'select USER_ID, COUPON_NUMBER, MAPPING_YN, USED_YN, DEL_YN, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_COUPON ' +
            'where SHOP_ID = ' + mysql.escape(shopId) + ' and USER_ID = ' +mysql.escape(encryptUid(userNumber));
            if(mappingYn != "ALL") {
                selectUserCouponQuery += " and MAPPING_YN = '"+ usedYn +"'";
            }
            if(usedYn != "ALL") {
                selectUserCouponQuery += " and USED_YN = '"+ usedYn +"'";
            }
            if(delYn != "ALL") {
                selectUserCouponQuery += " and DEL_YN = '" + delYn + "'";
            }
        selectUserCouponQuery += " group by ISSUED_DT desc";
        connection.query(selectUserCouponQuery, function (err, userData) {
            if (err) {
                console.error("Select shop data Error : ", err);
                res.status(400);
                res.send('Select shop data error');
            } else {
                // logger.debug(TAG, 'Select shop data success : ' + JSON.stringify(userData));
                for(var i=0; i<userData.length; i++) {
                    var tempId = userData[i].USER_ID;
                    userData[i].USER_ID = decryptUid(tempId);
                }

                res.status(200);
                res.send({userData: userData});
            }
            connection.release();
        });
    });
});

//Get User Data
router.get('/period-data', function(req, res, next) {
    // logger.info(TAG, 'Get shop data');
    var shopId = req.headers.shop_id;
    logger.debug(TAG, 'Shop id : ' + shopId);

    var startDate = req.query.start_date;
    var endDate = req.query.end_date;
    var mappingYn = req.query.mapping_yn;
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
                selectPeriodDataQuery = 'select USER_ID, MAPPING_YN, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_COUPON ' +
                    'where ISSUED_DT between "'+ paramStartDate + '" and DATE_FORMAT(DATE_ADD("' + paramEndDate + '",INTERVAL +1 day), "%Y-%m-%d") and SHOP_ID = ' + mysql.escape(shopId) +
                    "and MAPPING_YN = '"+ mappingYn + "' and USED_YN = '" + usedYn + "' and DEL_YN = '"+ delYn + "' group by VISIT_DATE";
            }else {
                selectPeriodDataQuery = 'select USER_ID, MAPPING_YN, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_COUPON ' +
                    "where ISSUED_DT between '"+ paramStartDate +"' and DATE_FORMAT(DATE_ADD('"+ paramStartDate +"',INTERVAL +1 day),'%Y-%m-%d') and SHOP_ID = 'SB-SHOP-00001' " +
                    "and MAPPING_YN = '"+ mappingYn + "' and USED_YN = '" + usedYn + "' and DEL_YN = '"+ delYn + "' group by VISIT_DATE";
            }
        }else {
            if(endDate.length > 0) {
                paramEndDate = endDate.substr(6, 4) +'-'+ endDate.substr(3, 2) +'-'+ endDate.substr(0, 2);
                selectPeriodDataQuery = 'select USER_ID, MAPPING_YN, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_COUPON ' +
                    "where ISSUED_DT between '"+ paramEndDate +"' and DATE_FORMAT(DATE_ADD('"+ paramEndDate +"',INTERVAL +1 day),'%Y-%m-%d') and SHOP_ID = 'SB-SHOP-00001' " +
                    "and MAPPING_YN = '"+ mappingYn + "' and USED_YN = '" + usedYn + "' and DEL_YN = '"+ delYn + "' group by VISIT_DATE";
            }else {
                selectPeriodDataQuery = 'select USER_ID, MAPPING_YN, USED_YN, DEL_YN, COUPON_NUMBER, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d") as VIEW_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as VISIT_DATE from SB_USER_COUPON ' +
                    "where SHOP_ID = 'SB-SHOP-00001' and MAPPING_YN='Y' and ISSUED_DT >= DATE_FORMAT(CURRENT_DATE(),'%Y-%m-%d') group by ISSUED_DT desc";
            }
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

router.get('/manager', function(req, res, next) {
    var shopId = req.query.shop_id;
    var shopName = req.query.shop_name;
    var shopIcon = req.query.shop_icon;
    var userEmail = req.query.user_email;

    getConnection(function (err, connection) {
        var selectCouponUsedListQuery = 'select USER_ID, COUPON_NUMBER, USED_YN, DATE_FORMAT(USED_DT, "%Y-%m-%d %h:%i:%s") as USED_DATE, DATE_FORMAT(ISSUED_DT, "%Y-%m-%d %h:%i:%s") as ISSUED_DATE ' +
            'from SB_USER_COUPON where SHOP_ID = ' + mysql.escape(shopId) + ' and MAPPING_YN = "Y" group by COUPON_NUMBER order by ISSUED_DATE desc';
        console.log(selectCouponUsedListQuery);
        connection.query(selectCouponUsedListQuery, function (err, couponUsedListData) {
            if (err) {
                console.error("*** initPage select id Error : " , err);
                res.status(400);
                res.send('Select user push history error');
            }else {
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
        var selectCouponImgQuery = 'select SHOP_FRONT_IMG from SB_SHOP_INFO where  SHOP_ID = ' + mysql.escape(shopId);
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
                        inputData += '("'+ shopId +'", "'+couponImgData[0].SHOP_FRONT_IMG+'", "' + couponNumberSplit[i] + '", "' + couponName + '", ' + couponPrice + '), ';
                    }else {
                        inputData += '("'+ shopId +'", "'+couponImgData[0].SHOP_FRONT_IMG+'", "' + couponNumberSplit[i] + '", "' + couponName + '", ' + couponPrice + ')';
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
