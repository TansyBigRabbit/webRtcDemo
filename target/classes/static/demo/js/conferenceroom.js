
//当前域名或ip（包括ip和端口）
var url=window.location.host;
//console.log(url);

//ws还是wss
var wsProtocol = 'https:' == document.location.protocol ? 'wss' : 'ws';

var pathName = window.document.location.pathname;
//获取带"/"的项目名，如：/webrtc
var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);

if(projectName=='/demo'){
	projectName='';
}

var webSocketUrl=wsProtocol+"://"+url+projectName+"/groupcall";

var ws = new WebSocket(webSocketUrl);

var participants = {};
var name;

window.onbeforeunload = function() {
	ws.close();
};

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
	case 'existingParticipants':
		onExistingParticipants(parsedMessage);
		break;
	case 'newParticipantArrived':
		onNewParticipant(parsedMessage);
		break;
	case 'participantLeft':
		onParticipantLeft(parsedMessage);
		break;
	case 'receiveVideoAnswer':
		receiveVideoResponse(parsedMessage);
		break;
	case 'iceCandidate':
		participants[parsedMessage.name].rtcPeer.addIceCandidate(parsedMessage.candidate, function (error) {
	        if (error) {
		      console.error("Error adding candidate: " + error);
		      return;
	        }
	    });
	    break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
}

function register() {
	name = document.getElementById('name').value;
	var room = document.getElementById('roomName').value;

	document.getElementById('room-header').innerText = 'ROOM ' + room;
	document.getElementById('join').style.display = 'none';
	document.getElementById('room').style.display = 'block';

	var message = {
		id : 'joinRoom',
		name : name,
		room : room,
	}
	sendMessage(message);
}

function onNewParticipant(request) {
	receiveVideo(request.name);
}

function receiveVideoResponse(result) {
	participants[result.name].rtcPeer.processAnswer (result.sdpAnswer, function (error) {
		if (error) return console.error (error);
	});
}

function callResponse(message) {
	if (message.response != 'accepted') {
		console.info('Call not accepted by peer. Closing call');
		stop();
	} else {
		webRtcPeer.processAnswer(message.sdpAnswer, function (error) {
			if (error) return console.error (error);
		});
	}
}

function onExistingParticipants(msg) {
	var constraints = {
		audio : true,
		video : {
			mandatory : {
				maxWidth : 320,
				maxFrameRate : 15,
				minFrameRate : 15
			}
		}
	};
	console.log(name + " registered in room " + room);
	var participant = new Participant(name);
	participants[name] = participant;
	var video = participant.getVideoElement();

	var options = {
	      localVideo: video,
	      mediaConstraints: constraints,
	      onicecandidate: participant.onIceCandidate.bind(participant)
	    }
	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (error) {
		  if(error) {
			  return console.error(error);
		  }
		  this.generateOffer (participant.offerToReceiveVideo.bind(participant));
	});

	msg.data.forEach(receiveVideo);
}

function leaveRoom() {
	sendMessage({
		id : 'leaveRoom'
	});

	for ( var key in participants) {
		participants[key].dispose();
	}

	document.getElementById('join').style.display = 'block';
	document.getElementById('room').style.display = 'none';

	ws.close();
}

function receiveVideo(sender) {
	var participant = new Participant(sender);
	participants[sender] = participant;
	var video = participant.getVideoElement();

	var options = {
      remoteVideo: video,
      onicecandidate: participant.onIceCandidate.bind(participant)
    }

	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
			function (error) {
			  if(error) {
				  return console.error(error);
			  }
			  this.generateOffer (participant.offerToReceiveVideo.bind(participant));
	});;
}

function onParticipantLeft(request) {
	console.log('Participant ' + request.name + ' left');
	var participant = participants[request.name];
	participant.dispose();
	delete participants[request.name];
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	ws.send(jsonMessage);
}
