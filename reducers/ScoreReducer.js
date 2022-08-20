import {ADD_SCORE, ADD_LIFE, SUB_LIFE, PICKUP, RESTART, END_RESTART, CHANGE_ROOM, END_CHANGE_ROOM,
 CLEAR_ROOM} from '../actions/Actions';
import redux from 'redux';
import constants from '../components/Constants';

const initial_state = {
  score: 0,
  player_life: constants.PLAYER_LIFE,
  game_over: false,
  restart: false,
  room: constants.START_ROOM,
  player_start_x: constants.PLAYER_START_X,
  player_start_y: constants.PLAYER_START_Y,
  change_room: false,
  deadrooms: {},
  pickups: {},
}

scoreReducer = (state = initial_state, action)=>{
  switch(action.type){
    case ADD_SCORE:
       let newScore =action.score + state.score;
       return {...state, score: newScore};
    case ADD_LIFE:
       return {...state, player_life: state.player_life+action.life};
    case SUB_LIFE:
       let newLife = state.player_life-action.life;
       if (newLife<=0){
         return {...state, player_life: 0, game_over: true, restart: false }
       } else {
         return {...state, player_life: newLife};
       }
    case CLEAR_ROOM:
//      console.log("cleared room: "+action.room);
      let rooms = {...state.deadrooms};
      rooms[action.room] = 1;
      return {...state, deadrooms: rooms};
    case PICKUP:
      if (state.game_over){ return {...state};}
      let pickups = {...state.pickups};
      if (pickups[action.item]!=null)     { return {...state};}
      pickups[action.item]=1;
      let myGameOver = pickups['crown']!=null;
      let pNewScore =action.score + state.score;
      let newlife = state.player_life;
      if (action.item.startsWith('life')){
        newlife = constants.PLAYER_LIFE;
      }
      return {...state, pickups: pickups, game_over: myGameOver, score: pNewScore, player_life: newlife};
    case RESTART:
        if (!state.game_over){ return  {...state}; }
        return {...state, player_life: constants.PLAYER_LIFE, game_over: false, restart: true, pickups: {},
           player_start_x: constants.PLAYER_START_X, player_start_y: constants.PLAYER_START_Y,
           change_room: false, room: constants.START_ROOM, score: 0,
           deadrooms: {},
         };
    case END_RESTART:
        console.log("restart end");
        return {...state, restart: false };
    case CHANGE_ROOM:
        if (state.game_over || state.restart || state.change_room){ return {...state};}
        if (state.room==action.room){ return {...state}; }
        console.log("new room ", action.room);
        return {...state, room: action.room, player_start_x: action.player_start_x,
          player_start_y: action.player_start_y, change_room: true};
    case END_CHANGE_ROOM:
         if (state.game_over){ return {...state};}
         return {...state, change_room: false};

  }
  return state;
}

export default scoreReducer;