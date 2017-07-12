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
  var old = exports.getSiteById(id);
  siteDB.update({ sid: id }, { $set: { loginTimes: old.loginTimes + 1 } });
};