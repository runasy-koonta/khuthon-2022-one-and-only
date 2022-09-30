import { io } from 'socket.io-client';
import Game from "./index";
import Player from "./Player";

interface PlayerMoveData {
  playerId: string;
  x: number;
  y: number;
}
interface NewPlayerData {
  playerId: string;
  x: number;
  y: number;
}

class Server {
  private _socket;
  constructor(private _game: Game) {
    this._socket = io('localhost:3001');

    this._socket.on('connect', () => {
      this._game.state.players[0].playerId = this._socket.id;
    });

    this._socket.on('playerMove', (data: PlayerMoveData) => {
      this._onPlayerMove(data);
    });
    this._socket.on('newPlayer', (data: NewPlayerData) => {
      this._onNewPlayer(data);
    });
    this._socket.on('playerDisconnect', (playerId: string) => {
      this._onPlayerDisconnect(playerId);
    });
  }

  public sendPlayerMoveData(x: number, y: number) {
    this._socket.emit('playerMove', {
      x,
      y,
    });
  }

  private _onNewPlayer(data: NewPlayerData) {
    if (data.playerId === this._socket.id) {
      return;
    }

    // Create new player
    const newPlayer = new Player({
      x: data.x,
      y: data.y,
      width: 32,
      height: 32,
      image: {
        image: "/assets/sprite/player.png",
        x: 0,
        y: 0,
        width: 32,
        height: 32,
      }
    }, this._game);
    newPlayer.playerId = data.playerId;
    this._game.state.players.push(newPlayer);
  }
  private _onPlayerDisconnect(playerId: string) {
    const playerIndex = this._game.state.players.findIndex(player => player.playerId === playerId);
    this._game.state.players.splice(playerIndex, 1);
    console.log(playerId, playerIndex, this._game.state.players);
  }


  private _onPlayerMove(data: PlayerMoveData) {
    if (data.playerId === this._socket.id) {
      return;
    }

    const player = this._game.state.players.find(player => player.playerId === data.playerId);
    player?.movePlayer(data.x, data.y);
  }
}

export default Server;
