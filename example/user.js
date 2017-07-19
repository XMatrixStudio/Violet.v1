const verify = require('./sdk/verify.js');
exports.login = (req, res, next) => {
  verify.getUserInfo(req.body.code, (data) => {
    res.send(data.data);
  });
};