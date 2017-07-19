/*

模块功能： Violet 客户端 SDK

配置文件： violet.json - host

API:
-----------
post(path, data, callback(result)) 向认证服务器发送信息
@param path : 请求服务类型 []
@param data : 数据主体
@param callback(result) : 返回请求结果
@具体服务类型和返回数据结构请查看相关文档
******
example code :
exports.post('/user/post', { data: 'hello, world' }, (data) => {
  console.log(data);
});
----------
*/

const fs = require('fs'); //文件处理
const config = JSON.parse(fs.readFileSync('./config/violet.json'));
const https = require('https'); // https模块
const queryString = require("querystring"); // 转化为格式化对象
const crypto = require('crypto');
const cookieParser = require('cookie-parser'); // cookie模块
const userMod = require('../user.js');


exports.post = (path, data, callback) => {
  let postData = queryString.stringify(data);
  let options = {
    hostname: config.host,
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      "Content-Type": 'application/x-www-form-urlencoded',
      "Content-Length": postData.length
    }
  };
  let req = https.request(options, (res) => {
    if (res.statusCode != '200') {
      return callback({ state: 'failed', reason: res.statusCode });
    }
    res.on('data', (d) => {
      if (d.toString('ascii').indexOf('"state":"ok"') != -1) {
        return callback({ state: 'ok', data: JSON.parse(d.toString('ascii')) });
      } else {
        return callback({ state: 'failed', reason: d.toString('ascii') });
      }
    });
  });
  req.write(postData);
  req.on('error', (e) => {
    return callback({ state: 'failed', reason: e });
  });
  req.end();
};

exports.encrypt = (json, key) => {
  let myKey = key;
  if (myKey === undefined) myKey = config.key;
  var cipher = crypto.createCipher('aes192', myKey);
  var enc = cipher.update(JSON.stringify(json), 'utf8', 'hex');
  enc += cipher.final('hex');
  enc += 'o' + exports.makeAMD5(enc).slice(20);
  return enc;
}; // 加密数据

exports.decrypt = (str, key) => {
  let myKey = key;
  if (myKey === undefined) myKey = config.key;
  var data = str.split('o');
  if (exports.makeAMD5(data[0], myKey).slice(20) == data[1]) {
    var decipher = crypto.createDecipher('aes192', myKey);
    var dec = decipher.update(data[0], 'hex', 'utf8');
    dec += decipher.final('utf8');
    var reg = new RegExp('"', "g");
    dec = dec.replace(reg, "");
    return dec;
  } else {
    return 'ERR';
  } //解密数据
};

exports.makeASha = function(str, sign) {
  let mySign = sign;
  if (sign === undefined) mySign = config.key;
  var hashSHA = crypto.createHash('sha512');
  hashSHA.update(str + mySign);
  return hashSHA.digest('hex');
}; // 散列

exports.makeAMD5 = function(str, sign) {
  let mySign = sign;
  if (sign === undefined) mySign = config.key;
  var hashSHA = crypto.createHash('md5');
  hashSHA.update(str + mySign);
  return hashSHA.digest('hex');
}; // 散列

exports.getUserId = (res) => { //获取用户id
  return res.locals.userData.uid;
};

exports.getUserEmail = (res) => {
  return res.locals.userData.email;
};

exports.getUserName = (res) => {
  return res.locals.userData.name;
};
exports.getUserData = (res) => {
  return res.locals.userData;
};

exports.getNowTime = () => { //当前时间
  return Math.ceil(((new Date()).getTime() - 1499860673563) / 1000);
};

exports.comTime = (time) => { //比较时间
  return exports.getNowTime() - Math.ceil((time.getTime() - 1499860673563) / 1000);
};

exports.checkToken = (req, res, next) => { // 检测token
  let token = req.cookies.token;
  if (token === undefined || token === null) {
    res.send({ state: 'failed', reason: 'ERR_TOKEN' });
    next('route');
    return;
  }
  token = exports.decrypt(token);
  let data = token.split('&');
  if (data[0] === undefined || data[1] === undefined) {
    res.send({ state: 'failed', reason: 'ERR_TOKEN' });
    next('route');
  } else if ((exports.getNowTime() - data[1]) > 864000) {
    res.send({ state: 'failed', reason: 'TIMEOUT' });
    next('route');
  } else {
    let token = Math.round(Math.random() * 1000000);
    userMod.DBToken(res, data[0], data[2], token, (str) => {
      if (str == 'OK') {
        let userData = data[0] + '&' + exports.getNowTime() + '&' + token;
        exports.makeUserToken(req, res, userData, () => {
          next();
        });
      } else {
        res.send({ state: 'failed', reason: 'ERR_TOKEN' });
        next('route');
      }
    });
  }
};

exports.makeUserToken = (req, res, userData, callback) => { //设置cookies信息
  res.cookie('remember', req.cookies.remember, { expires: new Date(Date.now() + 8640000000), httpOnly: false });
  res.cookie('isLogin', true, { expires: new Date(Date.now() + 8640000000), httpOnly: false });
  if (req.cookies.remember == 'true') {
    res.cookie('token', exports.encrypt(userData), { expires: new Date(Date.now() + 8640000000), httpOnly: true });
  } else {
    res.cookie('token', exports.encrypt(userData), { expires: 0, httpOnly: true });
  }
  if (callback !== undefined) callback();
};


exports.logout = (req, res, next) => { // 退出登陆
  res.cookie('isLogin', false, { expires: new Date(Date.now() + 8640000000), httpOnly: false });
  res.clearCookie('token');
  res.send({ state: 'ok' });
  next('route');
};

exports.makeToken = () => { // 生成网站令牌
  var token = config.webId + '&' + exports.getNowTime();
  token = exports.encrypt(token);
  return token;
};

exports.getUserInfo = (token, callback) => { //获取用户信息
  exports.post('/api/getInfo', { userToken: token, webToken: exports.makeToken() }, (data) => {
    if (data.state == 'failed') console.log('ERR: ' + data.reason);
    callback(data);
  });
};