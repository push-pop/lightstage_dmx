# lightstage_dmx

## Installing
### Prerequisites: 
* Node.js 10
* Enttec DMX USB Firmware



### Installation

Clone this repo anywhere

```
cd /directory/of/install
npm install
```

Edit this line with the proper COM port for your enttec device:

```
const universe = dmx.addUniverse('lightstage', 'enttec-usb-dmx-pro', 'COM8');
```

If you have a dedicated device for TouchOSC edit this line in index.js with the IP Address of the device:
```
var oscClient = new Client('192.168.1.2', 9000);
```

### Running
```
cd /directory/of/install
npm install
node index.js
```

### Mapping DMX

Edit mappings.json with the appropriate channels for each logical light's brightness/color temp:

```
"fader1": {
    "ch_brightness": 1,
    "ch_color": 2,
    "brightness": 0.9597172737121582,
    "temp": 0.14298005402088165,
    "label": "label1"
  }
```


### Installing TouchOSC and Layout

Download TouchOSC and TouchOSC Editor from here: https://hexler.net/products/touchosc

Load lightstage.layout into TouchOSC Editor and install the layout on to your device.

Configure TouchOSC with the following values in settings:

```
Host: IP of Host Machine (the one running this software)
Port (outgoing): 7700
Port (incoming): 9000

Layout: Lightstage
```
