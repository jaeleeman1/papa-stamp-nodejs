var express = require('express');
var router = express.Router();

const TAG = '[USER INFO] ';

//Get User Location
router.get('/userLocation', function (req, res, next) {
    logger.info(TAG, 'Get user location');

    var userId = req.headers.user_id;
    logger.debug(TAG, 'User id : ' + userId);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id parameter error');
        res.status(400);
        res.send('Invalid user id parameter error');
    }

    getConnection(function (err, connection){
        var selectUserLocationQuery = 'select SUI.CURRENT_LAT, SUI.CURRENT_LNG from SB_USER_INFO as SUI ' +
            'where SUI.USER_ID =' + mysql.escape(userId);
        connection.query(selectUserLocationQuery, function (err, userLocationData) {
            if (err) {
                logger.error(TAG, "Select user location error : " + err);
                res.status(400);
                res.send('Select user location error');
            }else{
                logger.debug(TAG, 'Select user location success : ' + JSON.stringify(userLocationData));
                res.status(200);
                res.send({userLocationData:userLocationData[0]});
            }
            connection.release();
        });
    });
});

//Get Shop Beacon
router.get('/beaconToShopId', function (req, res, next) {
    logger.info(TAG, 'Get shop beacon');

    var beaconId = req.body.beacon_id;
    logger.debug(TAG, 'Beacon id : ' + beaconId);

    if(beaconId == null || beaconId == undefined) {
        logger.debug(TAG, 'Invalid beacon id parameter error');
        res.status(400);
        res.send('Invalid beacon id parameter error');
    }

    getConnection(function (err, connection){
        var selectBeaconIdQuery = 'select SHOP_ID from SB_SHOP_INFO as SSI ' +
            'where SSI.SHOP_BEACON =' + mysql.escape(beaconId);
        connection.query(selectBeaconIdQuery, function (err, beaconIdData) {
            if (err) {
                logger.error(TAG, "Select beacon id error : " + err);
                res.status(400);
                res.send('Select beacon id error');
            }else{
                logger.debug(TAG, 'Select beacon id success : ' + JSON.stringify(beaconIdData));
                res.status(200);
                res.send({beaconIdData:beaconIdData[0]});
            }
            connection.release();
        });
    });
});

module.exports = router;