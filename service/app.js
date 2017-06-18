const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = app.listen(30001, '127.0.0.1', function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});

app.get('/', function(req, res) {
  res.send('User authorization system is running');
});

app.post('/post', function(req, res) {
  console.log(req.body);
  res.send({ state: 'ok' });
});