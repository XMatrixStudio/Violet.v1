const crypto = require('crypto');
const fs = require('fs');
const keyConfig = JSON.parse(fs.readFileSync('config/key.json'));
const db = require('./mongo.js');
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
  LoginTime: Date,
  sites: [Number]
}, { collection: 'users' });
var userDB = mongoose.model('users', userSchema);

exports.makeASha = function(str) {
  var hashSHA = crypto.createHash('sha512');
  hashSHA.update(str);
  return hashSHA.digest('hex');
};

exports.register = (req, res, next) => {
  if (!regExp(/^[a-zA-Z0-9]{3,10}$/, req.body.name, 'ILLEGAL_NAME', res, next)) return;
  if (!regExp(/^(\w)+(\.\w+)*@(\w)+((\.\w{2,9}))$/, req.body.email, 'ILLEGAL_EMAIL', res, next)) return;
  userDB.count({ 'name': req.body.name }, (err, res) => {
    if (err) {
      err(err, res, next);
    } else if (res) {
      err('MULTIPLE_NAME', res, next);
    } else {
      register_email(req, res, next);
    }
  });
};

var register_email = (req, res, next) => {
  userDB.count({ 'email': req.body.email }, (err, res) => {
    if (err) {
      err(err, res, next);
    } else if (res) {
      err('MULTIPLE_EMAIL', res, next);
    } else {
      register_write(req, res, next);
    }
  });
};

var register_write = (req, res, next) => {
  userDB.count({}, (err, res) => {
    if (err) {
      err(err, res, next);
    } else {
      db.insertDate(userDB, {
        uid: 10000 + res,
        name: req.body.name,
        password: makeASha(req.body.password),
        email: req.body.email,
        sex: 0,
        valid: 0
      }, () => {
        res.send({ state: 'ok' });
      })
    }
  });
};


var regExp = (reg, str, err, res, next) => {
  if (reg.test(str)) {
    return true;
  } else {
    err(str, res, next);
    return false;
  }
}

var err = (str, res, next) => {
  res.send({
    state: 'failed',
    reason: str
  });
  next('route');
};