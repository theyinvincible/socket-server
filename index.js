var app = require('express')();
var http = require('http').Server(app).listen(3000);
var io = require('socket.io')(http);
var _ = require('lodash');

app.get('/', function(req, res){
  res.send('Socket server is healthy');
});

let usersLookingForPartner = {};

io.on('connect', (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.emit('beh', 'here is a msg');

  socket.on('lookingForPartner', (id) => {
    console.log(id);
    console.log(_.keys(usersLookingForPartner));
    console.log(_.keys(usersLookingForPartner).length);
    usersLookingForPartner[id] = socket;
    if (_.keys(usersLookingForPartner).length < 2) { // all partners have null values
    }
    else {
      console.log('\n\n');
      console.log(_.keys(usersLookingForPartner));
      let partner = pickRandomPartner(usersLookingForPartner, id);
      console.log('matched to partner '+partner);
      let partnerSocket = usersLookingForPartner[partner];

      if (!partnerSocket) {return console.warn('partnerSocket is null');}

      let roomName = generateRoomName(id, partner);

      socket.emit('matched', {room: roomName, id: partner});
      partnerSocket.emit('matched', {room: roomName, id: id});
    }
  });

  socket.on('disconnect', () => {
    let key = _.findKey(usersLookingForPartner, socket);
    if (key) {
      usersLookingForPartner[key] = null;
    }
    console.log(`socket ${socket.id} disconnected`);
  });
});

function pickRandomPartner(obj, id) {
  let onlineUsers = _.pickBy(obj, (value, key) => {
    return value !== null && key !== id;
  })
  let userids = _.keys(onlineUsers);
  let index = _.random(userids.length - 1);
  return userids[index];
}

function generateRoomName(firstName, secondName) {
  return firstName + secondName;
}
