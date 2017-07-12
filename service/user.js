const fs = require('fs');
const keyConfig = JSON.parse(fs.readFileSync('config/key.json'));
const db = require('./mongo.js');
const site = require('./site.js');
const verify = require('sdk/verify.js');
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
  sites: [Number]
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
        valid: false
      }, () => {
        res.send({ state: 'ok' });
      })
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

var login_pwd = (req, res, next, val) => {
  if (val.password === verify.makeASha(req.body.password)) {
    site.db.findOne({ sid: req.body.sid }, (err, val) => {
      if (val === null) {
        sendErr('NO_SITE');
      } else if (val.valid === true) {
        send({ state: 'ok', siteName: val.name });
      } else {
        sendErr('VALID_EMAIL');
      }
    });
  } else {
    sendErr('ERR_PWD', res, next);
  }
};

// ------------------------------------------------
exports.getCode = (req, res, next) => {
  userDB.findOne({ email: req.body.email }, (err, val) => {
    if (val !== null) {
      getCode_time(req, res, next, val);
    } else {
      sendErr('NO_EMAIL', res, next);
    }
  });
};

var getCode_time = (req, res, next, val) => {
  var nowTime = new Date();
  if (val.emailTime !== undefined ||
    (nowTime.getTime() - val.emailTime.getTime()) > 60000) {
    var code = Math.round(100000 + Math.random() * 1000000);
    userDB.update({ email: req.body.email }, { $set: { emailTime: nowTime, vCode: code } });
    getCode_sendEmail(req, res, next, code);
  } else {
    sendErr('WAITING_TIME', res, next);
  }
};

var getCode_sendEmail = (req, res, next, code) => {
  var mail1 = fs.readFileSync('data/mail1.data');
  var mail2 = fs.readFileSync('data/mail2.data');
  fs.writeFile('mail.html', mail1 + code + mail2, (err) => {
    if (err) console.error(err);
    spawn('./sendMail.sh', [req.body.email]);
  });
  res.send({ state: 'ok' });
};

exports.reset = (req, res, next) => {
  userDB.findOne({ email: req.body.email }, (err, val) => {
    var nowTime = new Date();
    if (val === null) {
      sendErr('NO_EMAIL', res, next);
    } else if (val.vCode == req.body.vCode &&
      (nowTime.getTime() - val.emailTime.getTime()) < 600000) {
      nowTime.setFullYear(2000, 1, 1);
      userDB.update({ email: req.body.email }, {
        $set: {
          password: req.body.password,
          emailTime: nowTime
        }
      });
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
          var _id = val._id;
          delete val._id;
          userDB.update({ _id: _id }, val); // 更新数据库
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
  var userData = verify.decrypt(req.body.code).split('&');
  if (userData[0] === undefined || userData[1] === undefined || (verify.getNowTime() - userData[0]) < 60) {
    sendErr('TIMEOUT', res, next);
  } else {
    userDB.findOne({ uid: verify.getUserId(res) }, (err, val) => {
      if (val === null) {
        sendErr('ERR', res, next);
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


var checkToken = (uid, oldToken, newToken, callback) => {
  userDB.find({ uid: uid }, (err, val) => {
    if (val === null) {
      callback('NO_USER');
    } else if (val.token != oldToken) {
      callback('ERR_TOKEN');
    } else {
      userDB.update({ uid: uid }, { $set: { token: newToken } });
      callback('OK');
    }
  });
};