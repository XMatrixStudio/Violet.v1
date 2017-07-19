const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const verify = require('./sdk/verify.js');
const User = require('./user.js');
const cookieParser = require('cookie-parser'); // cookie模块
app.use(cookieParser()); // cookie模块
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = app.listen(30002, '127.0.0.1', function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});
//日志处理
app.use((req, res, next) => {
  var nowTime = new Date();
  console.log('Time:' + nowTime + '|| Form' + req.url + '||' + req.headers.referer);
  next();
});

app.post('/login', User.login);