import './game.css';

import {Component} from "react";
import {BackgroundSprite, ImageSet, Sprite} from "../types/Game";

import DemoMap from '../map.json';
import Player from "./Player";
import Server from "./Server";

interface GameState {
  sprites: Sprite[];
  background: BackgroundSprite[];
  players: Player[];
}

class Game extends Component<any, GameState> {
  state: GameState = {
    sprites: [
      {
        x: 32,
        y: 32,
        width: 32,
        height: 32,
        image: {
          image: "/assets/sprite/default_tileset.png",
          x: 64,
          y: 0,
          width: 32,
          height: 32,
        },
        isPassable: false,
      }
    ],
    background: DemoMap,
    players: [
      new Player({
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        image: {
          image: "/assets/sprite/player.png",
          x: 0,
          y: 0,
          width: 32,
          height: 32,
        }
      }, this),
    ],
  };

  public server: Server | undefined;
  private gameCanvas: HTMLCanvasElement | null = null;
  public gameWrapper: HTMLDivElement | null = null;

  private cachedBackgroundSprite?: HTMLImageElement;

  private _loadImage(image: string | ImageSet): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      if (typeof image === 'string') {
        const img = new Image();
        img.src = image;
        img.onload = () => {
          return resolve(img);
        };
      } else {
        if (image.image === '/assets/sprite/default_tileset.png' && this.cachedBackgroundSprite) {
          return resolve(this.cachedBackgroundSprite);
        }
        if (image.cachedImage) return resolve(image.cachedImage);

        const img = new Image();
        img.src = image.image;
        img.onload = () => {
          if (image.image === '/assets/sprite/default_tileset.png') {
            this.cachedBackgroundSprite = img;
          }
          image.cachedImage = img;
          return resolve(img);
        };
      }
    });
  }

  private async _drawImage(x: number, y: number, width: number, height: number, image: string | ImageSet) {
    const img = await this._loadImage(image);

    const context = this._getCanvasContext();
    if (!context) {
      return false;
    }

    if (typeof image === 'string') {
      context.drawImage(img, x, y, width, height);
    } else {
      context.drawImage(img, image.x, image.y, image.width, image.height, x, y, width, height);
    }
  }

  private _getCanvasContext() {
    if (this.gameCanvas) {
      return this.gameCanvas.getContext('2d');
    }
    return null;
  }

  private async _renderBackground() {
    const context = this._getCanvasContext();

    if (!context) {
      return;
    }

    for (const backgroundSprite of this.state.background) {
      await this._drawImage(backgroundSprite.x, backgroundSprite.y, backgroundSprite.width, backgroundSprite.height, backgroundSprite.image);
    }
  }

  private async _renderPlayers() {
    const context = this._getCanvasContext();

    if (!context) {
      return;
    }

    for (const player of this.state.players) {
      await this._drawImage(player.playerSprite.x, player.playerSprite.y, player.playerSprite.width, player.playerSprite.height, player.playerSprite.image);
    }
  }

  private async _renderSprites() {
    const context = this._getCanvasContext();

    if (!context) {
      return;
    }

    for (const sprite of this.state.sprites) {
      await this._drawImage(sprite.x, sprite.y, sprite.width, sprite.height, sprite.image);
    }
  }

  private async _renderGame() {
    await this._renderBackground();
    await this._renderPlayers();
    await this._renderSprites();

    requestAnimationFrame(() => this._renderGame());
  }

  private _loadGame() {
    document.addEventListener('keypress', (e) => this.state.players[0].playerController(e));
    document.addEventListener('resize', (e) => {
      if (this.gameCanvas) {
        this.gameCanvas.width = window.innerWidth / 1.5;
        this.gameCanvas.height = window.innerHeight / 1.5;
      }
    });
    if (this.gameCanvas) {
      this.gameCanvas.width = window.innerWidth / 1.5;
      this.gameCanvas.height = window.innerHeight / 1.5;
    }
    this.state.players[0].isMe = true;
    this.server = new Server(this);
    this._renderGame().then();
  }

  render() {
    return (
      <div ref={(ref) => {
        this.gameWrapper = ref;
      }}>
        <canvas ref={(ref) => {
          this.gameCanvas = ref;
          this._loadGame();
        }} />
      </div>
    );
  }
}

export default Game;
