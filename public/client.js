$(document).ready(function () {
  /* global io */
  let socket = io()
  let currentUsers = 0
  ++currentUsers
  io.emit('user cout', currentUsers)
  socket.on('user count', (data) => {
    console.log(data)
  })
  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();

    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});
