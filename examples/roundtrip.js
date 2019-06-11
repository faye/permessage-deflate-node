var fs      = require('fs'),
    deflate = require('..');

var records = fs.readFileSync(__dirname + '/bad.out.log', 'utf8')
              .replace(/\s*$/g, '')
              .split(/\n/)
              .map(JSON.parse);

var client     = deflate.createClientSession(),
    offer      = client.generateOffer(),
    server     = deflate.createServerSession([offer]),
    response   = server.generateResponse(),
    compressed = [],
    size       = [0, 0];

client.activate(response);

function compress(index) {
  var record = records[index];
  if (!record) {
    console.log(size, size[0] / size[1]);
    return decompress(0);
  }

  var message = { data: new Buffer(record[3], 'base64') };
  size[0] += message.data.length;

  server.processOutgoingMessage(message, function(error, message) {
    compressed[index] = message;
    size[1] += message.data.length;
    compress(index + 1);
  });
}

function decompress(index) {
  var record = records[index];
  if (!record) return;

  var payload = record[3],
      message = compressed[index];

  client.processIncomingMessage(message, function(error, message) {
    var output = message.data.toString('base64');
    if (output !== payload) {
      console.error('Failed on', record, message);
      process.exit(1);
    }
    decompress(index + 1);
  });
}

compress(0);
