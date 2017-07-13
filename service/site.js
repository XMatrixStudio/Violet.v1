const db = require('./mongo.js');
var siteSchema = db.violet.Schema({
  sid: Number,
  name: String,
  url: String,
  loginTimes: Number
}, { collection: 'sites' });
var siteDB = db.violet.model('sites', siteSchema);
exports.db = siteDB;

exports.addTimesById = (id) => {
  siteDB.findOne({ sid: id }, (err, val) => {
    val.loginTimes += 1;
    val.save((err) => {});
  });
};