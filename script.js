var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = new SpeechRecognition();
var conversationTextarea = $('#conversation-textarea');
var conversation = '';
var awaitingResponse = false;
var awaitingResponseFromCommandId;
var awaitingResponseFromCommandStep = 0;
var tempCommand
var tempResponse
var triggers = []
var commands = []

readData()

/*-----------------------------
     Command Functions
------------------------------*/

function addTrigger(trigger) {
  triggers.push(trigger)
  readOutLoud(getResponseFromArrays(commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].responseArray, [trigger]))
}

function addCommand(command) {
  tempCommand = command
  readOutLoud(getResponseFromArrays(commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].responseArray, [command]))
}

function addCommandResponse(response) {
  tempResponse = response
  commands.push({
    command: tempCommand,
    response: tempResponse
  })
  writeData()
  readOutLoud(getResponseFromArrays(commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].responseArray, [response]))
}

/*-----------------------------
          Helpers
------------------------------*/

function writeData() {
  $.post('/write', JSON.stringify({ triggers: triggers, commands: commands }), () => { })
}

function getResponseFromArrays(arr1, arr2) {
  var result = ""
  for (var i = 0; i < arr2.length; i++) {
    result += " " + arr1[i] + " " + arr2[i]
  }
  result += " " + arr1[arr1.length - 1]
  return result.trim()
}

function readData() {
  $.get('/read', (data) => {
    triggers = data.triggers
    commands = data.commands
  })
}

/*-----------------------------
             UI
------------------------------*/

function addtoConversation(message, response = false) {
  if (response) {
    conversation += "<li style='color:blue'>"
  } else {
    conversation += "<li>"
  }
  conversation += message + "</li>";
  conversationTextarea.html(conversation);
  conversationTextarea.find('li').last()[0].scrollIntoView()
}

$('#startBtn').on('click', () => {
  if ($('#startBtn').html() == 'Start') {
    recognition.start()
    $('#startBtn').html('Stop')
  } else {
    recognition.onend = () => {
      $('#startBtn').html('Start')
    }
    recognition.abort()
  }
})

$('#userInput').keypress(function (e) {
  if (e.charCode == 13) {
    var event = { resultIndex: 0, results: [[{ transcript: $('#userInput').val() }]] }
    recognition.onresult(event)
    return false;
  }
});

/*-----------------------------
      Voice Recognition 
------------------------------*/

recognition.continuous = true;

recognition.onresult = (event) => {
  recognition.onend = () => {
    $('#userInput').val('')
    var current = event.resultIndex;
    var transcript = event.results[current][0].transcript;
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
    if (!mobileRepeatBug) {
      console.log(transcript.toLowerCase())
      if (awaitingResponse) {
        addtoConversation(transcript)
        commands[awaitingResponseFromCommandId].steps[awaitingResponseFromCommandStep].func(transcript.toLowerCase())
        if (awaitingResponseFromCommandStep == commands[awaitingResponseFromCommandId].steps.length - 1) {
          awaitingResponseFromCommandStep = 0
          awaitingResponse = false
          awaitingResponseFromCommandId = null
        }
        awaitingResponseFromCommandStep += 1
        return
      }
      for (var i = 0; i < triggers.length; i++) {
        if (transcript.toLowerCase().indexOf(triggers[i]) == 0) {
          addtoConversation(transcript);
          var commandFound = false
          for (var j = 0; j < commands.length; j++) {
            if (transcript.toLowerCase() == triggers[i] + " " + commands[j].command) {
              commandFound = true
              if (commands[j].steps && commands[j].steps.length > 0) {
                awaitingResponseFromCommandId = j
                awaitingResponseFromCommandStep = 0
                awaitingResponse = true
              }
              readOutLoud(commands[j].response)
              return
            }
          }
          if (!commandFound) {
            readOutLoud("Sorry, I do not recognize that command")
            return
          }
        }
      }
    }
    recognition.start()
  }
  recognition.abort()
};

recognition.onerror = function (event) {
  if (event.error !== 'aborted') {
    console.log(event.error)
  }
}

/*-----------------------------
      Speech Synthesis 
------------------------------*/
function readOutLoud(message) {
  addtoConversation(message, true)
  var speech = new SpeechSynthesisUtterance();
  speech.voice = getVoiceFromName("Google US English")
  speech.text = message;
  speech.volume = 0;
  speech.rate = 1;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
  function _wait() {
    if (!window.speechSynthesis.speaking) {
      recognition.start()
      return;
    }
    window.setTimeout(_wait, 200);
  }
  _wait();
}

var voices;
speechSynthesis.onvoiceschanged = function () {
  voices = speechSynthesis.getVoices();
};

function getVoiceFromName(name) {
  var foundVoice = null;
  voices.forEach(function (voice, index) {
    if (voice.name === name) {
      foundVoice = voice;
    }
  });
  return foundVoice;
}