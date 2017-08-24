var app = require('express')();
var http = require('http').Server(app).listen(3000);
var io = require('socket.io')(http);
var _ = require('lodash');

app.get('/', function(req, res){
  res.send('Socket server is healthy');
});

let users = {};

io.on('connect', (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.emit('beh', 'here is a msg');

  socket.on('findingPartner', (id) => {
    users[id] = socket;
    let partner = pickRandomPartner(users, id);
    if (!partner) {return console.log('No other online users found');}

    console.log('matched to partner '+partner);
    let partnerSocket = users[partner];

    if (!partnerSocket) {return console.warn('partnerSocket is null');}

    let roomName = generateRoomName(id, partner);

    socket.emit('match', {room: roomName, id: partner});
    partnerSocket.emit('match', {room: roomName, id: id});
  });

  socket.on('disconnect', () => {
    let key = _.findKey(users, socket);
    if (key) {
      users[key] = null;
    }
    console.log(`socket ${socket.id} disconnected`);
  });
});

function pickRandomPartner(obj, id) {
  let onlineUsers = _.pickBy(obj, (value, key) => {
    return value !== null && key !== id;
  })
  if (_.isEmpty(onlineUsers)) { return null; }
  let userids = _.keys(onlineUsers);
  let index = _.random(userids.length - 1);
  return userids[index];
}

function generateRoomName(firstName, secondName) {
  return firstName + secondName;
}
