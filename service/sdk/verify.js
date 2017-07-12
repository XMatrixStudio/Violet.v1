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
const config = JSON.parse(fs.readFileSync('../config/violet.json'));
const https = require('https'); // https模块
const queryString = require("querystring"); // 转化为格式化对象
const crypto = require('crypto');
const cookieParser = require('cookie-parser'); // cookie模块
const userMod = require('../user.js')


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
    if (res.statusCode = !'200') {
      return callback({ state: 'failed', result: res.statusCode });
    }
    res.on('data', (d) => {
      if (d.toString('ascii').indexOf('"state":"ok"') != -1) {
        return callback({ state: 'success', data: d.toString('ascii') });
      } else {
        return callback({ state: 'failed', result: d.toString('ascii') });
      }
    });
  });
  req.write(postData);
  req.on('error', (e) => {
    return callback({ state: 'failed', result: e });
  });
  req.end();
};

exports.encrypt = (json) => {
  var cipher = crypto.createCipher('aes192', config.key);
  var enc = cipher.update(JSON.stringify(json), 'utf8', 'hex');
  enc += cipher.final('hex');
  enc += 'o' + exports.makeAMD5(enc).slice(20);
  return enc;
}; // 加密数据

exports.decrypt = (str) => {
  var data = str.split('o');
  if (exports.makeAMD5(data[0]).slice(20) == data[1]) {
    var decipher = crypto.createDecipher('aes192', config.key);
    var dec = decipher.update(data[0], 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } else {
    return 'ERR';
  } //解密数据
};

exports.makeASha = function(str) {
  var hashSHA = crypto.createHash('sha512');
  hashSHA.update(str + config.sign);
  return hashSHA.digest('hex');
}; // 散列

exports.makeAMD5 = function(str) {
  var hashSHA = crypto.createHash('md5');
  hashSHA.update(str + config.sign);
  return hashSHA.digest('hex');
}; // 散列

exports.getUserId = (res) => {
  return res.local.verify.userId;
};

exports.getNowTime = () => {
  return Math.ceil(((new Date()).getTime() - 1499860673563) / 1000);
};

exports.checkId = (req, res, next) => {
  let token = req.cookies.token;
  let data = exports.decrypt(token).split('&');
  if (data[0] === undefined || data[1] === undefined) {
    res.send({ state: 'failed', reason: 'ERR_TOKEN' });
    next('route');
  } else if ((exports.getNowTime() - data[1]) > 864000) {
    res.send({ state: 'failed', reason: 'TIMEOUT' });
    next('route');
  } else {
    let token = Math.round(Math.random() * 1000000);
    userMod.checkToken(data[0], data[1], token, (str) => {
      if (str == 'OK') {
        let userData = data[0] + '&' + verify.getNowTime() + '&' + token;
        userData = verify.encrypt(userData);
        res.cookie(
          'userSession', sessionXXX, { expires: new Date(Date.now() + 10000000), httpOnly: true });
        res.cookie(
          'sign', exports.makeAsha(sessionXXX + keyConfig.mysign), { expires: new Date(Date.now() + 10000000), httpOnly: true });
        res.cookie('isLogin', 1);
      } else {
        res.send({ state: 'failed', reason: 'ERR_TOKEN' });
        next('route');
      }
    });

  }
};


b = exports.encrypt('100&' + exports.getNowTime() + '&' + ram);

//b = exports.encrypt('100&10000000');
console.log(b);

/*   c = 'c42f1d260cc0effa8b21f88ef737a253356e69fa675bb347b0fdad3737562fe2';
  var d = exports.decrypt(c);
  console.log(d); */