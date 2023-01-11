const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 9000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get('/health-check', (req, res) => {
  return res.status(200).json({status: true, message: 'Ok'});
});

app.post('/webhook', (req, res) => {
  const body = req.body;

  // do something with the body here

  return res.status(200).json({status: true, message: 'done'});
});

app.listen(port, () => {
  console.log(`Function app listening on port ${port}`)
});
