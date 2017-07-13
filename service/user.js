const fs = require('fs');
const db = require('./mongo.js');
const site = require('./site.js');
const verify = require('./sdk/verify.js');
const spawn = require('child_process').spawn; //异步子进程模块
var userSchema = db.violet.Schema({
  uid: Number,
  token: Number,
  vCode: Number,
  name: String,
  password: String,
  email: String,
  detail: String,
  web: String,
  phone: String,
  sex: Number,
  valid: Boolean,
  birthTime: Date,
  emailTime: Date,
  sites: [Number],
  class: Number,
}, { collection: 'users' });
var userDB = db.violet.model('users', userSchema);


// ------------------------------------------------
exports.register = (req, res, next) => {
  if (!regExp(/^[a-zA-Z0-9]{3,10}$/, req.body.name, 'ILLEGAL_NAME', res, next)) return;
  if (!regExp(/^(\w)+(\.\w+)*@(\w)+((\.\w{2,9}))$/, req.body.email, 'ILLEGAL_EMAIL', res, next)) return;
  userDB.count({ name: req.body.name }, (err, val) => {
    if (err) {
      sendErr(err, res, next);
    } else if (val) {
      sendErr('MULTIPLE_NAME', res, next);
    } else {
      register_email(req, res, next);
    }
  });
};

var register_email = (req, res, next) => {
  userDB.count({ email: req.body.email }, (err, val) => {
    if (err) {
      sendErr(err, res, next);
    } else if (val) {
      sendErr('MULTIPLE_EMAIL', res, next);
    } else {
      register_write(req, res, next);
    }
  });
};

var register_write = (req, res, next) => {
  userDB.count({}, (err, val) => {
    if (err) {
      sendErr(err, res, next);
    } else {
      db.insertDate(userDB, {
        uid: 100 + val,
        name: req.body.name,
        password: verify.makeASha(req.body.password),
        email: req.body.email,
        sex: 0,
        valid: false,
        class: 0,
      }, () => {
        res.send({
          state: 'ok',
          name: req.body.name,
          email: req.body.email,
        });
      });
    }
  });
};
// ------------------------------------------------

exports.login = (req, res, next) => {
  if (req.body.user.indexOf('@') == -1) { // 用户名登陆
    userDB.findOne({ name: req.body.user }, (err, val) => {
      if (val === null) {
        sendErr('NO_USERNAME', res, next);
      } else {
        login_pwd(req, res, next, val);
      }
    });
  } else { // 邮箱登陆
    userDB.findOne({ email: req.body.user }, (err, val) => {
      if (val === null) {
        sendErr('NO_EMAIL', res, next);
      } else {
        login_pwd(req, res, next, val);
      }
    });
  }
};

var login_pwd = (req, res, next, userVal) => {
  if (userVal.password === verify.makeASha(req.body.password)) {
    if (userVal.class === 0) {
      sendSiteInfo(req, res, next, userVal);
    } else {
      makeNewToken(req, res, userVal.uid, () => {
        res.send({
          state: 'ok',
          siteName: 'VIOLET_DEV' // 进入开发者页面
        });
      });
    }
  } else {
    sendErr('ERR_PWD', res, next);
  }
};

var sendSiteInfo = (req, res, next, userVal) => {
  site.db.findOne({ sid: req.body.sid }, (err, val) => {
    if (userVal.valid === true) {
      let siteId = (val !== null) ? val.sid : 10000;
      makeNewToken(req, res, userVal.uid, () => {
        res.send({
          state: 'ok',
          siteName: (val !== null) ? val.name : 'VIOLET',
          email: userVal.email,
          name: userVal.name
            // 头像
        });
      });
    } else {
      makeNewToken(req, res, userVal.uid, () => {
        res.send({
          state: 'failed',
          reason: 'VALID_EMAIL',
          email: userVal.email,
          name: userVal.name
            // 头像
        });
      });
    }
  });
}

// ------------------------------------------------
exports.getCode = (req, res, next) => {
  userDB.findOne({ email: req.body.email }, (err, val) => {
    if (val !== null) {
      var nowTime = new Date();
      if (val.emailTime === undefined ||
        (nowTime.getTime() - val.emailTime.getTime()) > 60) {
        var code = Math.round(100000 + Math.random() * 1000000);
        val.emailTime = nowTime;
        val.vCode = code;
        val.save((err) => {});
        getCode_sendEmail(req, res, next, code);
      } else {
        sendErr('WAITING_TIME', res, next);
      }
    } else {
      sendErr('NO_EMAIL', res, next);
    }
  });
};


var getCode_sendEmail = (req, res, next, code) => {
  var mail1 = fs.readFileSync('data/mail1.data');
  var mail2 = fs.readFileSync('data/mail2.data');
  fs.writeFile('mail.html', mail1 + code + mail2, (err) => {
    if (err) console.error(err);
    spawn('./sendMail.sh', [req.body.email]);
    console.log('OK: send a code Email.');
  });
  res.send({ state: 'ok' });
};

// ------------------------------------------------

exports.reset = (req, res, next) => {
  userDB.findOne({ email: req.body.email }, (err, val) => {
    var nowTime = new Date();
    if (val === null) {
      sendErr('NO_EMAIL', res, next);
    } else if (val.vCode == req.body.vCode && val.emailTime !== undefined && verify.comTime(val.emailTime) < 600) {
      nowTime.setFullYear(2000, 1, 1);
      val.password = verify.makeASha(req.body.password);
      val.emailTime = nowTime;
      val.valid = true;
      val.save((err) => {});
      res.send({ state: 'ok' });
    } else {
      sendErr('ERR_CODE', res, next);
    }
  });
};

// ------------------------------------------------

exports.auth = (req, res, next) => {
  site.db.findOne({ sid: req.body.sid }, (err, val) => {
    if (val !== null) {
      var userId = verify.getUserId(res);
      var siteUrl = val.url;
      userDB.findOne({ uid: userId }, (err, val) => {
        if (val.sites.indexOf(req.body.sid) == -1) {
          val.sites.push(req.body.sid);
          val.save((err) => {});
        }
        site.addTimesById(req.body.sid); // 增加访问次数
        res.send({ state: 'ok', url: siteUrl, code: createCode() });
      });
    } else {
      sendErr('NO_SITE', res, next)
    }
  });
};

var createCode = (uid) => {
  var userData = uid + '&' + verify.getNowTime();
  return verify.encrypt(userData);
};

// ------------------------------------------------
exports.getInfo = (req, res, next) => {
  var userData = verify.decrypt(req.body.userToken).split('&');
  var webData = verify.decrypt(req.body.webToken).split('&');
  if (userData[0] === undefined || userData[1] === undefined || (verify.getNowTime() - userData[0]) > 60) {
    sendErr('USER_ERR', res, next);
  } else if (webData[0] === undefined || webData[1] === undefined || (verify.getNowTime() - userData[0]) > 60) {
    sendErr('WEB_ERR', res, next);
  } else {
    userDB.findOne({ uid: userData[0] }, (err, val) => {
      if (val === null) {
        sendErr('USER_ERR', res, next);
      } else {
        res.send({
          state: 'ok',
          uid: val.uid,
          name: val.name,
          email: val.email,
          phone: val.phone,
          detail: val.detail,
          sex: val.sex,
          birthTime: val.birthTime
        });
      }
    });
  }
};

// ------------------------------------------------
//激活邮箱
exports.validEmail = (req, res, next) => {
  userDB.findOne({ email: req.body.email }, (err, val) => {
    if (val === null) { // 邮箱不存在
      sendErr('NO_EMAIL', res, next);
    } else {
      if (val.vCode != req.body.vCode) { //验证码错误
        sendErr('ERR_CODE', res, next);
      } else if (verify.comTime(val.emailTime) > 600) {
        sendErr('TIMEOUT', res, next);
      } else { //验证码正确
        var nowTime = new Date();
        nowTime.setFullYear(2000, 1, 1);
        userData = val;
        userData.valid = true;
        sendSiteInfo(req, res, next, userData);
        val.valid = true;
        val.emailTime = nowTime;
        val.save((err) => {});
      }
    }
  });
};
// ------------------------------------------------
exports.getUser = (req, res, next) => {
  userDB.findOne({ uid: verify.getUserId(res) }, (err, val) => {
    sendSiteInfo(req, res, next, val);
  });
};

// ------------------------------------------------
// ------------------------------------------------

var regExp = (reg, str, err, res, next) => {
  if (reg.test(str)) {
    return true;
  } else {
    sendErr(str, res, next);
    return false;
  }
}

var sendErr = (str, res, next) => {
  console.log('ERR: ' + str);
  res.send({
    state: 'failed',
    reason: str
  });
  next('route');
};


exports.DBToken = (uid, oldToken, newToken, callback) => {
  userDB.findOne({ uid: uid }, (err, val) => {
    if (val === null) {
      callback('NO_USER');
    } else if (val.token != oldToken) {
      callback('ERR_TOKEN');
    } else {
      val.token = newToken;
      val.save((err) => {});
      callback('OK');
    }
  });
};

var makeNewToken = (req, res, uid, callback) => {
  let token = Math.round(Math.random() * 1000000);
  userDB.findOne({ uid: uid }, (err, val) => {
    val.token = token;
    val.save((err) => {});
    let userData = uid + '&' + verify.getNowTime() + '&' + token;
    verify.makeUserToken(req, res, userData, () => {
      callback();
    });
  });
};

// -------------------------------------------------------------
Array.prototype.contains = function(needle) {
  for (let i in this) {
    if (this[i] == needle) return true;
  }
  return false;
};

exports.mGetUserInfo = (req, res, next) => {
  userDB.findOne({ uid: verify.getUserId() }, (err, val) => {
    makeNewToken(req, res, verify.getUserId(), () => {
      site.db.find({}, (err, data) => {
        let webData = [];
        for (let web in data) {
          if (val.sites.contains(web.sid)) {
            webData.push(web);
          }
        }
        res.send({
          state: 'ok',
          userData: val,
          webData: webData,
        });
      })
    });
  });
};