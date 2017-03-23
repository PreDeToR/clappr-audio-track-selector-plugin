import {Events, Styler, UICorePlugin, template} from 'Clappr'
import pluginHtml from './public/audio-track-selector.html'
import pluginStyle from './public/style.scss'

const AUTO = -1

export default class AudioTrackSelector extends UICorePlugin {

  static get version() { return VERSION }

  get name() { return 'audio_track_selector' }
  get template() { return template(pluginHtml) }

  get attributes() {
    return {
      'class': this.name,
      'data-audio-track-selector': ''
    }
  }

  get events() {
    //console.log(' Audio-Track events');
    return {
      'click [data-audio-track-selector-select]': 'onLevelSelect',
      'click [data-audio-track-selector-button]': 'onShowLevelSelectMenu'
    }
  }

  bindEvents() {
    //console.log(' Audio-Track bindEvents');
    this.listenTo(this.core, Events.CORE_READY, this.bindPlaybackEvents)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED, this.reload)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_RENDERED, this.render)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_HIDE, this.hideSelectLevelMenu)
  }

  unBindEvents() {
    //console.log(' Audio-Track unBindEvents');
    this.stopListening(this.core, Events.CORE_READY)
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED)
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_RENDERED)
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_HIDE)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVELS_AVAILABLE)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVEL_SWITCH_START)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVEL_SWITCH_END)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_BITRATE)
  }

  bindPlaybackEvents() {
    //console.log(' Audio-Track bindPlaybackEvents');
      var currentPlayback = this.core.getCurrentPlayback()

      this.listenTo(currentPlayback, Events.PLAYBACK_LEVELS_AVAILABLE, this.fillLevels)
      //this.listenTo(currentPlayback, Events.PLAYBACK_LEVEL_SWITCH_START, this.startLevelSwitch)
      //this.listenTo(currentPlayback, Events.PLAYBACK_LEVEL_SWITCH_END, this.stopLevelSwitch)
      this.listenTo(currentPlayback, Events.PLAYBACK_BITRATE, this.updateCurrentLevelVideo)

      //console.log(' Audio-Track bindPlaybackEvents'+currentPlayback);
      var playbackLevelsAvaialbeWasTriggered = currentPlayback.levels && currentPlayback.levels.length > 0
      playbackLevelsAvaialbeWasTriggered && this.fillLevels(currentPlayback.levels)
  }

  reload() {
    //console.log(' Audio-Track reload');
    this.unBindEvents()
    this.bindEvents()
    this.bindPlaybackEvents()
  }

  shouldRender() {
    //console.log(' Audio-Track shouldRender');
    if (!this.core.getCurrentContainer()) return false

    var currentPlayback = this.core.getCurrentPlayback()
    if (!currentPlayback) return false

    var respondsToCurrentLevel = currentPlayback.currentLevel !== undefined
    // Only care if we have at least 2 to choose from
    var hasLevels = !!(this.audiotrack && this.audiotrack.length > 1)

    //console.log(' Audio-Track shouldRender ('+respondsToCurrentLevel+')('+hasLevels+')');
    
    return respondsToCurrentLevel && hasLevels
  }

  render() {
    //console.log(' Audio-Track render');
    if (this.shouldRender()) {
      var style = Styler.getStyleFor(pluginStyle, {baseUrl: this.core.options.baseUrl})

      this.$el.html(this.template({'levels':this.audiotrack, 'title': this.getTitle()}))
      this.$el.append(style)
      this.core.mediaControl.$('.media-control-right-panel').append(this.el)
      this.highlightCurrentLevel()
    }
    return this
  }

  fillLevels(levels, initialLevel = AUTO) {
    //console.log(' Audio-Track fillLevels');
    
    if (this.core.getCurrentPlayback()._hls.audioTracks === undefined) return
    if (this.core.getCurrentPlayback()._hls.audioTracks.length == 0) return
    
    //console.log('start filling in audio tracks');
      
    if (this.selectedLevelId === undefined) this.selectedLevelId = initialLevel
      
    //this.audiotrack = levels
    this.audiotrack = this.core.getCurrentPlayback()._hls.audioTracks
    //console.log(this.audiotrack);
      for(var x=0;x<this.audiotrack.length;x++)
      {
        this.audiotrack[x].id=x;
      }
      
      
      for(var x=0;x<this.audiotrack.length;x++)
      {
        //console.log (x);
        if(this.audiotrack[x].groupId == this.core.getCurrentPlayback()._hls.streamController.levels[+this.core.getCurrentPlayback()._hls.streamController.level].attrs.AUDIO)
        {
          
          //console.log('a group match, selecting default('+this.audiotrack[x].groupId +')('+this.core.getCurrentPlayback()._hls.streamController.levels[+this.core.getCurrentPlayback()._hls.streamController.level].attrs.AUDIO+')');
          if(this.audiotrack[x].default == true)
          {
            //console.log('selecting');
            //console.log(this.audiotrack[x]);
            this.selectedLevelId = x
            
            this.currentLevel=this.audiotrack[this.selectedLevelId]
            this.core.getCurrentPlayback()._hls.audioTrack= this.selectedLevelId;          
            this.highlightCurrentLevel();          
          }
        }
      }
      
    this.configureLevelsLabels()
    //
    this.render()
    
    var group = this.core.getCurrentPlayback()._hls.streamController.levels[this.core.getCurrentPlayback()._hls.streamController.level].attrs.AUDIO;
    this.agroupElement().addClass('hidden');
    this.$('.audio_track_selector ul a[data-level-group-selector-select="'+group+'"]').parent().removeClass('hidden')
    
  }

  configureLevelsLabels() {
    //console.log(' Audio-Track configureLevelsLabels');
    if (this.core.options.AudioTrackSelectorConfig === undefined) return

    for (var levelId in (this.core.options.AudioTrackSelectorConfig.labels || {})) {
      //console.log(' Audio-Track configureLevelsLabels levelId:'+levelId);
      levelId = parseInt(levelId, 10)
      var thereIsLevel = !!this.findLevelBy(levelId)
      thereIsLevel && this.changeLevelLabelBy(levelId, this.core.options.AudioTrackSelectorConfig.labels[levelId])
    }
  }

  findLevelBy(id) {
    //console.log(' Audio-Track findLevelBy');
    //console.log(id);
    //console.log(this.audiotrack);
    var foundLevel
    this.audiotrack.forEach((level) => { if (level.id === id) {foundLevel = level} })
    return foundLevel
  }

  changeLevelLabelBy(id, newLabel) {
    //console.log(' Audio-Track changeLevelLabelBy');
    this.audiotrack.forEach((level, index) => {
      if (level.id === id) {
        this.audiotrack[index].name = newLabel
      }
    })
  }

  onLevelSelect(event) {
    //console.log(' Audio-Track onLevelSelect ('+event.target.dataset.audioTrackSelectorSelect+')');
    //console.log('||'+event.target.dataset.audioTrackSelectorSelect.substr(6)+'||');
    
//     this.selectedLevelId = parseInt(event.target.dataset.audioTrackSelectorSelect.substr(6), 10)
    this.selectedLevelId = event.target.dataset.audioTrackSelectorSelect.substr(6)
    //console.log(''+this.currentLevel.id+' == '+this.selectedLevelId+'');
    if (this.currentLevel.id == this.selectedLevelId) return false;
    this.currentLevel=this.audiotrack[this.selectedLevelId]
    //console.log(this.audiotrack[this.selectedLevelId]);        
    //console.log(this.core.getCurrentPlayback()._hls);
    //console.log(this.core.getCurrentPlayback()._hls.audioTracks);
    
    //this.core.getCurrentPlayback()._hls.audioTrack= this.audiotrack[this.selectedLevelId];
    this.core.getCurrentPlayback()._hls.audioTrack= this.selectedLevelId;

    this.toggleContextMenu()
    this.highlightCurrentLevel();
    event.stopPropagation()
    
    return false
  }
  onShowLevelSelectMenu(event) { this.toggleContextMenu() }

  hideSelectLevelMenu() { this.$('.audio_track_selector ul').hide() }

  toggleContextMenu() { this.$('.audio_track_selector ul').toggle() }

  buttonElement() { return this.$('.audio_track_selector button') }

  levelElement(id) {  return this.$('.audio_track_selector ul a'+(!isNaN(id) ? '[data-audio-track-selector-select="audio_'+id+'"]' : '')).parent() }
  agroupElement(gid) { return this.$('.audio_track_selector ul a'+(!isNaN(gid) ? '[data-level-group-selector-select="'+gid+'"]' : '')).parent() }

  getTitle() { return (this.core.options.AudioTrackSelectorConfig || {}).name }

  startLevelSwitch() { this.buttonElement().addClass('changing') }

  stopLevelSwitch() { this.buttonElement().removeClass('changing') }

  updateText(level) {
    //console.log(' Audio-Track updateText ('+level+')' );
    if (level === -1) {
      this.buttonElement().text(this.findLevelBy(this.audiotrack[0].id).name)
      this.selectedLevelId = this.audiotrack[0].id;
    }
    else {
      this.buttonElement().text(this.findLevelBy(this.audiotrack[level].id).name)
    }
  }
  updateCurrentLevel(info) {
//    console.log(' Audio-Track updateCurrentLevel');
//     console.log(info);
    var level = this.findLevelBy(info.id)
//     console.log(level);
    this.currentLevel = level ? level : null
    this.highlightCurrentLevel()
  }
  updateCurrentLevelVideo(info) {
    //console.log(' Audio-Track updateCurrentLevelVideo');
    
    if(this.audiotrack ==undefined) return;
    if(this.audiotrack.length == 0 ) return;
    
    //console.log(' Audio-Track updateCurrentLevelVideo2');
    
    var group = this.core.getCurrentPlayback()._hls.streamController.levels[info.level].attrs.AUDIO;
    this.agroupElement().addClass('hidden');
    this.$('.audio_track_selector ul a[data-level-group-selector-select="'+group+'"]').parent().removeClass('hidden')

    for(var x=0;x<this.audiotrack.length;x++)
    {
      if(this.audiotrack[x].groupId == this.core.getCurrentPlayback()._hls.streamController.levels[info.level].attrs.AUDIO)
      {
        //this.agroupElement(this.audiotrack[x].groupId).removeClass('hidden')        
//         console.log('a group match, selecting default('+this.audiotrack[x].groupId +')('+this.core.getCurrentPlayback()._hls.streamController.levels[info.level].attrs.AUDIO+')');
        if(this.audiotrack[x].default == true)
        {
          //console.log('selecting');
          //console.log(this.audiotrack[x]);
          this.selectedLevelId = x
          
          if (this.currentLevel.id == this.selectedLevelId) return false;
          
          this.currentLevel=this.audiotrack[this.selectedLevelId]
          this.core.getCurrentPlayback()._hls.audioTrack= this.selectedLevelId;          
          this.highlightCurrentLevel();          
        }
      }
    }
    //
    //
  }
  highlightCurrentLevel() {
    //console.log(' Audio-Track highlightCurrentLevel ('+this.currentLevel.id+')');
    //console.log(this.currentLevel);
    this.levelElement().removeClass('current')
    this.levelElement(this.currentLevel.id).addClass('current')
    this.updateText(this.selectedLevelId)
  }
}
