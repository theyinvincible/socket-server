var app = require('express')();
var http = require('http').Server(app).listen(process.env.port || 3000);
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
    users[id] = {socket};
    let partnerId = pickRandomPartner(users, id);
    if (!partnerId) {return console.log('No available users found');}
    let partnerSocket = users[partnerId].socket;
    if (!partnerSocket) {return console.warn('partnerSocket is null');}

    console.log('matched to partner '+partnerId);

    let roomName = generateRoomName(id, partnerId);
    users[id].room = roomName;
    users[partnerId].room = roomName;
    socket.emit('match', {room: roomName, id: partnerId});
    partnerSocket.emit('match', {room: roomName, id: id});
  });

  socket.on('disconnect', () => {
    let key = _.findKey(users, ['socket', socket]);
    if (key) {
      users[key].socket = null;
      users[key].room = null;
    }
    console.log(`socket ${socket.id} disconnected`);
  });

  // figure fallout for when a user partner's disconnects
});

function pickRandomPartner(obj, id) {
  let onlineUsers = _.pickBy(obj, (value, key) => {
    return value.socket && !value.room && key !== id;
  })
  if (_.isEmpty(onlineUsers)) { return null; }
  let userids = _.keys(onlineUsers);
  let index = _.random(userids.length - 1);
  return userids[index];
}

function generateRoomName(firstName, secondName) {
  return firstName + secondName;
}
