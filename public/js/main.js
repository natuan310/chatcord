const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
// const speechLang = document.getElementById('speechLang').seletedOptions[0].value;
// const transLang = document.getElementById('transLang').seletedOptions[0].value;

// Get username and room from URL
const { username, room, speechLang, transLang } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room, speechLang, transLang });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', message => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', e => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

// Catch Call event
const callBtn = document.getElementById('call-btn')
callBtn.addEventListener('click', () => {
  socket.emit('start-call', {
    speechLang : speechLang,
    transLang: transLang
  })
  console.log('START CALL')
  streamAudio()
})



// Stream audio to server
function streamAudio() {
  navigator.getUserMedia({
    audio: true
  }, function (stream) {
    console.log('Start streaming!')
    // var speechLang = meetingConfig.lang

    // Start RecordRTC to stream audio
    recordAudio = RecordRTC(stream, {
      type: 'audio',
      mimeType: 'audio/webm',
      sampleRate: 44100,
      recorderType: StereoAudioRecorder,
      numberOfAudioChannels: 1,
      timeSlice: 2000,
      desiredSampRate: 16000,

      // as soon as the stream is available
      ondataavailable: function (blob) {
        // console.log(blob)
        // making use of socket.io-stream for bi-directional
        // streaming, create a stream
        var stream = ss.createStream();
        // stream directly to server
        // it will be temp. stored locally
        ss(socket).emit('stream-transcribe', stream)
        // ss(socket).emit('stream-transcribe', stream, {
        //   // 'name': 'stream.wav',
        //   // 'size': blob.size,
        //   'userName': username,
        //   'room': room,
        //   'speechLang': speechLang,
        //   'transLang': transLang,
        //   // 'socketId': socketId
        // });
        // pipe the audio blob to the read stream
        ss.createBlobReadStream(blob).pipe(stream);
      }
    });
    recordAudio.startRecording();
  }, function (error) {
    console.error(JSON.stringify(error));
  });
}


// Check muted status
function mutedStatus() {
  ZoomMtg.getCurrentUser({
    success: function (res) {
      if (!res.result.currentUser.muted) {
        recordAudio.pauseRecording();
      } else {
        recordAudio.resumeRecording();
      }
    }
  });
}