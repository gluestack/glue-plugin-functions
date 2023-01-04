const express = require('express');

const app = express();
const port = 9000;

app.get('/health-check', (req, res) => {
  return res.status(200).json({status: true, message: 'Ok'});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
