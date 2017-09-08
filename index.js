var app = require('express')();
var http = require('http').Server(app).listen(process.env.PORT || 3000);
var io = require('socket.io')(http);
var _ = require('lodash');

app.get('/', function(req, res){
  res.send('Socket server is healthy');
});

let users = {};

io.on('connect', (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.emit('beh', 'here is a msg');

  socket.on('findingPartner', ({id, partners = []}) => {
    if (!id) { return console.warn('Unexpected null value for id');}

    if (users[id] && users[id].socket) {
      return socket.emit('already-exists');
    }

    users[id] = {socket};
    let partnerId = pickRandomPartner(users, id, partners);
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
      // console.log('found user and set values to null');
      users[key].socket = null;
      users[key].room = null;
    }
    // console.log(users);
    console.log(`socket ${socket.id} disconnected`);
  });

  socket.on('leave-room', (id) => {
    if (!id) {return console.warn('[leave-room] Missing id');}
    if (!users[id]) { return console.warn('[leave-room] No such active user'); }
    // console.log(`${id} asked to leave room`);
    let room = users[id].room;
    users[id].room = null;

    // Find all other users in the room and ask them to disconnect
    if (room) {
      console.log(`[leave-room] Room is ${room}`);
      let key = _.findKey(users, ['room', room]);
      while (key) {
        console.log(`[leave-room] telling ${key} to disconnect`);
        users[key].room = null;
        users[key].socket.emit('partner-disconnected');
        key = _.findKey(users, ['room', room]);
      }
    }
  })

  // figure fallout for when a user partner's disconnects
});

function pickRandomPartner(obj, id, prevMatches) {
  let onlineUsers = _.pickBy(obj, (value, key) => {
    return value.socket && !value.room && key !== id;
  })
  if (_.isEmpty(onlineUsers)) { return null; }
  let matches = _.keys(onlineUsers);
  let newMatches = _.difference(matches, prevMatches);
  if (!_.isEmpty(newMatches)) {
    matches = newMatches;
  }
  let index = _.random(matches.length - 1);
  return matches[index];
}

function generateRoomName(firstName, secondName) {
  return `${firstName}room${secondName}time${(new Date()).getTime().toString()}`;
}
