const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 9000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get('/health-check', (req, res) => {
  return res.status(200).json({status: true, message: 'Health check performed successfully'});
});

const middleware = (req, res, next) => {
  const { headers } = req;

  if (! headers.hasOwnProperty('x-glue-invoke')) {
    return next();
  }

  const { 'x-glue-invoke': invoke } = headers;
  const isPublic = process.env.GLUE_PUBLIC === 'false' ? false : true;
  if (invoke !== 'client' || isPublic === true) {
    return next();
  }

  //
  // If GLUE_PUBLIC is set specifically to "false". This means that the function
  // is not publically exposed to client invoke calls.
  //
  // If it is set "true" or the env var does not exist, then it is assumed that
  // the function is available for client invoke calls.
  return res.status(401).json({
    status: false,
    message: 'Access denied'
  });
};

app.post('/functions', middleware, (req, res) => {
  const { headers, body }  = req;

  // do something with the headers and body
  // perform your custom business logic

  console.log({ headers, body });

  return res.status(200).json({
    status: true,
    message: 'Ok'
  });
});

app.listen(port, () => {
  console.log(`Action listening on port ${port}`)
});
