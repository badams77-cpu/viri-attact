import React, {Component } from 'react';
import {StyleSheet, Image, View, Dimensions, PanResponder, Pressable } from 'react-native';
import background from './Background.js';
import map from './Maps.js';
import SpriteEngine from './SpriteEngine.js';
import constants from './Constants'
import {connect} from 'react-redux';

class GameWorld extends Component {

    gcount = 0;
    groom = '';


    constructor(props){
       super(props);
       groom = constants.START_ROOM;
       this.state = { room: constants.START_ROOM,
         playerStart: { x: constants.PLAYER_START_X, y: constants.PLAYER_START_Y},
         onPressInHandler: null,
         onPressOutHandler: null,
         game: 0
       };
    }

    setHandlers( handlers){
      this.setState({onPressInHandler: handlers.onPressIn, onPressOutHandler: handlers.onPressOut});
    }

    onPressOut = (event) =>{
      if (this.state.onPressOutHandler){ this.state.onPressOutHandler(event); } else { console.log("No press out handler")}
//     console.log("Move ", {dx: this.state.startX-event.nativeEvent.locationX, dy: this.state.startY-event.nativeEvent.locationY})
    }

    onPressIn = (event)=>{
//      console.log("PressIn event",event);
//      this.setState({ startX: event.nativeEvent.locationX, startY : event.nativeEvent.locationY })
      if (this.state.onPressInHandler){ this.state.onPressInHandler(event);} else { console.log("No press in handler")}
    }

    render(){
        if (this.props.restart){
          let mygcount = this.gcount;
          groom = constants.START_ROOM;
          setTimeout( ()=> {
            console.log("Game world restart:");
            if (mygcount==this.gcount){
              this.gcount++;
              this.setState({ room: constants.START_ROOM, game: this.state.game+1});
              }
            }
            ,10);

        }
        if (this.props.change_room){
          let mygcount1 = this.gcount;
                    setTimeout( ()=> {
                      console.log("Game world room:");
//          if (mygcount1==this.gcount){
            if (this.props.room!=groom && this.props.room!=this.state.room){
                      groom = this.props.room;
                      this.setState({ room: this.props.room, game: this.state.game+1});
            }
//          }
          },10);

        }
        const TILE_STYLE = "tileStyle_";
        const window = Dimensions.get('window');
        let window_width = window.width;
        let window_height = window.height;
        if (window_width<window_height){
          window_height = window_width;
        } else {
          window_width = window_height;
        }
        const room = map[this.state.room];
        const myMap = room['map'];
        let base = room['base'];
        if (base==null){
          console.log("room  "+this.state.room+" no base defined");
          base='island';
        }
        const myBackground = background[base];
        const TILES_HEIGHT = Math.floor(window_height/myMap.length);
        const TILES_WIDTH = Math.floor(window_width/myMap[0].length);
        let styles = {};
        let tiles = [];
        let style_counter = 0;
        let initialSprites = room['sprites'];
        for(y=0; y<myMap.length;y++){
            for(x=0; x< myMap[y].length;x++){
                styles[TILE_STYLE+style_counter++] = {
                  position: 'absolute',
                  width: TILES_WIDTH,
                  height: TILES_HEIGHT,
                  left: x*TILES_WIDTH,
                  top: y*TILES_HEIGHT,
                  opacity: 1,
                    resizeMode: "cover",
                  backgroundColor: '#000000',
                  zIndex: 0,
                };
            }
        }
        const style = StyleSheet.create(styles);
        style_counter =0;
        for(y=0; y<myMap.length;y++){
            for(x=0; x< myMap[y].length;x++){
               tiles.push( <Image style={style[TILE_STYLE+style_counter]} source={myBackground[myMap[y][x]]} key={style_counter}/> );
               style_counter++;
            }
        }
        return (
           <Pressable onPressOut={this.onPressOut} onPressIn={this.onPressIn} style={{width: window_width, height: window_width}}>
           <View style={{flex:1, backgroundColor: '#0000000' }} >
             {tiles}
                          <SpriteEngine
                            setHandlersCallback={this.setHandlers.bind(this)}
                            window_width={window_width}
                            window_height={window_height}
                            tile_width={TILES_WIDTH}
                            tile_height={TILES_HEIGHT}
                            initial_sprites={initialSprites}
                            player_start={this.state.playerStart}
                            room={this.props.room}
                          />
           </View>
           </Pressable>
        );
        this.refs.touch.setOpacityTo( 100, 0);
    }

}

const mapStateToProps = (state)=>{
  return { score : state.score, restart: state.restart, room: state.room, change_room: state.change_room};
}

export default connect(mapStateToProps)(GameWorld);