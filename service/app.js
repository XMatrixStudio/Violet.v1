const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./mongo.js');
const verify = require('./sdk/verify.js');
const User = require('./user.js');
const Site = require('./site.js');
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
//登陆前API
app.post('/register', User.register); // 注册
app.post('/login', User.login); // 登陆
app.post('/getCode', User.getCode); //获取验证码
app.post('/reset', User.reset); //重置密码
app.post('/validEmail', User.validEmail); // 激活邮箱
app.post('/getInfo', User.getInfo); // 获取用户信息（通过授权码）
//登陆后API
app.post('/getUser', verify.checkToken, User.getUser); //获取网站信息
app.post('/auth', verify.checkToken, User.auth); //授权登陆
app.post('/logout', verify.logout); // 退出登陆
//用户中心专属
app.post('/getUserInfo', verify.checkToken, User.mGetUserInfo); //获取用户信息
app.post('/noAuth', verify.checkToken, User.noAuth); //取消授权
app.post('/setUserInfo', verify.checkToken, User.mSetUserInfo); //修改用户信息
app.post('/getWebInfo', verify.checkToken, Site.getWebInfo); //获取网站信息
app.post('/setWebInfo', verify.checkToken, Site.setWebInfo); //设置网站信息
app.post('/addSite', verify.checkToken, Site.addSite); //增加网站
app.post('/changeKey', verify.checkToken, Site.changeKey); //更改密钥