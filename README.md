# Clappr Audio Track Selector Plugin
Designed to work with HLS video streams.

<img src="https://raw.githubusercontent.com/PreDeToR/clappr-audio-track-selector-plugin/master/screenshot.png"/>

## Usage

Add both Clappr and Audio Track Selector plugin scripts to your HTML:

```html
<head>
  <script type="text/javascript" src="http://cdn.clappr.io/latest/clappr.min.js"></script>
  <script type="text/javascript" src="dist/audio-track-selector.js"></script>
</head>
```

Then just add `AudioTrackSelector` into the list of plugins of your player instance:

```javascript
var player = new Clappr.Player({
  source: "http://your.video/here.m3u8",
  plugins: {
    'core': [AudioTrackSelector]
  }
});
```


## Compatibility
Only been tested on :
PC:
  FireFox v52.0
  Opera v30.0
  Chrome/Chromium v56.0.2924
Mobile:
  Android v5.0.1 (Default Browser,Chrome)
  iOS v10.2.1 (Default Browser,Chrome,Opera Mini)


All the playbacks that follow these rules:

* must trigger `PLAYBACK_LEVELS_AVAILABLE` with an ordered array of levels 
* to have a property `levels`, initialized with `[]` and then after filled with the proper levels
* to have a property `currentLevel` (set/get), the level switch will happen when id (currentLevel) is changed  (`playback.currentLevel = id`)
* optionally, trigger events: `PLAYBACK_LEVEL_SWITCH_START` and `PLAYBACK_LEVEL_SWITCH_END`
* `id=-1` will be always the `Auto` level
