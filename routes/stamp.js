var express = require('express');
var router = express.Router();
var config = require('../config/service_config');
var getConnection = require('../config/db_connection');
var logger = require('../config/logger');
var mysql = require('mysql');
var http = require('http');
var path = require('path');

const TAG = "[TABLET INFO] ";

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
    res.render('common/papa-stamp', {view: 'stamp', url:config.url, userId:'7c28d1c5088f01cda7e4ca654ec88ef8', shopID:'0001', cardCnt:8, stampCnt:2});
});


router.get('/stampList/:user_id', function (req, res, next) {
    io.sockets.emit('aa', {sendData: "API papa stamp success!"});
    res.send({ shopID:'0001', stampCnt:2});
});

module.exports = router;
