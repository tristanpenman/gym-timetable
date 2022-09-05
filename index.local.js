const { handler } = require('.');
const http = require('http');

const host = '0.0.0.0';
const port = 5000;

const requestListener = (req, res) => {
  const { url } = req;
  console.log('request', {
    url
  });

  const searchParams = new URLSearchParams(new URL(url, `http://localhost:${port}`).search);
  const queryStringParameters = Object.fromEntries(searchParams);

  handler({ queryStringParameters }).then((response) => {
    Object.keys(response.headers).forEach((header) => {
      res.setHeader(header, response.headers[header]);
    });
    res.writeHead(200);
    res.end(response.body);
  });
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Listening on http://${host}:${port}`);
});
