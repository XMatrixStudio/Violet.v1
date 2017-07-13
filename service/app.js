const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./mongo.js');
const verify = require('./sdk/verify.js');
const User = require('./user.js');
const cookieParser = require('cookie-parser'); // cookie模块
app.use(cookieParser()); // cookie模块
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = app.listen(30020, '127.0.0.1', function() {
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

app.get('/', (req, res) => {
  res.send('User authorization system is running');
});

app.post('/register', User.register); // 注册
app.post('/login', User.login); // 登陆
app.post('/getCode', User.getCode); //获取验证码
app.post('/reset', User.reset); //重置密码
app.post('/getUser', verify.checkToken, User.getUser); //获取网站信息
app.post('/auth', verify.checkToken, User.auth); //授权登陆
app.post('/logout', verify.logout); // 退出登陆
app.post('/validEmail', User.validEmail); // 激活邮箱

app.post('/getInfo', User.getInfo); // 获取用户信息