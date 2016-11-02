import React, {Component} from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight
} from 'react-native';

import {AudioRecorder, AudioUtils} from 'react-native-audio';

class AudioButton extends Component {

    state = {
      currentTime: 0.0,
      recording: false,
      stoppedRecording: false,
      stoppedPlaying: false,
      playing: false,
      finished: false,
      delete: true
    };

    prepareRecordingPath(audioPath){
      AudioRecorder.prepareRecordingAtPath(audioPath, {
        SampleRate: 22050,
        Channels: 1,
        AudioQuality: "Low",
        AudioEncoding: "aac",
        AudioEncodingBitRate: 32000
      });
    }

    componentDidMount() {
      let audioPath = AudioUtils.DocumentDirectoryPath + '/recording.aac';
      this.prepareRecordingPath(audioPath);
      AudioRecorder.onProgress = (data) => {
        this.setState({currentTime: Math.floor(data.currentTime)});
      };
      AudioRecorder.onFinished = (data) => {
        this.setState({finished: data.finished});
        console.log(`Finished recording: ${data.finished}`);
      };
    }

    _renderButton() {
      // var style = (active) ? styles.activeButtonText : styles.buttonText;
      var context = this;
      var title, onPress, active;
      var includeDelete = false;
      currentTime: 0.0,
      recording: false,
      stoppedRecording: false,
      stoppedPlaying: false,
      playing: false,
      finished: false
      //initial state
      if (this.state.recording) {
        title = 'Stop';
        onPress = function() {
          this._stop();
        }       
      } else if (this.state.playing) {
        title = 'Stop';
        includeDelete = true;
        onPress = function() {
          this._stop();
        }       
      } else if (this.state.stoppedRecording) {
        title = 'Play';
        onPress = function() {
          this._play();
        }  
      } else if (this.state.stoppedPlaying) {
        title = 'Record';
        includeDelete = true;
        onPress = function() {
          this._record();
        }  
      } else {
        title = 'Record';
        onPress = function() {
          this._record();
        } 
      }

      return !includeDelete ? (
        <TouchableHighlight style={styles.button} onPress={onPress}>
          <Text style={style}>
            {title}
          </Text>
        </TouchableHighlight>
      ) : (
        <TouchableHighlight style={styles.button} onPress={onPress}>
          <Text style={style}>
            {title}
          </Text>
        </TouchableHighlight>
        <TouchableHighlight style={styles.button} onPress={function() {
          context.setState({delete: true});
        }}>
          <Text style={style}>
            Delete
          </Text>
        </TouchableHighlight>
      );
    }

    // _pause() {
    //   if (this.state.recording){
    //     AudioRecorder.pauseRecording();
    //     this.setState({stoppedRecording: true, recording: false});
    //   }
    //   else if (this.state.playing) {
    //     AudioRecorder.pausePlaying();
    //     this.setState({playing: false, stoppedPlaying: true});
    //   }
    // }

    _stop() {
      if (this.state.recording) {
        AudioRecorder.stopRecording();
        this.setState({stoppedRecording: true, recording: false});
      } else if (this.state.playing) {
        AudioRecorder.stopPlaying();
        this.setState({playing: false, stoppedPlaying: true});
      }
    }

    _record() {
      if(this.state.stoppedRecording){
        let audioPath = AudioUtils.DocumentDirectoryPath + '/recording.aac';
        this.prepareRecordingPath(audioPath);
      }
      AudioRecorder.startRecording(); 
      this.setState({recording: true, playing: false, delete: false});
    }

   _play() {
      if (this.state.recording) {
        this._stop();
        this.setState({recording: false});
      }
      AudioRecorder.playRecording();
      this.setState({playing: true});
    }

    render() {

      return (
        <View style={styles.container}>
          <View style={styles.controls}>
            {this._renderButton("RECORD", () => {this._record()}, this.state.recording )}
            {this._renderButton("STOP", () => {this._stop()} )}
            {this._renderButton("PAUSE", () => {this._pause()} )}
            {this._renderButton("PLAY", () => {this._play()}, this.state.playing )}
            <Text style={styles.progressText}>{this.state.currentTime}s</Text>
          </View>
        </View>
      );
    }
  }

  var styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#2b608a",
    },
    controls: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    progressText: {
      paddingTop: 50,
      fontSize: 50,
      color: "#fff"
    },
    button: {
      padding: 20
    },
    disabledButtonText: {
      color: '#eee'
    },
    buttonText: {
      fontSize: 20,
      color: "#fff"
    },
    activeButtonText: {
      fontSize: 20,
      color: "#B81F00"
    }

  });

export default AudioButton;