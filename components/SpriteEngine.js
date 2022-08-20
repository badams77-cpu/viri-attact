import React, {Component } from 'react';
import {StyleSheet, View, Dimensions } from 'react-native';
import spriteData from './SpriteData';
import ImageOverlay from './ImageOverlay';
import spriteGraphics from './SpriteGraphics';
import FastImage from 'react-native-fast-image';
import constants from './Constants';
import {connect} from 'react-redux';
import {ADD_SCORE, ADD_LIFE, SUB_LIFE, PICKUP, RESTART,
END_RESTART, CHANGE_ROOM, END_CHANGE_ROOM, CLEAR_ROOM} from '../actions/Actions';
import maps from './Maps';
import hardness from './Hardness';
import { Audio } from 'expo-av';
import soundFiles from './Sounds';

class SpriteEngine extends Component {

    gcount = 0;

    groom ='';

    sounds = {


    };


    _panResponder = {};
    weapon = 'syringe';

    constructor(props){
       super(props);
       props.setHandlersCallback({ onPressIn: this.onPressInHandler, onPressOut: this.onPressOutHandler});
       let sprites = this.startSprites(props);
       groom = props.room;
       this.state = {
         window_width: props.window_width,
         window_height: props.window_height,
         tile_width: props.tile_width,
         tile_height: props.tile_height,
         sprites: sprites,
         interval: null,
         pressStartX: 0,
         pressStartY: 0,
         player_start: {x: props.player_start.x, y: props.player_start.y},
         initial_sprites: props.initial_sprites,
         room: props.room,
         change_room: false,
         game: 0,
       };
    }

   startSprites = (props)=>{
            let sprites = [];
            let initial_sprites = props['initial_sprites'];
            // Start player
            sprites.push({
              spriteName: 'player',
              x: props.player_start.x*props.tile_width,
              y: props.player_start.y*props.tile_height,
              dx: 0,
              dy: 0,
              anim_counter: 0,
              direction: 'right',
              anim_delay_frames: 1,
              delay_counter: 0,
              rotate: 0,
              circle: 0.0,
              hitpoints: constants.PLAYER_LIFE
            })
             // Start Sprites

            for(let i=0; i<initial_sprites.length; i++){
               let mySpriteData = spriteData[ initial_sprites[i]['spriteName']];
               if (mySpriteData==null){
                  console.log("No spriteData for ",initial.sprites[i].spriteName);
                  continue;
               }

               if (props.deadrooms!=null && props.deadrooms[props.room]!=null){
                 if (mySpriteData.deadly){
                   continue;
                 }
               }
               let speed = mySpriteData.speed;
               let angle = Math.random()*2.0*Math.PI;
               let dx = speed*Math.sin(angle);
               let dy = speed*Math.cos(angle);
               sprites.push({
                 spriteName: initial_sprites[i]['spriteName'],
                 x: initial_sprites[i].xpos*props.tile_width,
                 y: initial_sprites[i].ypos*props.tile_height,
                 dx: dx,
                 dy: dy,
                 anim_counter: 0,
                 direction: 'left',
                 anim_delay_frames: 1,
                 delay_counter: 0,
                 rotate: 0,
                 hitpoints: mySpriteData.hitpoints
               });
            }
            this.loadNeededSpriteGraphics(spriteGraphics);
            return sprites;
   }

   restart= ()=>{
     let mystate = {...this.state};
     mystate['initial_sprites'] = maps[constants.START_ROOM]['sprites'];
     mystate['player_start']= {x: this.props.player_start_x,y: this.props.player_start_y };
     mystate['room']=constants.START_ROOM;
     mystate['deadRooms']==this.props.deadRooms;
     groom = constants.START_ROOM;
     this.setState({
       sprites: this.startSprites(mystate),
       game: this.state.game+1,
       room: this.props.room,
     });
   }

    myInterval = (func, wait)=>{
        var outerThis = this;
        var interv = function(w){
            return function(){
                    outerThis.setState({'interval':setTimeout(interv, wait)});
                    try{
                        func.call(null);
                    }
                    catch(e){
                        t = 0;
                        throw e.toString();
                    }
            };
        }(wait);
        this.setState({'interval':setTimeout(interv, wait)});
        return interv;
    };

  change_room = (room, x,y)=> {
     let mystate = {...this.state};
     if (room==this.state.room || room==this.groom){ return; }
     console.log("SpriteEngine: new room",room);
     groom = room;
     mystate['initial_sprites'] = maps[room]['sprites'];
     mystate['player_start']= {x: x,y: y };
     this.setState({
            sprites: this.startSprites(mystate),
            room: room,
            player_start: {x: x,y: y },
            initial_sprites:  maps[room]['sprites'],
            change_room: false,
            game: this.state.game+1,
     });
  }


   fire = (x,y)=>{
//     console.log("Fire ",x ,y);
     let deltaX = x-this.state.sprites[0].x;
     let deltaY = y-this.state.sprites[0].y;
     let weaponCount = 0;
     let weapon = 'syringe';
     if (this.props.pickups['weapon_blue']){
       weapon = 'syringe_blue';
     } else if (this.props.pickups['weapon_red']){
       weapon = 'syringe_red';
     }
     this.state.sprites.forEach( (sprite) => {
       let mySpriteData = spriteData[sprite.spriteName];
//       console.log(sprite.spriteName, mySpriteData);
       if (mySpriteData && mySpriteData.weapon){ weaponCount++;}});
     if (weaponCount>=constants.MAX_SHOTS){ return; }
     let speed = spriteData[weapon].speed;
     let dx=0;
     let dy=0;
     let direction='left';
     if (Math.abs(deltaX)>Math.abs(deltaY)){
       if (deltaX<0){ dx=-speed; } else { dx=speed; direction ='right';}
     } else {
       if (deltaY<0){ dy=-speed; direction='up'} else {dy=speed; direction='down';}
     }
     let newSprites = [...this.state.sprites];
     newSprites.push({
              spriteName: weapon,
              x: this.state.sprites[0].x + Math.sign(dx)*this.state.tile_width,
              y: this.state.sprites[0].y + Math.sign(dy)*this.state.tile_height,
              dx: dx,
              dy: dy,
              anim_counter: 0,
              direction: direction,
              anim_delay_frames: 1,
              delay_counter: 0
      });
      this.setState( {sprites: newSprites});
      if (this.sounds['fire']){ this.sounds['fire'].replayAsync(); }
    }


    onPressInHandler = (event) => {
      if (this.props.game_over){ return; }
      if (event.nativeEvent==null){
//        console.log("Null native event",event);
        return;
      }
      if (!this.isOnPlayer(event.nativeEvent.pageX, event.nativeEvent.pageY)){
         this.fire(event.nativeEvent.pageX, event.nativeEvent.pageY);
                 this.setState({pressStartX: 0, pressStartY: 0});
      } else {
        this.setState({pressStartX: event.nativeEvent.pageX, pressStartY: event.nativeEvent.pageY});
      }
    }




   isOnPlayer = (x,y)=> {
//     console.log("press x ",this.state.sprites[0].x-this.state.tile_width,'<',x,'<',this.state.sprites[0].x+2*this.state.tile_width);
//     console.log("press y ",this.state.sprites[0].y-this.state.tile_height,'<',y,'<',this.state.sprites[0].y+2*this.state.tile_height);
     return (x>this.state.sprites[0].x-this.state.tile_width && x<this.state.sprites[0].x+2*this.state.tile_width)
       && (y>this.state.sprites[0].y-this.state.tile_height && y<this.state.sprites[0].y+2*this.state.tile_height);
   }

   onPressOutHandler = (event)=>{
      if (this.state.pressStartX==0 && this.state.pressStartY==0){ return; }
      if (event.nativeEvent==null){
//        console.log("Null native event",event);
        return;
      }
      let x= event.nativeEvent.pageX;
      let y = event.nativeEvent.pageY;
      
      let dx=x-this.state.pressStartX;
      let dy=y-this.state.pressStartY;
//      console.log("Move x: ",x," y: ",y," dx: ",dx, "dy: ",dy);
      let newSprites = [... this.state.sprites];
           let speed = spriteData['player'].speed;
           if (Math.abs(dx) > Math.abs(dy)){
             if (dx<0){
               newSprites[0].dx = -speed;
               newSprites[0].dy= 0;
               newSprites[0].direction='left';
               newSprites[0].anim_counter = 0;
               newSprites[0].delay_counter = 0;
             } else if (dx>0){
               newSprites[0].dx = speed;
               newSprites[0].dy = 0;
               newSprites[0].direction='right';
               newSprites[0].anim_counter = 0;
               newSprites[0].delay_counter = 0;
             }
           } else {
             if (dy<0){
               newSprites[0].dy = -speed;
               newSprites[0].dx=0;
               newSprites[0].direction = 'up';
               newSprites[0].anim_counter = 0;
               newSprites[0].delay_counter= 0;
             } else if (dy>0){
               newSprites[0].dy = speed;
               newSprites[0].dx=0;
               newSprites[0].direction = 'down';
               newSprites[0].anim_counter = 0;
               newSprites[0].delay_counter= 0;
             }
           }
//           console.log(newSprites[0]);
           this.setState({ sprites: newSprites});
           return true;
   }




    async componentDidMount(){
//        this.state.interval = setInterval( ()=>this.moveSprites(), constants.INTERVAL);
              this.setState({'interval' : this.myInterval( ()=>this.moveSprites(), constants.INTERVAL)});


        for(var key in soundFiles){
            if (!soundFiles.hasOwnProperty(key)) continue;
             const soundObject = new Audio.Sound();
             await soundObject.loadAsync(soundFiles[key]);
             this.sounds[key]=soundObject;
        };

    }

    componentWillUnmount(){
//      if (this.state.interval!=null){ clearInterval(this.state.interval); }
      if (this.state.interval!=null){ clearTimeout(this.state.interval); }
    }

    split_room = (room)=>{
       let split = room.split("_");
//       console.log("old room",split)
       return { room_y: parseInt(split[1]), room_x: parseInt(split[2])};
    }

    isHard = (y,x, i)=>{
        if (x<0 || y<0){ return false;}
        const room = maps[this.state.room];
        const myMap = room['map'];
        let base = room['base'];
        if (base==null){
          console.log("room  "+this.state.room+" no base defined");
          base='island';
        }
        if (y>=myMap.length){ return this.isHard(y-1,x,i); }
        const row = myMap[y];
        if (x>=row.length){ return this.isHard(y,x-1,i); }
        const tile = row[x];
        const hard = hardness[base];
//        if (i==0){ console.log({y:y, x:x, tile:tile,hard:hard[tile]}); }
        return (hard[tile]==1);
    }

    allDead = (sprites)=> {
       let undeadCount = 0;
       for(i=0; i<sprites.length;i++){
               let mySprite = sprites[i];
               let mySpriteData = spriteData[mySprite.spriteName];
               if (mySprite.x<=0 || mySprite.y<=0 ||
                 mySprite.x>this.state.window_width - this.state.tile_width || mySprite.y>this.state.window_height - this.state.tile_height){ continue;}
               if (mySpriteData.deadly){
                 undeadCount++;
               }
       }
       if (undeadCount==0){
         this.props.onClearRoom(this.state.room);
       }
    }


    moveSprites = ()=>{
      let newSprites = [... this.state.sprites];
      let removeSprites = [];
      let myChangeRoom = this.state.change_room;
      for(i=0;i<newSprites.length; i++){
        let mySprite = newSprites[i];
        let mySpriteData = spriteData[mySprite.spriteName];
        if (i==0 && this.props.game_over){
          mySpriteData = spriteData['explosion'];
          mySpriteData.dx=0;
          mySpriteData.dy=0;
        }
        if (mySpriteData==null){
          console.log("No spriteData for ",i, mySprite.spriteName);
          continue;
        }
        let before_x = mySprite.x;
        let before_y = mySprite.y;
        mySprite.x += mySprite.dx;
        mySprite.y += mySprite.dy;
        let newDirection =false;
          let oldX = Math.floor(before_x/this.state.tile_width);
          let newX = Math.floor(mySprite.x/this.state.tile_width);
          let oldY = Math.floor(before_y/this.state.tile_height);
          let newY = Math.floor(mySprite.y/this.state.tile_height);
          let hit=false;
          if (i==0 ){
            for(j=1; j<newSprites.length;j++){
              let jData1 = spriteData[newSprites[j].spriteName];
              if (jData1['door']!=null && this.isCollide(newSprites[0], newSprites[j])){
                // Hit Door
//                console.log("Have key? "+jData1['door'], this.props.pickups, this.props.pickups[jData1['door']])
                if (this.props.pickups[jData1['door']]){
                  let acount = newSprites[j].anim_counter;
                  if (acount==0){
                          if (this.sounds['door']){ this.sounds['door'].replayAsync(); }
                  }
                  if (acount<3){ acount++;}
                  // Open Door animation
                  newSprites[j].anim_counter=acount;
                } else {
                  // Block player
                  newSprites[i].x=before_x;
                  newSprites[i].y=before_y;
                  newSprites[i].dx=0;
                  newSprites[i].dy=0;
                }
              }
            }
          }

        if (mySprite.dx!=0 && mySprite.circle==0.0){
 //         if (oldX!=newX){
            let addX = mySprite.dx>0? 1 : 0;
            hit = this.isHard(newY, newX+addX,i);
            if (!hit && Math.abs(newY*this.state.tile_height-mySprite.y)>4){ hit = this.isHard(newY+1, newX+addX, i);}
            if (hit){
              if (i==0) { //console.log("Hit ",newY, newX+addX, mySprite.x, mySprite.y);
               }
              mySprite.x=this.state.tile_width*Math.round(before_x/this.state.tile_width);
              mySprite.y=before_y;
              if (i==0){
                mySprite.dx=0;
              } else {
                mySprite.rot=-mySprite.rot;
                mySprite.dx=-mySprite.dx;
                mySprite.direction = mySprite.dx<0? 'left': 'right';
                newDirection=true;
                mySprite.delay_counter=0;
                mySprite.anim_counter=0;
              }
            }
 //         }
        }
        if (mySprite.dy!=0 && mySprite.circle==0.0){
 //         if (oldY!=newY){
            let addY = mySprite.dy>0? 1 : 0;
            hit = this.isHard(newY+addY, newX,i);
            if (!hit && Math.abs(newX*this.state.tile_width- mySprite.x)>4){ hit = this.isHard(newY+addY, newX+1,i); }
            if (hit){
              mySprite.x=before_x;
              mySprite.y=this.state.tile_height*Math.round(before_y/this.state.tile_height);
              if (i==0){
                mySprite.dy=0;
              } else {
                mySprite.rot=-mySprite.rot;
                mySprite.dy=-mySprite.dy;
                mySprite.direction = mySprite.dy<0? 'up': 'down';
                newDirection = true;
                mySprite.delay_counter=0;
                mySprite.anim_counter=0;
              }
            }
 //         }
        }
        let isCircle = 0;
        if (mySprite.circle!=null && mySprite.circle!=0.0){
          let rx = mySprite.x - mySprite.centerX;
          let ry = mySprite.y - mySprite.centerY;
          let r = Math.sqrt(rx*rx+ry*ry);
          if (r>=mySprite.circle){
            let angle = mySprite.rotate*Math.atan2(-rx, ry);
            mySprite.dx = mySpriteData.speed * Math.cos(angle);
            mySprite.dy = mySpriteData.speed * Math.sin(angle);
//            console.log("dx: "+ mySprite.dx, "dy: "+mySprite.dy);
            let isCircle = 1;
            this.setDiagonalDirection(mySprite);
          }

        } else {
          if (!this.props.game_over && !this.props.restart){
            if (mySprite.x<0){
             if (i!=0){ mySprite.dx = 2;
                mySprite.direction='right'; mySprite.anim_counter=0; }
             mySprite.delay_counter=0; newDirection=true;
               if (i==0 && !this.props.game_over && !this.props.restart && !this.props.change_room && !this.state.change_room){
                 let myroom = this.split_room(this.state.room);
                 let newx = myroom.room_x-1;
                 if (newx<1){ newx=8;}
                 mySprite.dx=0;
                 console.log("x<0 change room: room_x="+newx);
                 this.props.onChangeRoom('room_'+myroom.room_y+'_'+newx, (this.state.window_width-this.state.tile_width)/this.state.tile_width, mySprite.y/this.state.tile_height, );
               }
             }
            if (mySprite.y<0){
              if (i!=0) { mySprite.dy = 2; mySprite.direction='down'; mySprite.anim_counter=0; }
              mySprite.delay_counter=0; newDirection=true;
               if (i==0 && !this.props.change_room && !this.state_change_room){
                 myChangeRoom = true;
                 let myroom = this.split_room(this.state.room);
                 let newy = myroom.room_y-1;
                 mySprite.dy=0;
                 if (newy<1){ newy=8;}
                                  console.log("y<0 change room: roon_y="+newy);
                 this.props.onChangeRoom('room_'+newy+'_'+myroom.room_x, mySprite.x/this.state.tile_width, (this.state.window_height-this.state.tile_height)/this.state.tile_height );
               }
              }
            if (mySprite.x + this.state.tile_width> this.state.window_width ){
                if (i!=0) {mySprite.dx = -2; mySprite.direction='left';
                 mySprite.anim_counter=0; mySprite.delay_counter=0; newDirection=true; }
                 if (i==0 && !this.props.change_room && !this.state_change_room){
                   myChangeRoom = true;
                   let myroom = this.split_room(this.state.room);
                   let newx = myroom.room_x+1;
                   mySprite.dx=0;
                   if (newx>8){ newx=1;}
                   console.log("x>width change room: x="+newx);
                   this.props.onChangeRoom('room_'+myroom.room_y+'_'+newx, 0, mySprite.y/this.state.tile_height, );
                }
            }
            if (mySprite.y + this.state.tile_height > this.state.window_height){
                if (i!=0){
                  mySprite.dy = -2; mySprite.direction='up';
                  mySprite.anim_counter=0; mySprite.delay_counter=0; newDirection=true;
                }
               if (i==0 && !this.props.change_room && !this.state.change_room){
                     myChangeRoom = true;
                     let myroom = this.split_room(this.state.room);
                     let newy = myroom.room_y+1;
                     mySprite.dy=0;
                     if (newy>8){ newy=1;}
                 console.log("y>width change room: y="+newy);
                     this.props.onChangeRoom('room_'+newy+'_'+myroom.room_x, mySprite.x/this.state.tile_width, 0 );
                }

            }
          }
        }
        if (mySprite.dx!==0 || mySprite.dy!==0 || mySprite.spriteName==='explosion'){
          if (!newDirection){
            if (mySprite.delay_counter++ >=mySprite.anim_delay_frames){
              mySprite.anim_counter++;
              mySprite.delay_counter=1;
              if (isCircle){
                console.log("Bat: ",mySprite.direction, mySprite.anim_counter, mySpriteData[mySprite.direction].length);
              }
              if (mySprite.anim_counter>=mySpriteData[mySprite.direction].length){
                if (mySprite.spriteName==='explosion'){
                  removeSprites.push(i);
                }
                mySprite.anim_counter= 0;
              }
            }
          } else if (mySpriteData.weapon) {
            removeSprites.push(i); // Remove weapon if it bounces
//            console.log("weapon bounce set remove ",i, removeSprites);
          }
        }
      }
      if (removeSprites.length>0){
          let removeCounter=0;
          removeSprites.sort( (a,b)=>a-b);
//          console.log("starting remove", removeSprites);
          for(i=0; i<removeSprites.length;i++){
//            console.log("To remove: "+removeSprites[i]-removeCounter);
            let remove= removeSprites[i]-removeCounter;
            if (remove>0 && remove<newSprites.length){
//                console.log("moveSprites: Removing sprite ",remove, newSprites[remove].spriteName);
                newSprites.splice(remove,1);
                removeCounter++;
            }
          }
      }
      this.setState({ sprites: newSprites, change_room: myChangeRoom});
      this.collisions();
      this.generator();
    }

    generator = ()=> {
      let newSprites = [...this.state.sprites];
      let deadlyCount = 0;
           this.state.sprites.forEach( (sprite) => {
             let mySpriteData = spriteData[sprite.spriteName];
      //       console.log(sprite.spriteName, mySpriteData);
             if (mySpriteData && mySpriteData.deadly){ deadlyCount++;}});
           if (deadlyCount>=constants.DEADLY_LIMIT){ return; }
      let change = false;
      for(i=1 ; i<newSprites.length; i++){
         let generateName = spriteData[newSprites[i].spriteName].generator;
         if (generateName==null){ continue;}
         if (Math.random()<spriteData[newSprites[i].spriteName].genchance){
           let mySpriteData = spriteData[generateName];
           if (mySpriteData==null){
             console.log("no sprite data for ",generateName);
             continue;
           }
//           console.log("Creating new "+generateName);
           let speed = mySpriteData.speed;
           let angle = Math.random()*2.0*Math.PI;
           let dx = speed*Math.sin(angle);
           let dy = speed*Math.cos(angle);
           let rot = Math.random()>0.5 ? 1 : -1;
           change = true;
           let newSprite = {
             spriteName: generateName,
             x: newSprites[i].x,
             y: newSprites[i].y,
             dx: dx,
             dy: dy,
             anim_counter: 0,
             direction: 'left',
             anim_delay_frames: 1,
             delay_counter: 0,
             circle: mySpriteData.circle*this.state.tile_width,
             centerX: newSprites[i].x,
             centerY: newSprites[i].y,
             rotate: rot,
             hitpoints: mySpriteData.hitpoints
           };
           if (mySpriteData.circle){
             this.setDiagonalDirection(newSprite);
             if (this.sounds['bat']){ this.sounds['bat'].replayAsync(); }
           }
           newSprites.push(newSprite);
         }

      }
      if (change){
          this.setState({ sprites: newSprites});
      }
    }

    collisions = ()=> {
      if (this.props.game_over){ return; }
      if (this.state.sprites.length <2){ return; }
      let newSprites = [...this.state.sprites];
      let change = false;
      let removeSprites= [];
      // With Player
      for(j=1 ; j<newSprites.length; j++){
        let jData= spriteData[newSprites[j].spriteName];
        if (jData.deadly && this.isCollide( newSprites[0], newSprites[j])){
           this.props.onPlayerHit(jData.hitpoints);
           newSprites[j].spriteName='explosion';
           newSprites[0].dx=0;
           newSprites[0].dy=0;
           newSprites[j].direction='left';
           newSprites[j].anim_counter=0;
           newSprites[j].delay_counter=0;
           this.props.onAddScore(jData.score);
           this.allDead(newSprites); // Test if all dead and dispatch
           if (this.sounds['ouch']){ this.sounds['ouch'].replayAsync(); }
        }
        if (jData.pickup && this.isCollide( newSprites[0], newSprites[j])){
          if (!this.props.pickups[newSprites[j].spriteName] && this.sounds['winner']){
            this.sounds['winner'].replayAsync();
          }
          this.props.onPickup(newSprites[j].spriteName, jData.score);
          removeSprites.push(j);
        }
      }
      // Weapon to Deadly
      for(i=1; i<newSprites.length; i++){
        let iData = spriteData[newSprites[i].spriteName];
        if (iData.weapon){
          for(j=1; j<newSprites.length; j++){
            if (i==j){ continue; }
            let jData= spriteData[newSprites[j].spriteName];
            if (jData.deadly && this.isCollide( newSprites[i], newSprites[j])){
             change=true;
              newSprites[j].hitpoints -= iData.hitpoints;
//              console.log("Hit "+newSprites[j].spriteName+ " "+newSprites[j].hitpoints+" losing "+iData.hitpoints);
              removeSprites.push(i);
              if (newSprites[j].hitpoints<=0){
                newSprites[j].spriteName='explosion';
                newSprites[j].dx=0;
                newSprites[j].dy=0;
                newSprites[j].direction='left';
                newSprites[j].anim_counter=0;
                newSprites[j].delay_counter=0;
                if (this.sounds['bang']){ this.sounds['bang'].replayAsync(); }
                this.allDead(newSprites); // Test if all dead and dispatch
                this.props.onAddScore(jData.score);
                break;
              }
            }
          }
        }
      }
      let removeCounter=0;
      removeSprites.sort( (a,b)=>a-b);
      for(i=0; i<removeSprites;i++){
        let remove= removeSprites[i]-removeCounter;
         if (remove>0 && remove<newSprites.length){
//          console.log("collsions: Removing sprite ",remove, newSprites[remove].spriteName);
          newSprites.splice(remove,1);
          removeCounter++;
          change=true;
        };
      }
      if (change){
        this.setState({ sprites: newSprites});
      }
    }






    isCollide = (sprite1, sprite2) => {
      if (!(sprite1.x+this.state.tile_width < sprite2.x ||
               sprite1.x > sprite2.x+this.state.tile_width ||
               sprite1.y+this.state.tile_height < sprite2.y ||
               sprite1.y > sprite2.y + this.state.tile_height)){
        let x = sprite1.x - sprite2.x;
        let y = sprite1.y - sprite2.y;
        let r = Math.sqrt(x*x+y*y);
        let data1 = spriteData[sprite1.spriteName];
        let data2 = spriteData[sprite2.spriteName];
        if (r < this.state.tile_width*0.5*( data1.radius+data2.radius)){
          return true;
        }
      };
      return false;
    }

    setDiagonalDirection = (sprite)=>{
      let r = Math.sqrt( sprite.dx*sprite.dx + sprite.dy*sprite.dx);
      let angle = Math.atan2 ( sprite.dx/r, sprite.dy/r);
      if (angle<-Math.PI*7.0/8.0){
        sprite.direction='down';
      } else if (angle<-Math.PI*5.0/8.0){
        sprite.direction='sw';
      } else if (angle<-Math.PI*3.0/8.0){
        sprite.direction='left';
      } else if (angle<-Math.PI/8.0){
        sprite.direction='nw';
      } else if (angle<Math.PI/8.0){
        sprite.direction='up';
      } else if (angle<Math.PI*3.0/8.0){
        sprite.direction='ne';
      } else if (angle<Math.PI*5.0/8.0){
        sprite.direction='right';
      } else if (angle<Math.PI*7.0/8.0){
        sprite.direction='se';
      } else {
        sprite.direction='down';
      }
    };

    loadNeededSpriteGraphics = ()=>{
        let names=[];
        for(sprite in this.sprites){
          names.push(sprite.spriteName);
          if (sprite.generator!=null && sprite.generator!=''){
            names.push(sprite.generator);
          }
        }
        for( k of Object.keys(spriteGraphics)){
          if (names.some(()=>{k.startWith(name) })){
            this.loadImages(spriteGraphics[k]);
          }
        };

    }

    loadImages(images) {
        let imageMap = {};
        const uris = images.map( image=>
           ({
              uri: Image.resolveAssetSource(image).uri
           }));
           FastImage.preload(uris);
           Console.log(images+" loaded");
    }

    render(){
        if (this.props.restart){
          let mygcount = this.gcount;
          setTimeout( ()=> {
//            console.log("SpriteEngine: restart");
//            if (this.gcount==mygcount){
              this.restart();
              this.props.onRestart();
              this.gcount++;
//            }
          },20);
        }
        if (this.props.change_room && this.props.room!=this.state.room){
          let mygcount1 = this.gcount;
          setTimeout( ()=> {
//            console.log("SpriteEngine: change room");
//            if (this.gcount==mygcount1){
              this.change_room(this.props.room, this.props.player_start_x, this.props.player_start_y);
              this.props.onEndChangeRoom();
              this.gcount++;
//            }
          },20);
        }
              const SPRITE_STYLE="sprites_";
              const TILES_WIDTH = this.state.tile_width;
              const TILES_HEIGHT = this.state.tile_height;
              let styles = {};
              let spriteRender = [];
              let style_counter = 0;
              let sprites = this.state.sprites;
              for(i=0; i<this.state.sprites.length;i++){
                      styles[SPRITE_STYLE+style_counter++] = {
                        position: 'absolute',
                        width: TILES_WIDTH,
                        height: TILES_HEIGHT,
                        left: sprites[i].x,
                        top: sprites[i].y,
                        zIndex: 2,
                      };
              }
                      const window = Dimensions.get('window');
                      let window_width = window.width;
                      let window_height = window.height;
              if (this.props.pickups['crown']!=null){
                                      styles[SPRITE_STYLE+style_counter++] = {
                                        position: 'absolute',
                                        width: TILES_WIDTH*6,
                                        height: TILES_HEIGHT*3,
                                        left: window_width/2-TILES_WIDTH*3,
                                        top: window_width/2-TILES_HEIGHT*1.5,
                                        zIndex: 2,
                                      };
              }
              const style = StyleSheet.create(styles);
              style_counter =0;
              for(i=0; i<sprites.length;i++){
                     if (sprites[i]==null){ continue; }
                     let mySpriteData = spriteData[sprites[i].spriteName];
                     if (i==0 && this.props.game_over && this.props.pickups['crown']==null){
                       mySpriteData = spriteData['explosion'];
                     }
                     let sourceNames = mySpriteData[sprites[i].direction];
                     if (sprites[i].anim_counter==null){
                       console.log("sprite: ",i, " name: ", sprites[i].spriteName, " no anim counter");
                       continue;
                     }
                     if (sourceNames==null){
                          console.log("sprite: ",i, " name: ", sprites[i].spriteName, " missing anim for direction: "+sprites[i].direction);
                          continue;
                     }
                     let sourceName = sourceNames[sprites[i].anim_counter];
                     let source = spriteGraphics[sourceName];
                     let myStyle= style[SPRITE_STYLE+style_counter];
              if (sprites[i].y< this.state.window_height){ spriteRender.push(
                      <ImageOverlay
                        style={myStyle}
                        source = {source}
                        height={TILES_HEIGHT}
                        width={TILES_WIDTH}
                        left={sprites[i].x}
                        overlayAlpha={0.5}
                         top={sprites[i].y}
                        key={style_counter}
                      /> );
                     style_counter++;
              }};
              if (this.props.pickups['crown']!=null){
                    let myStyle= style[SPRITE_STYLE+style_counter];
                     spriteRender.push(
                      <ImageOverlay
                        style={myStyle}
                        source = {spriteGraphics.winner}
                        height={TILES_HEIGHT*4}
                        width={TILES_WIDTH*6}
                        left={window_width/2-TILES_WIDTH*3}
                        overlayAlpha={0.5}
                         top={window_width/2-TILES_HEIGHT*1.5}
                        key={style_counter}
                      /> );
              }

              return (
                 <View style={ { opacity: 0.5, backgroundColor: '#000000', flex: 1 }} >{spriteRender}</View>
              );
    }

}

const mapStateToProps = (state)=>{
  return { score : state.score, restart: state.restart, game_over: state.game_over,
    change_room: state.change_room,
    room: state.room,
    player_start_x: state.player_start_x,
    player_start_y: state.player_start_y,
    pickups: state.pickups,
    deadrooms: state.deadrooms,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    onAddScore: score=> dispatch({type: ADD_SCORE, score: score}),
    onRestart: ()=> dispatch({type: END_RESTART}),
    onPlayerHit: life=> dispatch({type: SUB_LIFE, life: life}),
    onChangeRoom: (room, x,y)=> {
      console.log("change room ",room,x,y);
      dispatch({ type: CHANGE_ROOM, room: room, player_start_x: x, player_start_y: y})
    },
    onClearRoom: (room)=>{
         console.log("Clear room",room);
         dispatch({ type: CLEAR_ROOM, room: room}); },
    onEndChangeRoom: ()=> dispatch( {type: END_CHANGE_ROOM}),
    onPickup: (item,score)=> dispatch({type: PICKUP, item: item, score:score })
  };
}

export default connect( mapStateToProps, mapDispatchToProps)(SpriteEngine);