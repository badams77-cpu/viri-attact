import React, {Component} from 'react';
import {Platform, Image, View, StyleSheet, Text, Button, Modal, TouchableOpacity} from 'react-native';
import {connect} from 'react-redux';
import {ADD_SCORE, ADD_LIFE, SUB_LIFE, RESTART, END_RESTART} from '../actions/Actions';
import constants from "./Constants";
import spriteData from './SpriteData';
import ImageOverlay from './ImageOverlay';
import spriteGraphics from './SpriteGraphics';
//import {AdMobBanner, AdMobRewarded} from 'expo-ads-admob';
import mobileAds, { MaxAdContentRating, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import tips from './Tips';

class ScoreBoard extends Component {

  constructor(props){
    super(props);

    this.state = {
      adsInitalised: false,
      adLoaded: false,
      tip: 0,
      interval: null,
      modalVisible: false
    };
  }

    componentDidMount(){
    mobileAds()
                          .setRequestConfiguration({
                            // Update all future requests suitable for parental guidance
                            maxAdContentRating: MaxAdContentRating.PG,

                            // Indicates that you want your content treated as child-directed for purposes of COPPA.
                            tagForChildDirectedTreatment: true,

                            // Indicates that you want the ad request to be handled in a
                            // manner suitable for users under the age of consent.
                            tagForUnderAgeOfConsent: true,

                            // An array of test device IDs to allow.
                          })
                          .then(() => {
                            // Request config successfully set!
                          })  .initialize()
                              .then(adapterStatuses => {
                                      this.setState({...this.state, adsInitalised: true});
                                          const adUnitID = Platform.select({
                                            ios: constants.IOS_AD,
                                            android: constants.ANDROID_AD
                                          });
                                          this.initRewardAds(adUnitID);
        });
        this.state.interval = setInterval( ()=> this.nextTip(), constants.TIP_TIMEOUT);
    }

    componentWillUnmount(){
      if (this.state.interval!=null){ clearInterval(this.state.interval); }
    }

  nextTip = ()=>{
    let tip = this.state.tip;
    tip++;
    if (tip>=tips.length){ tip=0;}
    this.setState({...this.state, tip: tip});
  }



  setModalVisible = (bol) =>{
    this.setState({ modalVisible: bol});
  }

  rewarded = RewardedAd.createForAdRequest( Constants.ANDROID_REWARD_AD, {
    requestNonPersonalizedAdsOnly: false,
    keywords: ['games']
  });


  initRewardAds = async () => {
    // Display a rewarded ad
    const unsubscribeLoaded =  () => {
      this.state.setState({...this.state, adLoaded: true});
    };
    const unsubscribeEarned = this.rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
          this.props.onAddLife(constants.AD_EXTRA_LIFE);
          this.state.setState({ adLoaded: false});
          this.rewarded.load();
      }
    );
    rewarded.load();
    rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
    			// if we close ads modal will close too
      this.setModalVisible(false);
    });

  };

  bannerError = (err)=>{
    console.log(err);
  }

  render(){

//    console.log("adUnitID",adUnitID);
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
      },
      text: {
        flex: 1,
        color: '#ffffff'
      }
    });

    const styles1 = StyleSheet.create({
          modalView: {
            margin: 20,
            backgroundColor: "white",
            borderRadius: 5,
            padding: 35,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
          openButton: {
            backgroundColor: "#F194FF",
            borderRadius: 20,
            padding: 10,
            marginTop:10,
            elevation: 2,
          },
          textStyle: {
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
          },
          modalText: {
            marginBottom: 15,
            textAlign: "center",
          },
        });


    let but = this.props.game_over? (<Button onPress={this.props.onRestart} title='Restart' color='#ff3300'/>):null;
    let pickCount = 0;
    let pickups = [];
    for(var key in  this.props.pickups){
       if (!this.props.pickups.hasOwnProperty(key)) continue;
       if (key.startsWith('life')) continue;
       let mySpriteData = spriteData[key];
       let src = spriteGraphics[mySpriteData['left'][0]];
       pickCount++;
       pickups.push( <Image source={src} style={{width: 60, height: 60}} key={pickCount} />);
    }
    let roomStatus = this.props.deadrooms[this.props.room]!=null ? 'Room Clear' : 'Room Not Clear';
    let roomCount = Object.keys(this.props.deadrooms).length;
    return (
      <View style={styles.container}>
      <View>
        <View style={{flex: 1, flexDirection: 'row'}}>{pickups}</View>
      <Text style={styles.text}>Score: {this.props.score}</Text>
      <Text style={styles.text}>Life: {this.props.life}</Text>
      <Text style={styles.text}>{tips[this.state.tip]}</Text>
      <Text style={styles.text}>{roomStatus}</Text>
      <Text style={styles.text}>Cleared {roomCount} rooms out of {constants.ROOM_COUNT}</Text>
      {but}
      <TouchableOpacity                style={{ ...styles1.openButton, backgroundColor: "#2196F3" }}
               onPress={() => {
                  if (this.state.adLoaded){
                    this.reward.show();
                    this.setModalVisible(true);
                  }
               }}
            >
            <Text style={styles1.textStyle}>View Ad and Gain Life</Text>
            </TouchableOpacity>
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.modalVisible}
            >
              <View style={styles1.modalView}>
                    <TouchableOpacity style={{ ...styles1.openButton, backgroundColor: "#2196F3" }}
                          onPress={ () => {
                            this.initRewardAds();
                          } }
                    >
                     <Text style={styles1.modalText}>
                          Watch Video Ads to gain life
                     </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                     style={{ ...styles1.openButton, backgroundColor: "#2196F3" }}
                       onPress={() => {
                         this.setModalVisible(false);
                        }}
                  >
                    <Text style={styles1.textStyle}>Back To Game</Text>
                 </TouchableOpacity>
              </View>
            </Modal>

              </View>
      </View>
      );
  }


}

const mapStateToProps = (state)=>{
  return { score : state.score, life: state.player_life, game_over: state.game_over,
   pickups: state.pickups, deadrooms: state.deadrooms, room: state.room };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onRestart: () => { console.log("Restart Pressed"); dispatch({type: RESTART}); },
    onAddLife: (xlife) => { dispatch({type: ADD_LIFE, life: xlife }); }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ScoreBoard);
