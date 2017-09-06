/*

模块功能： Violet 客户端 SDK

配置文件： violet.json - host

*/
// 使用前准备
const userDB = require('../user.js').db; //授权数据库
//
const fs = require('fs'); //文件处理
const config = JSON.parse(fs.readFileSync('./config/violet.json')); // 配置文件
const https = require('https'); // https模块
const queryString = require("querystring"); // 转化为格式化对象
const crypto = require('crypto');
const cookieParser = require('cookie-parser'); // cookie模块

//内部方法函数

function makeUserToken(req, res, userData, callback) { //设置cookies信息
  res.cookie('remember', req.cookies.remember, { expires: new Date(Date.now() + 8640000000), httpOnly: false });
  res.cookie('isLogin', true, { expires: new Date(Date.now() + 8640000000), httpOnly: false });
  if (req.cookies.remember == 'true') {
    res.cookie('token', exports.encrypt(userData), { expires: new Date(Date.now() + 8640000000), httpOnly: true });
  } else {
    res.cookie('token', exports.encrypt(userData), { expires: 0, httpOnly: true });
  }
  if (callback !== undefined) callback();
}

function makeToken() { // 生成网站令牌
  var token = config.webId + '&' + exports.getNowTime();
  token = exports.encrypt(token);
  return token;
}

function DBToken(res, uid, oldToken, newToken, callback) { // 更新数据库token
  userDB.findOne({ uid: uid }, (err, val) => {
    if (val === null) {
      callback('NO_USER');
    } else if (val.token != oldToken) {
      callback('ERR_TOKEN');
    } else {
      res.locals.userData = val;
      val.token = newToken;
      val.save((err) => {});
      callback('OK');
    }
  });
}

function postToViolet(path, data, callback) { // 与 violet 服务器通讯
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
        return callback({ state: 'ok', userData: JSON.parse(d.toString('utf8')) });
      } else {
        return callback({ state: 'failed', reason: d.toString('utf8') });
      }
    });
  });
  req.write(postData);
  req.on('error', (e) => {
    return callback({ state: 'failed', reason: e });
  });
  req.end();
}

// 以下为SDK提供的接口

exports.encrypt = (json, key) => { // 使用key加密数据
  let myKey = key;
  if (myKey === undefined) myKey = config.key;
  var cipher = crypto.createCipher('aes192', myKey);
  var enc = cipher.update(JSON.stringify(json), 'utf8', 'hex');
  enc += cipher.final('hex');
  enc += 'o' + exports.makeAMD5(enc).slice(20);
  return enc;
}; // 加密数据

exports.decrypt = (str, key) => { // 使用key解密数据
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

exports.makeASha = function(str, sign) { // 使用key散列数据 - SHA512
  let mySign = sign;
  if (sign === undefined) mySign = config.key;
  var hashSHA = crypto.createHash('sha512');
  hashSHA.update(str + mySign);
  return hashSHA.digest('hex');
}; // 散列

exports.makeAMD5 = function(str, sign) { // 使用key散列数据 - MD5
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
    DBToken(res, data[0], data[2], token, (str) => {
      if (str == 'OK') {
        let userData = data[0] + '&' + exports.getNowTime() + '&' + token;
        makeUserToken(req, res, userData, () => {
          next();
        });
      } else {
        res.send({ state: 'failed', reason: 'ERR_TOKEN' });
        next('route');
      }
    });
  }
};

exports.setCookies = (res, name, data, time, callback) => { // 设置cookies
  res.cookie(name, data, { expires: new Date(Date.now() + time * 1000), httpOnly: false });
  if (callback !== undefined) callback();
};

exports.getLoginState = (req) => { //获取登陆状态
  return req.cookies.token !== undefined;
};

exports.logout = (req, res, next) => { // 退出登陆
  res.cookie('isLogin', false, { expires: new Date(Date.now() + 8640000000), httpOnly: false });
  res.clearCookie('token');
  res.send({ state: 'ok' });
  next('route');
};

exports.getUserInfo = (token, callback) => { //使用授权码获取用户信息
  postToViolet('/api/getInfo', { sid: config.webId, userToken: token, webToken: makeToken() }, (data) => {
    if (data.state == 'failed') console.log('ERR: ' + data.reason);
    callback(data);
  });
};

exports.makeNewToken = (req, res, uid, callback) => { // 生成用户 token 并以 httpOnly 模式写入 cookies， 用于用户登陆
  let token = Math.round(Math.random() * 1000000);
  userDB.findOne({ uid: uid }, (err, val) => {
    val.token = token;
    val.save((err) => {});
    let userData = uid + '&' + exports.getNowTime() + '&' + token;
    makeUserToken(req, res, userData, () => {
      callback();
    });
  });
};