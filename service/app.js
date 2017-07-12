const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./mongo.js');
const verify = require('sdk/verify.js');
const User = require('./user.js');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = app.listen(30020, '127.0.0.1', function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});

app.get('/', (req, res) => {
  res.send('User authorization system is running');
});

app.post('/register', User.register);
app.post('/login', User.login);
app.post('/getCode', User.getCode);
app.post('/reset', User.reset);
app.post('/auth', verify.checkToken, User.auth);
app.post('/getInfo', User.getInfo);
// todo
/*
  1. 注册 done
  2. 登陆
      2.1 直接post登陆
      2.2 网站服务器post登陆
      2.3 授权码登陆
  3. 邮箱认证get
  4. 发送邮件验证码
  5. 发送激活邮件
  6. 重置密码
  7. 授权码验证
  8. 邮件系统
*/