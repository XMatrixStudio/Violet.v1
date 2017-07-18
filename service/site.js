const db = require('./mongo.js');
const verify = require('./sdk/verify.js');
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

exports.addSite = (id, name, url) => {
  db.insertDate(siteDB, {
    sid: id,
    name: name,
    url: url,
    loginTimes: 0
  });
};

exports.deleteSite = (condition) => {
  siteDB.remove(condition, (err) => {
    if (!err) console.log(err);
  });
}

exports.findSiteByArray = (list, callback) => {
  siteDB.find({}, (err, val) => {
    let webData = [];
    for (let i = 0; i < list.length; ++i) {
      let index = list[i] - 10000;
      webData.push({
        sid: val[index].sid,
        name: val[index].name,
        url: val[index].url,
      });
    }
    callback(webData);
  });
};

exports.findSiteById = (sid, callback) => {
  siteDB.find({ sid: sid }, (err, val) => {
    callback(val);
  });
};

exports.getWebInfo = (req, res, next) => {
  siteDB.find({ uid: verify.getUserId(res) }, (err, val) => {
    res.send({ state: 'ok', data: val });
  });
};

exports.setWebInfo = (req, res, next) => {
  siteDB.findOne({ sid: req.body.sid }, (err, val) => {
    if (val === null) {
      res.send({
        state: 'failed',
        reason: 'NO_SITE',
      });
    } else if (verify.getUserId(res) == val.uid) {
      val.url = req.body.url;
      val.save((err) => {});
      res.send({ state: 'ok' });
    } else {
      res.send({
        state: 'failed',
        reason: 'NO_AUTH',
      });
    };
  });
};