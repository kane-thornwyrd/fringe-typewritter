const http = require('http');
const tpl = require('pug');
const { appendFile, readFileSync } = require('fs');

const indexTpl = tpl.compileFile('./index.pug');

const urldecode = str => decodeURIComponent((str+'').replace(/\+/g, '%20'));

let content = readFileSync('./paper.txt', 'utf8');

process.once('SIGUSR2', async () => {
  await shutdown();
  process.kill(process.pid, 'SIGUSR2');
});

function shutdown(){
  console.log('KTHXBYE');
}

const server = http.createServer((req, res) => {
  if(req.method === 'GET') {
    res.end(indexTpl({ content }))
  }

  if(req.method === 'POST') {
    var body = '';
    req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
          res.writeHead(413, {'Content-Type': 'text/plain'});
          req.connection.destroy();
        }
    });

    req.on('end', function () {
      const newText = `\n${urldecode(body.split('newcontent=')[1])}`;
      if(newText.trim()) {
        content += newText;
        appendFile('paper.txt', newText, 'utf8', err => err && console.log(err) );
      }
    });

    res.writeHead(302, {'Location': '/'});
    res.end();
  }


});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8666);
