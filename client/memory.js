import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  AsyncStorage,
  AlertIOS,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { Font } from 'exponent';
import { Components } from 'exponent';
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
      location: this.props.location || {latitude: null, longitude: null},
      tags: [],
      filteredTags: [],
      status: false,
      databaseId: '',
      caption: '',
      captionModalVisible: false,
      locationDescrip: this.props.locationDescrip || []
    };
  }

  _navigate(page, tag) {
    this.props.navigator.push({
      name: page ? page : 'Homescreen',
      passProps: {
        'username': this.props.username,
        'tag': tag ? tag : null,
        'prevScene': 'Memory'
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

  pressDeleteButton() {
    var context = this;
    console.log('Pressed delete button');
    AlertIOS.alert(
      'Are you sure you want to delete?',
      'This will delete this memory permanently.',
      [
        {text: 'Delete', onPress: () => context.deleteMemory(context.state.databaseId, 0)},
        {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}
      ]
    );
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
    //form.append('longitude', this.state.location.longitude);
    //form.append('longitude', this.state.location.longitude);
    //form.append('locationDescrip', this.state.locationDescrip);
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
        

        fetch(config.domain + '/api/memories/id/update/' + databaseId, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            latitude: context.state.location.latitude,
            longitude: context.state.location.longitude,
            locationDescrip: context.state.locationDescrip
          })
        }).then(function(response) {
          context.getMemoryData(databaseId, 0);
        })
        
      });
  }

  async deleteMemory(id, pings) {

    var context = this;
    console.log(context.props.navigator.length);

    try {
      var token =  await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.log('AsyncStorage error: ' + error.message);
    }

    fetch(config.domain + '/api/memories/id/' + id, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).then(function(res) {
      console.log(res.status);
      if (res.status === '200') {
        console.log('Memory deleted');
      }
      context._navigate();
    }).catch(function(err) {
      console.log('ERROR', err);
      // Try pinging database again
      if (pings < 200) {
        context.deleteMemory(id, pings + 1);
      } else {
        console.log('token timed out');
      }
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
      var latitude = memory.latitude;
      var longitude = memory.longitude;
      var locationDescrip = memory.locationDescrip;
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
        caption: caption,
        location: {latitude: latitude, longitude: longitude},
        locationDescrip: locationDescrip
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
          caption: 'Request Timeout',
          location: {latitude: null, longitude: null},
          locationDescrip: ''
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
        databaseId={this.state.databaseId}
        deleteMemory={this.deleteMemory.bind(this)}
        prevScene={this.props.prevScene} 
        tags={this.state.tags} 
        previousTags={this.state.filteredTags}
        updateTags={this.updateTags.bind(this)}
        status={this.state.status}
        location={this.state.location}
      />
      : null;
    return (
      <Container>
        <Header>
          <Button transparent onPress={() => this.props.navigator.pop()}>
            <Ionicons name="ios-arrow-back" size={32} style={{color: '#25a2c3', marginTop: 5}}/>
          </Button>
          <Title style={styles.headerText}>{this.state.date}</Title>
          <Button transparent onPress={this._navigate.bind(this, "Homescreen")}>
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
          <LocationInfo locationDescrip = {this.state.locationDescrip || []}/>  
          <Image style={styles.image} resizeMode={Image.resizeMode.contain} source={{uri: this.state.image.uri}}/>
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{this.state.caption}</Text>
            <Ionicons
              onPress={this.openEditCaption.bind(this)}
              name="md-create"
              size={35}
              color="#444"
            /> 
          </View>
            <Modal
              animationType={'slide'}
              transparent={true}
              visible={this.state.captionModalVisible}
              onRequestClose={() => { alert('Modal has been closed.'); }}
            >
              <CaptionEditor
                caption={this.state.caption}
                saveCaption={this.saveCaption.bind(this)}
                cancelEdit={this.closeEditCaption.bind(this)}
                captions={this.state.caption} />
            </Modal>
          <MemoryDetails 
            status={this.state.status} 
            tags={this.state.filteredTags}
            navigateToSingleTag={this.navigateToSingleTag.bind(this)}
          />
          {loading}

          <Map location={this.state.location} />
          <View style={styles.deleteContainer}>
            <Button onPress={this.pressDeleteButton.bind(this)} style={styles.deleteButton}>
              <Text style={styles.buttonText}>Delete</Text>
            </Button>
          </View>
        </Content>
      </Container>
    );
  }
}


class LocationInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    console.log(this.props.locationDescrip);
    return this.props.locationDescrip.length === 0 ? 
    (<Text></Text>) : 
    (
      <View style={styles.locationContainer}>
        <Ionicons name="ios-pin" size={15} color="#444" />
        <Text style={styles.locationText}>{'Taken at ' + this.props.locationDescrip.join(', ')}</Text>
      </View>
    );
  }
}

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: this.props.location.latitude,
        longitude: this.props.location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      displayMap: false
    } 
  }

  componentWillReceiveProps(nextProps) {
    var region = this.state.region;
    region.latitude = nextProps.location.latitude || null;
    region.longitude = nextProps.location.longitude || null;
    this.setState({
      region: region,
    });

    if (region.longitude !== null || region.latitude !== null) {
      this.setState({
        displayMap: true
      })
    }
  }

  render() {
    return this.state.displayMap ? 
    (
      <Components.MapView
        style={styles.map}
        region={this.state.region}
      >
        <Components.MapView.Marker
          coordinate={{latitude: this.state.region.latitude, longitude: this.state.region.longitude}}
        />
      </Components.MapView>
    ) : 
    (<Text></Text>)
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
      caption: this.props.caption
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
            defaultValue={this.props.caption}
            placeholderTextColor='#444'
            onChangeText={(text) => this.setState({caption: text})}
            multiline={true}
            style={styles.captionInput}
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

  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  locationText: {
    fontSize: 12,
    color: '#717782',
    paddingLeft: 5
  },

  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
    margin: 10
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
    margin: 10,
    width: 290
  },

  captionInput: {
    ...Font.style('montserrat'),
    textAlign: 'center',
    fontSize: 16,
    height: 40, 
    margin: 20, 
    borderColor: 'grey', 
    borderRightWidth: 0, 
    borderLeftWidth: 0, 
    borderBottomWidth: 1, 
  },

  captionContainer: {
    flexDirection: 'row',
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

  deleteButton: {
    width: 100,
    margin: 10,
    backgroundColor: '#B33A3A'
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
  },

  map: {
    height: 300,
    width: 300
  }
});