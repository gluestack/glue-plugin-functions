module.exports = () => [
  {
    "path": "/backend/functions",
    "proxy": {
      "instance": "functions:3500",
      "path": "/v1.0/invoke/functions/method/"
    }
  }
];
