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