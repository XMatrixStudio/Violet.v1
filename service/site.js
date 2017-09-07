/*
  Copyright (c) 2017 XMatrix Studio
  Licensed under the MIT license

  Description: Site API 实现
 */

const db = require('./mongo.js');
const verify = require('./sdk/verify.js');
let siteSchema = db.violet.Schema({
  sid: Number,
  name: String,
  url: String,
  loginTimes: Number,
  uid: Number,
  key: String,
}, { collection: 'sites' });
let siteDB = db.violet.model('sites', siteSchema);


exports.db = siteDB;

exports.addTimesById = (id) => {
  siteDB.findOne({ sid: id }, (err, val) => {
    val.loginTimes += 1;
    val.save((err) => {});
  });
};

exports.addSite = (req, res, next) => {
  siteDB.count({ uid: verify.getUserId(res) }, (err, count) => {
    if (count < verify.getUserData(res).class) {
      siteDB.count({}, (err, val) => {
        db.insertDate(siteDB, {
          sid: val + 10000,
          name: 'New Web',
          url: 'www.example.com',
          loginTimes: 0,
          uid: verify.getUserId(res),
          key: randomString(20),
        });
      });
      res.send({ state: 'ok', count: count + 1, max: verify.getUserData(res).class });
    } else {
      res.send({ state: 'failed', reason: 'MAX', max: verify.getUserData(res).class });
    }
  });
};

exports.deleteSite = (condition) => {
  siteDB.remove(condition, (err) => {
    if (!err) console.log(err);
  });
};

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
  siteDB.findOne({ sid: sid }, (err, val) => {
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
      val.name = req.body.name;
      val.save((err) => {});
      res.send({ state: 'ok' });
    } else {
      res.send({ state: 'failed', reason: 'NO_AUTH' });
    }
  });
};

exports.changeKey = (req, res, next) => {
  siteDB.findOne({ sid: req.body.sid }, (err, val) => {
    if (val === null) {
      res.send({ state: 'failed', reason: 'NO_SITE' });
    } else if (val.uid == verify.getUserId(res)) {
      let myKey = randomString(20);
      val.key = myKey;
      val.save((err) => {});
      res.send({ state: 'ok', key: myKey });
    } else {
      res.send({ state: 'failed', reason: 'NO_AUTH' });
    }
  });
};

let randomString = (len) => {
  let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
  let maxPos = $chars.length;
  let str = '';　　
  for (i = 0; i < len; i++) { str += $chars.charAt(Math.floor(Math.random() * maxPos)); }　　
  return str;
};
