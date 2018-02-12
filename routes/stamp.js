var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var http = require('http');
var path = require('path');

const TAG = "[STAMP INFO] ";

//Setting Socket.io
var app = express();
app.use(express.static(path.join(__dirname, 'public')));

var httpServer =http.createServer(app).listen(8060, function(req,res){
    logger.debug(TAG, 'Socket IO server has been started');
});

var io = require('socket.io').listen(httpServer);
io.sockets.on('connection',function(socket){
    socket.on('shopClient',function(data){
        logger.debug(TAG, 'Socket papa stamp success! : '+data.userData);
        io.sockets.emit(data.userData,'Send message success!');
    })
});

/* GET stamp page. */
router.get('/main', function(req, res, next) {
    logger.info(TAG, 'Get my shop information');

    var userId = req.query.userId;
    var currentLat = '37.650804099999995';//req.body.latitude;
    var currentLng = '126.88645269999999';//req.body.longitude;
    logger.debug(TAG, 'User ID : ' + userId);
    logger.debug(TAG, 'Current Latitude : ' + currentLat);
    logger.debug(TAG, 'Current Longitude : ' + currentLng);

    if(userId == null || userId == undefined) {
        logger.debug(TAG, 'Invalid user id error');
        res.status(400);
        res.send('Invalid user id error');
    }

    if(currentLat == null || currentLat == undefined ||
        currentLng == null || currentLng == undefined) {
        logger.debug(TAG, 'Invalid parameter');
        res.status(400);
        res.send('Invalid parameter error');
    }

    getConnection(function (err, connection){
        var selectShopList = 'select SUPI.USER_STAMP, SSI.SHOP_STAMP_IMG, SSI.SHOP_FRONT_IMG, SSI.SHOP_BACK_IMG, ( 3959 * acos( cos( radians('+currentLat+') ) * cos( radians(SHOP_LAT) ) ' +
            '* cos( radians(SHOP_LNG) - radians('+currentLng+') ) + sin( radians('+currentLat+') ) ' +
            '* sin( radians(SHOP_LAT) ) ) ) AS distance ' +
            'from SB_SHOP_INFO as SSI ' +
            'inner join SB_USER_PUSH_INFO as SUPI on SSI.SHOP_ID = SUPI.SHOP_ID ' +
            'where SUPI.USER_ID = "'+ userId + '"' +
            'having distance < 25 ' +
            'order by distance limit 0, 10';
        connection.query(selectShopList, function (err, shopListData) {
            if (err) {
                logger.error(TAG, "DB select shop list error : " + err);
                res.status(400);
                res.send('Select shop list error');
            }else{
                logger.debug(TAG, 'Select shop list success : ' + JSON.stringify(shopListData));
                res.status(200);
                res.render('common/papa-stamp', {view:'stamp', url:config.url, userId:userId, shopListData:shopListData});
            }
            connection.release();
        });
    });
    // res.render('common/papa-stamp', {view: 'stamp', url:config.url, userId:'7c28d1c5088f01cda7e4ca654ec88ef8', shopID:'0001', cardCnt:8, stampCnt:2});
});


router.get('/stampList/:user_id', function (req, res, next) {
    io.sockets.emit('aa', {sendData: "API papa stamp success!"});
    res.send({ shopID:'0001', stampCnt:2});
});

module.exports = router;
