import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  AsyncStorage,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { Font } from 'exponent';
import ModalView from './tagsModal';
import { Container, Header, Title, Content, Footer, Button, Spinner, Input, InputGroup} from 'native-base';
import { Ionicons } from '@exponent/vector-icons';
import config from './config';

var STORAGE_KEY = 'id_token';

export default class Memory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image: this.props.image,
      tags: [],
      filteredTags: [],
      status: false,
      databaseId: '',
      caption: '',
      captionModalVisible: false
    };
  }

   _navigate(page, tag) {
    this.props.navigator.push({
      name: page ? page : 'Homescreen',
      passProps: {
        'username': this.props.username,
        'tag': tag ? tag : null
      }
    });
  }

  async componentDidMount() {
    await Font.loadAsync({
      'pacifico': require('./assets/fonts/Pacifico.ttf'),
      'montserrat': require('./assets/fonts/Montserrat-Regular.ttf'),
      'helvetica': require('./assets/fonts/HelveticaNeueMed.ttf')
    });
    this.setState({ fontLoaded: true });
    if (this.props.prevScene === 'Homescreen') {
      this.uploadPhoto();
    } else {
      this.getMemoryData(this.props.id, 0);
    }
  }

  async openEditCaption() {
    this.setState({captionModalVisible: true});
  }

  async closeEditCaption() {
    this.setState({captionModalVisible: false});
  }

  async saveCaption(newCaption) {
    var context = this;
    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    fetch(config.domain + '/api/memories/id/' + this.state.databaseId, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: null,
        caption: newCaption
      })
    }).then(function(){
      context.setState({caption: newCaption});
      context.closeEditCaption();
    }).catch(function(err) {
      
    })
  }

  async uploadPhoto() {
    var context = this;
    var photo = {
      uri: this.state.image.uri,
      type: 'image/jpeg',
      name: 'image.jpg'
    };

    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    var form = new FormData();
    form.append('memoryImage', photo);
    fetch(config.domain + '/api/memories/upload', 
      {
        body: form,
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer ' + token
        }
      }).then(function(res) {
        var databaseId = JSON.parse(res['_bodyInit']);
        context.getMemoryData(databaseId, 0);
      });
  }

  async getMemoryData(id, pings) {
    var context = this;
    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    fetch(config.domain + '/api/memories/id/' + id, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).then(function(res) {
      var memory = JSON.parse(res['_bodyInit']);
      var microsoftTags = [];
      var clarifaiTags = [];
      var caption = [];
      // it isnt guranteed that microsoft will be before clarifai, correct?
      if (memory.analyses[0].tags && memory.analyses[0].tags.length > 0) {
        microsoftTags = memory.analyses[0].tags;
      }
      if (memory.analyses[1].tags && memory.analyses[1].tags.length > 0) {
        clarifaiTags = memory.analyses[1].tags;
      }

      if (memory.analyses[2].tags && memory.analyses[2].tags.length > 0) {
        caption = memory.analyses[2].tags[0].replace(/(\r\n|\n|\r)/gm, ' ').replace('.', '');
      }
      var analyses = _.uniq(microsoftTags.concat(clarifaiTags));
      var savedTags = memory.tags;
      for (var i = 0; i < savedTags.length; i++) {
        if (analyses.indexOf(savedTags[i]) === -1) {
          analyses.push(savedTags[i]);
        }
      }
      var date = new Date(memory.createdAt).toString().slice(0, 15);
      context.setState({
        tags: analyses, 
        filteredTags: savedTags, 
        status: true, 
        databaseId: id,
        date: date,
        caption: caption
      });
    }).catch(function(err) {
      console.log('ERROR', err);
      // Try pinging database again
      if (pings < 200) {
        context.getMemoryData(id, pings + 1);
      } else {
        var date = new Date().toString().slice(0, 15);
        context.setState({
          tags: [], 
          filteredTags: [], 
          status: true, 
          databaseId: id,
          date: date,
          caption: 'Request Timeout'
        });
      }
    });
  }

  async updateTags(filteredTags) {
    if (filteredTags.length === 0) {
      return;
    }

    this.setState({
      filteredTags: filteredTags
    });

    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    fetch(config.domain + '/api/memories/id/' + this.state.databaseId, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: this.state.filteredTags,
        caption: null
      })
    }).catch(function(err) {
      
    })
  }

  async navigateToSingleTag(tag) {
    //tag is the single tag
    this._navigate('Memories', tag)
  }

  render() {
    var loading = this.state.status ? 
      <ModalView 
        prevScene={this.props.prevScene} 
        tags={this.state.tags} 
        previousTags={this.state.filteredTags}
        updateTags={this.updateTags.bind(this)}
        status={this.state.status}
      />
      : null;
    return (
      <Container>
        <Header>
          <Button transparent onPress={() => this.props.navigator.pop()}>
            <Ionicons name="ios-arrow-back" size={32} style={{color: '#25a2c3', marginTop: 5}}/>
          </Button>
          <Title style={styles.headerText}>{this.state.date}</Title>
          <Button transparent onPress={this._navigate.bind(this)}>
            <Ionicons name="ios-home" size={35} color="#444" />
          </Button>
        </Header>
        <Content 
          contentContainerStyle={
            {
              justifyContent: 'center',
              alignItems: 'center'
            }
          }>
          <Image style={styles.image} resizeMode={Image.resizeMode.contain} source={{uri: this.state.image.uri}}/>
            <View style={styles.captionContainer}>
              <Text style={styles.caption}>{this.state.caption}</Text>
              <Ionicons onPress={this.openEditCaption.bind(this)} name="md-create" size={35} color="#444" />
            </View>
              <Modal
                animationType={'slide'}
                transparent={true}
                visible={this.state.captionModalVisible}
                onRequestClose={() => { alert('Modal has been closed.'); }}
              >
                <CaptionEditor saveCaption={this.saveCaption.bind(this)} cancelEdit={this.closeEditCaption.bind(this)} captions={this.state.caption} />
              </Modal>
          <MemoryDetails 
            status={this.state.status} 
            tags={this.state.filteredTags}
            navigateToSingleTag={this.navigateToSingleTag.bind(this)}
          />
          {loading}
        </Content>
      </Container>
    );
  }
}

class MemoryDetails extends React.Component {
  constructor(props) {
    super(props);
  }

  navigateToTag(tag) {
    this.props.navigateToSingleTag(tag)
  }

  render() {
    var context = this;
    var loading = !this.props.status ?
      <Spinner 
        color='red' 
        animating={true} 
        size='large'
        style={styles.spinner}>
      </Spinner>
      : null;
    return (
      <View>
        <View style={styles.tagsContainer}>
          {
            this.props.tags.map((tag, i) =>
              <Button onPress={context.navigateToTag.bind(this, tag)} key={i} style={styles.tag} rounded info><Text key={i} style={styles.tagText}>{tag}</Text></Button>
            )
          }
        </View>
        {loading}
      </View>
    );
  }
}

class CaptionEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      caption: ''
    };
  }

  saveCaption() {
    this.props.saveCaption(this.state.caption);
  }

  render() {
    return (
      <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.caption}>Type Here to edit caption</Text>
          <TextInput
            placeholderTextColor='#444'
            onChangeText={(text) => this.setState({caption: text})}
            multiline={true}
            style={{height: 40, margin: 20, borderColor: 'grey', borderRightWidth: 0, borderLeftWidth: 0, borderBottomWidth: 1, textAlign: 'center'}}
          />
          <View style={styles.buttonsContainer}>
            <Button primary style={styles.button} onPress={this.saveCaption.bind(this)}>
              <Text style={styles.buttonText}>
                Save
              </Text>
            </Button>
            <Button primary style={styles.button} onPress={this.props.cancelEdit}>
              <Text style={styles.buttonText}>
                Cancel
              </Text>
            </Button>
          </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flex:1,
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'center'
  },

  editGroup: {
    flex:1,
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'center'
  },

  headerText: {
    ...Font.style('pacifico'),
    fontSize: 30,
    color: '#444',
    paddingTop: 25
  },

  tagsContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    flex: 1
  },

  caption: {
    ...Font.style('montserrat'),
    fontSize: 16,
    textAlign: 'center',
    margin: 10
  },

  captionInput: {
    ...Font.style('montserrat'),
    fontSize: 16,
    textAlign: 'center',
  },

  captionContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  button: {
    margin: 10,
    backgroundColor: '#f6755e'
  },

  buttonText: {
    ...Font.style('montserrat'),
    color: '#fff',
    fontSize: 18
  },

  tag: {
    margin: 10
  },

  tagText: {
    ...Font.style('helvetica'),
    color: '#fff',
    fontSize: 16,
    letterSpacing: 1
  },

  image: {
    width: 325,
    height: 325
  },

  spinner: {
    padding: 100
  }
});