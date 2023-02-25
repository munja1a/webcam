'use strict';

const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');
const startButton = document.querySelector('#startButton');
const callButton = document.querySelector('#callButton');
const hangupButton = document.querySelector('#hangupButton');

let localStream;
let remoteStream;
let pc1;
let pc2;

// Pomoćna funkcija za stvaranje novog RTCPeerConnection objekta
function newPeerConnection() {
  const pc = new RTCPeerConnection({
    iceServers: [{
      urls: 'stun:stun.l.google.com:19302'
    }]
  });
  pc.onicecandidate = event => {
    if (event.candidate) {
      pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
    }
  };
  pc.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.streams[0];
  };
  return pc;
}

// za multi
function handleConnection(peer) {
  console.log("New user connected with ID: " + peer.id);
  const call = peer.call(peer.id, localStream);
  call.on("stream", (remoteStream) => {
    addVideoStream(remoteStream, peer.id);
  });
}

// Početna funkcija koja traži dopuštenje za pristup kameri
async function start() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    localVideo.srcObject = localStream;
    pc1 = newPeerConnection();
    localStream.getTracks().forEach(track => {
      pc1.addTrack(track, localStream);
    });
    startButton.disabled = true;
    callButton.disabled = false;
  } catch (e) {
    console.error('getUserMedia error:', e);
  }
}

// Funkcija za pokretanje poziva
async function call() {
  try {
    pc2 = newPeerConnection();
    localStream.getTracks().forEach(track => {
      pc2.addTrack(track, localStream);
    });
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);
    hangupButton.disabled = false;
  } catch (e) {
    console.error('call error:', e);
  }
}

// Funkcija za prekid poziva
function hangup() {
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  localStream.getTracks().forEach(track => {
    track.stop();
  });
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  hangupButton.disabled = true;
  callButton.disabled = true;
  startButton.disabled = false;
}

startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);
