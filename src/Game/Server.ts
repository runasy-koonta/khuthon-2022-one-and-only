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
  nickname: string;
  x: number;
  y: number;
}
interface PlayerVoice {
  playerId: string;
  voice: string;
}

class Server {
  private _socket;
  constructor(nickname: string, private _game: Game) {
    this._socket = io('localhost:3001');

    this._socket.on('connect', () => {
      this._game.state.players[0].playerId = this._socket.id;
      this._game.state.players[0].playerSprite.name = nickname;

      this._socket.emit('login', nickname);
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
    this._socket.on('voice', (data: PlayerVoice) => {
      this._onPlayerVoice(data);
    });

    this._startVoiceChat(300);
  }

  public sendPlayerMoveData(x: number, y: number) {
    this._socket.emit('playerMove', {
      x,
      y,
    });
  }

  private _startVoiceChat(chunkDuration: number) {
    const s = this._socket;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();

      let audioChunks: Blob[] = [];

      mediaRecorder.addEventListener("dataavailable", function (event) {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", function () {
        const audioBlob = new Blob(audioChunks);

        audioChunks = [];

        const fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = function () {
          const base64String = fileReader.result;
          s.emit("voice", base64String);
        };

        mediaRecorder.start();

        setTimeout(function () {
          mediaRecorder.stop();
        }, chunkDuration);
      });

      setTimeout(function () {
        mediaRecorder.stop();
      }, chunkDuration);
    });
  }

  private _onPlayerVoice(data: PlayerVoice) {
    if (data.playerId === this._socket.id) {
      return;
    }

    const playerLocation = this._game.state.players.find(player => player.playerId === data.playerId);
    if (!playerLocation) {
      return;
    }
    const me = this._game.state.players[0];

    const distance = Math.sqrt(Math.pow(playerLocation.playerSprite.x - me.playerSprite.x, 2) + Math.pow(playerLocation.playerSprite.y - me.playerSprite.y, 2));

    if (distance < 200) {
      const audio = new Audio(data.voice);
      audio.play().then();
    }
  }

  private _onNewPlayer(data: NewPlayerData) {
    if (data.playerId === this._socket.id) {
      return;
    }

    // Create new player
    const newPlayer = new Player({
      name: data.nickname,
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
    this._game.state.players[playerIndex].removeNameTag();
    this._game.state.players.splice(playerIndex, 1);
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
