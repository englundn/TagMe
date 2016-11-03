import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  AsyncStorage,
  AlertIOS,
  Modal,
  TextInput
} from 'react-native';
import { Font } from 'exponent';
import { Container, Content, Button } from 'native-base';
import { Ionicons } from '@exponent/vector-icons';
//trying to get things to highlight automatically when you add them

export default class ModalView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      filteredTags: [],
      customTag: '',
      modalTags: props.tags.sort(),
      previousTags: props.previousTags
    };
  }

  async componentDidMount() {
    await Font.loadAsync({
      'montserrat': require('./assets/fonts/Montserrat-Regular.ttf'),
      'helvetica': require('./assets/fonts/HelveticaNeueMed.ttf')
    });
    this.setState({ fontLoaded: true });
    if (this.props.prevScene === 'Homescreen') {
      this.setState({modalVisible: true});
    } else {
      this.setState({modalVisible: false});
    }
  }

  setModalVisible(show) {
    this.setState({modalVisible: show});
  }

  addTag(tag) {
    var updatedTags = this.state.filteredTags;
    updatedTags.push(tag);
    this.setState({
      filteredTags: updatedTags
    });
  }

  addCustomTag() {
    var name = this.state.customTag.toLowerCase();
    //add to all tags
    var allTags = this.state.modalTags;
    allTags.push(name);
    //add to previous tags (selects)
    var prevTags = this.state.previousTags;
    prevTags.push(name);
    console.log('prev tags', prevTags, 'all tags', allTags);
    this.setState({
      previousTags: prevTags,
      modalTags: allTags,
      customTag: ''
    });
  }

  removeTag(tag) {
    var updatedTags = this.state.filteredTags;
    updatedTags.splice(updatedTags.indexOf(tag), 1);
    this.setState({
      filteredTags: updatedTags
    });
  }

  pressDeleteButton() {
    var context = this;
    AlertIOS.alert(
      'Are you sure you want to delete?',
      'This will delete this memory permanently.',
      [
        {text: 'Delete', onPress: () => context.props.deleteMemory(context.props.databaseId, 0)},
        {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}
      ]
    );
  }


  onSubmit() {
    this.props.updateTags(this.state.filteredTags);
    this.setState({
      filteredTags: []
    });
    this.setState({modalVisible: false});
  }

  render() {
    return (
      <View>
        <Button onPress={this.setModalVisible.bind(this, true)} style={styles.button}>
          <Text style={styles.buttonText}>Edit Tags</Text>
        </Button>
        <Button onPress={this.pressDeleteButton} style={styles.deleteButton}>
          <Text style={styles.buttonText}>Delete</Text>
        </Button>
        <Modal
          animationType={'slide'}
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => { alert('Modal has been closed.'); }}
        >
        <Content style={styles.modal}>
          <View style={styles.modalContent}>
            <Button transparent onPress={this.setModalVisible.bind(this, false)}>
              <Ionicons name="ios-close" size={40} color="#444" />
            </Button>
            <View><Text style={styles.modalText}>Select tags to save</Text></View>
            <View>
              <View style={styles.tagsContainer}>
              {
                this.state.modalTags.map((tag, i) => {
                  return (
                     <Tag key={i}
                      name={tag}
                      addTag={this.addTag.bind(this)}
                      removeTag={this.removeTag.bind(this)}
                      selected={this.state.previousTags.includes(tag)}
                    />
                  )
                })
              }
              </View>
            </View>
            <View style={styles.customTagContainer}>
              <TextInput
                placeholderTextColor='#444'
                onChangeText={(text) => this.setState({customTag: text})}
                multiline={true}
                value={this.state.customTag}
                style={styles.customTagInput}
              />
              <Button primary onPress={this.addCustomTag.bind(this)} style={styles.button}>
                <Text style={styles.buttonText}> + </Text>
              </Button>
              <Button primary onPress={this.onSubmit.bind(this)} style={styles.button}>
                <Text style={styles.buttonText}>Save</Text>
              </Button>
            </View>
          </View>
         </Content>
        </Modal>
      </View>
    );
  }
}

class Tag extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: this.props.selected,
      allTags: []
    };
  }

  async componentWillMount() {
    if (this.props.selected) {
      this.props.addTag(this.props.name);
    }
  }


  selectTag() {
    this.setState({
      selected: !this.state.selected
    });
    if (!this.state.selected) {
      this.props.addTag(this.props.name);
    } else {
      this.props.removeTag(this.props.name);
    }
  }

  render() {
    return (
      <Button 
        bordered={!this.state.selected} 
        rounded 
        info
        onPress={this.selectTag.bind(this)}
        style={styles.tag}
      >
        <Text style={this.state.selected ? [styles.tagText, styles.tagSelected] : [styles.tagText, styles.tagNotSelected]}>{this.props.name}</Text>
      </Button>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  },

  modalContent: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },

  customTagContainer: {
    flexDirection: 'row',
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalText: {
    ...Font.style('montserrat'),
    fontSize: 30,
    color: '#444'
  },

  tagsContainer: {
    marginTop: 30,
    marginBottom: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
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

  customTagInput: {
    ...Font.style('montserrat'),
    fontSize: 16,
    height: 40, 
    width: 120, 
    margin: 20, 
    borderColor: 'grey', 
    borderRightWidth: 0, 
    borderLeftWidth: 0, 
    borderBottomWidth: 1, 
    textAlign: 'center'
  },

  tag: {
    margin: 10
  },

  tagText: {
    ...Font.style('helvetica'),
    fontSize: 16,
    letterSpacing: 1
  },

  tagSelected: {
    color: '#fff'
  },

  tagNotSelected: {
    color: '#25a2c3'
  }
});