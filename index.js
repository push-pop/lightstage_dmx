const DMX = require('dmx')
var mappings = require('./mapping.json')
var presets = require('./presets.json')
const fs = require('fs');

var faders = mappings;

var {
  Server,
  Client
} = require('node-osc');

var oscServer = new Server(7700, '0.0.0.0');
var oscClient = new Client('192.168.88.211', 9000);

const dmx = new DMX();

const universe = dmx.addUniverse('lightstage', 'enttec-usb-dmx-pro', 'COM8');

var channels = {}

let on = false;
let isChanging = false;
let needSave = false;
let needsUpdate = true;

const map_range = (value, low1, high1, low2, high2) => {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

const updateChannels = () => {
  for (var key in faders) {
    var fader = faders[key];

    channels[fader.ch_brightness] = toDMX(fader.brightness);
    channels[fader.ch_color] = toDMX(fader.temp);
  }
}

const setAllColor = (val) => {
  for (var key in faders) {
    faders[key].temp = map_range(val, 2600, 6000, 0, 1);
  }
  console.log('temp' + map_range(val, 2600, 6000, 0, 1));
}

const toPercent = (val)=>{
  var out = `${val*100}%`;
  console.log(out);
  return `${Math.floor(val*100)}%`
}

const toDMX = (val) => {
  return Math.floor(val * 255);
}

const toColorTemp = (val)=>{
  return `${Math.floor(map_range(val, 0, 1, 2600, 6000))}K`;
}

updateChannels();

console.log(channels);

universe.update(channels);

oscServer.on('message', function (msg) {

  var endpt = msg[0].split('/');
  var cmd = endpt[1];
  console.log(msg);
  if (endpt.length > 2) {

    isChanging = true;
    needSave = true;
    needsUpdate = true;

    if (cmd == 'brightness') {
      var fader = endpt[2];

      faders[fader].brightness = msg[1];
      console.log('brightness ' + fader + " to " + msg[1])
      oscClient.send('/brightness/' + faders[fader].label, toPercent(faders[fader].brightness));

    } else if (cmd == 'color') {
      var fader = endpt[2];

      faders[fader].temp = msg[1];
      console.log('color ' + fader + " to " + msg[1])
      oscClient.send('/color/' + faders[fader].label, toColorTemp(faders[fader].temp));
    } else if (cmd == 'preset') {
      var presetCmd = endpt[2];

      if (presetCmd == 'allOn') {
        console.log('allOn');
        for (var key in faders) {
          faders[key].brightness = 1;
          console.log(channels);
        }
      } else if (presetCmd == 'allOff') {
        console.log('allOff');
        for (var key in faders) {
          faders[key].brightness = 0;
        }
      } else if (presetCmd == 'load') {
        console.log('load preset ' + endpt[3]);
        var preset = presets[endpt[3]];
        console.log(preset);
        if (preset)
          faders = JSON.parse(JSON.stringify(preset));
        else
          console.log("Preset not found");
      } else if (presetCmd == 'save') {
        console.log('save preset ' + endpt[3]);
        presets[endpt[3]] = JSON.parse(JSON.stringify(faders));

        fs.writeFileSync('./presets.json', JSON.stringify(presets, null, 2));
      } else if (presetCmd == 'color') {
        console.log('set color to ' + endpt[3]);
        setAllColor(endpt[3]);
      }
    }
  }

  updateChannels();
  universe.update(channels);
});




const updateClients = (key, value) => {
  oscClient.send(key, value);
}

setInterval(() => {
  isChanging = false;

  if (needsUpdate) {
    for (var key in faders) {
      var fader = faders[key];

      oscClient.send('/brightness/' + key, fader.brightness);
      oscClient.send('/color/' + key, fader.temp);

      oscClient.send('/brightness/' + fader.label, toPercent(fader.brightness));
      oscClient.send('/color/' + fader.label, toColorTemp(fader.temp));

      needsUpdate = false;
    }
  }

}, 200);

setInterval(() => {
  if (needSave && !isChanging) {
    fs.writeFileSync('./mapping.json', JSON.stringify(mappings, null, 2));
    console.log('Saved!');
  }

  needSave = false;
}, 5000);

process.on('SIGINT', function () {
  console.log("Got EXIT");
  universe.updateAll(0);
  process.exit();
});