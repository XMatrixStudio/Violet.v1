var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://violet:xmatrix-me@119.29.103.176:27017/violet', {
  useMongoClient: true
});
var db = mongoose.connection;
db.on('error', () => {
  console.error.bind(console, 'connection error:')
}); // 发生错误
db.on('disconnected', () => {
  console.log('Mongoose connection disconnected');
}); // 连接断开
db.on('connected', function() {
  console.log('Mongoose connection Success');

});

// 插入数据
exports.insertDate = (myModel, data, callback) => {
  var object = new myModel(data); // 创建一个数据对象
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

/* var siteSchema = mongoose.Schema({
  name: String,
  url: String,
  date: Date
}, { collection: 'sites' }); // 创建数据表骨架

var siteModel = mongoose.model('sites', siteSchema); // 绑定数据表
siteModel.findOne({ name: 'xmoj' }, (err, doc) => {
  console.log(doc);
}); */

//exports.insertDate(siteModel, { name: 'xmoj', url: 'xmoj.zhenly.cn' }, (state) => { console.log(state) });
//console.log(people);
// insertDate(siteModel, { name: 'xmoj', url: 'xmoj.zhenly.cn' }, (state) => {console.log(state)});
// update(siteModel, { 'name': 'xmoj' }, { 'name': 'XMatrixOJ' }, (state) => {console.log(state)});