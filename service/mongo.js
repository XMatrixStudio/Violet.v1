/*
  Copyright (c) 2017 XMatrix Studio
  Licensed under the MIT license

  Description: MongoDB模块
 */


const mongoose = require('mongoose');
const fs = require('fs'); //文件处理
const config = JSON.parse(fs.readFileSync('./config/mongodb.json'));
let mongodbStr = 'mongodb://' +
                 config.user + ':' +
                 config.password + '@' +
                 config.host + ':' +
                 config.port + '/' +
                 config.dbName;
mongoose.Promise = global.Promise;
mongoose.connect(mongodbStr, { useMongoClient: true });
let db = mongoose.connection;


db.on('error', () => {
  console.error.bind(console, 'connection error:');
}); // 发生错误
db.on('disconnected', () => {
  console.log('Mongoose connection disconnected');
}); // 连接断开
db.on('connected', function () {
  console.log('Mongoose connection Success');
}); // 连接成功


// 插入数据
exports.insertDate = (myModel, data, callback) => {
  let object = new myModel(data); // 创建一个数据对象
  object.save((err, res) => {
    if (callback !== undefined) callback();
  });
};

exports.violet = mongoose;

/*
update 更新
remove 删除
count 数量
find(con, (name), callback)
find 正则 {'username':{$regex://i}}
*/
// -------------------
