var midi, data;
// start talking to MIDI controller
navigator.requestMIDIAccess().then(
  (midi) => midiReady(midi),
  (err) => console.log("Something went wrong", err)
);

function midiReady(midi) {
  // Also react to device changes.
  //midi.addEventListener('statechange', (event) => initDevices(event.target));
  initDevices(midi);
  selectIn.addEventListener("change", (event) => {
    console.log(`You like ${event.target.value}`);
    startListening();
  });
}

function initDevices(midi) {
  // Reset.
  midiIn = [];
  midiOut = [];
  currentIn = null;

  // MIDI devices that send you data.
  const inputs = midi.inputs.values();
  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    midiIn.push(input.value);
  }

  // MIDI devices that you send data to.
  const outputs = midi.outputs.values();
  for (
    let output = outputs.next();
    output && !output.done;
    output = outputs.next()
  ) {
    midiOut.push(output.value);
  }

  displayDevices();
  startListening();
}

function displayDevices() {
  selectIn.innerHTML = midiIn
    .map((device) => `<option>${device.name}</option>`)
    .join("");
  selectOut.innerHTML = midiOut
    .map((device) => `<option>${device.name}</option>`)
    .join("");
}

function startListening() {
  if (currentIn !== null) {
    currentIn.removeEventListener("midimessage", midiMessageReceived);
  }
  const device = midiIn[selectIn.selectedIndex];
  console.log(device);
  currentIn = device;
  device.addEventListener("midimessage", midiMessageReceived);
}

function sendMidiMessage(msg) {
  const device = midiOut[selectOut.selectedIndex];
  device.send(msg);
}

function midiMessageReceived(event) {
  const NOTE_ON = 9;
  const NOTE_OFF = 8;

  msg = event.data;
  const cmd = event.data[0] >> 4;
  const channel = event.data[0] & 0xf;
  const pitch = event.data[1];
  const velocity = event.data.length > 2 ? event.data[2] : 1;

  if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
    console.log(
      `NoteOff from ${event.srcElement.name} on channel: ${
        channel + 1
      }, pitch:${pitch}, velocity: ${velocity}`
    );
    msg = [(NOTE_OFF << 4) | channel, pitch, velocity];
  } else if (cmd === NOTE_ON) {
    console.log(
      `NoteOn from ${event.srcElement.name} on channel: ${
        channel + 1
      }, pitch:${pitch}, velocity: ${velocity}`
    );
  }
  sendMidiMessage(msg);
}
