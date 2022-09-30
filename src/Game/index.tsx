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
        name: '첨부된 유튜브 영상',
        x: 128,
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
        isInteractable: true,
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

  private gameWidth: number = 0;
  private gameHeight: number = 0;
  public screenLeft: number = 0;
  public screenTop: number = 0;

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
      await this._drawImage(backgroundSprite.x - this.screenLeft, backgroundSprite.y - this.screenTop, backgroundSprite.width, backgroundSprite.height, backgroundSprite.image);

      this.gameWidth = Math.max(this.gameWidth, backgroundSprite.x + backgroundSprite.width);
      this.gameHeight = Math.max(this.gameHeight, backgroundSprite.y + backgroundSprite.height);
    }
  }

  private async _renderPlayers() {
    const context = this._getCanvasContext();

    if (!context) {
      return;
    }

    const me = this.state.players[0].playerSprite;
    const leftMargin = (me.x - this.screenLeft + ((me.width * 1.5) / 2)) * 1.5;
    const topMargin = (me.y - this.screenTop + ((me.height * 1.5) / 2)) * 1.5;
    const center = window.innerWidth / 2;
    const topCenter = window.innerHeight / 2;

    const leftMarginDiff = leftMargin - center;
    const topMarginDiff = topMargin - topCenter;
    this.screenLeft = Math.floor(Math.min(Math.max(0, this.screenLeft + leftMarginDiff), this.gameWidth - (window.innerWidth / 1.5)));
    this.screenTop = Math.floor(Math.min(Math.max(0, this.screenTop + topMarginDiff), this.gameHeight - (window.innerHeight / 1.5)));

    for (const player of this.state.players) {
      await this._drawImage(player.playerSprite.x - this.screenLeft, player.playerSprite.y - this.screenTop, player.playerSprite.width, player.playerSprite.height, player.playerSprite.image);
    }
  }

  private async _renderSprites() {
    const context = this._getCanvasContext();

    if (!context) {
      return;
    }

    for (const spriteIndex in this.state.sprites) {
      const sprite = this.state.sprites[spriteIndex];
      context.save();

      const me = this.state.players[0].playerSprite;
      const target = sprite;
      const distance = Math.sqrt(Math.pow(me.x - target.x, 2) + Math.pow(me.y - target.y, 2));

      if (distance < 100 && sprite.isInteractable === true) {
        context.shadowBlur = 5;
        context.shadowColor = "yellow";

        let interactHelper: HTMLDivElement | null | undefined = this.gameWrapper?.querySelector('#interact-helper-' + spriteIndex);
        if (interactHelper === null) {
          interactHelper = document.createElement('div');
          interactHelper.classList.add('interact-helper');
          interactHelper.innerHTML = `${sprite.name}을 보려면 X키를 누르세요.`;
          interactHelper.id = 'interact-helper-' + spriteIndex;
          interactHelper.style.left = ((sprite.x - this.screenLeft) * 1.5) + 'px';
          interactHelper.style.top = ((sprite.y + 35 - this.screenTop) * 1.5) + 'px'
          this.gameWrapper?.appendChild(interactHelper);
        }
        interactHelper!.style.marginLeft = `${-((interactHelper!.offsetWidth - (32 * 1.5)) / 2)}px`;
      } else {
        const interactHelper = this.gameWrapper?.querySelector('#interact-helper-' + spriteIndex);
        if (interactHelper) {
          interactHelper.remove();
        }
      }

      await this._drawImage(sprite.x - this.screenLeft, sprite.y - this.screenTop, sprite.width, sprite.height, sprite.image);
      context.restore();
    }
  }

  private async _renderGame() {
    await this._renderBackground();
    await this._renderPlayers();
    await this._renderSprites();

    requestAnimationFrame(() => this._renderGame());
  }

  private _websiteEnabled = false;
  private _spriteListener() {
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'X' || e.key === 'x' || e.key === 'ㅌ') && !this._websiteEnabled) {
        let interactTarget: null | Sprite = null;
        const me = this.state.players[0].playerSprite;
        for (const sprite of this.state.sprites) {
          const distance = Math.sqrt(Math.pow(me.x - sprite.x, 2) + Math.pow(me.y - sprite.y, 2));
          if (distance < 100 && sprite.isInteractable === true) {
            interactTarget = sprite;
            break;
          }
        }

        if (interactTarget) {
          this._websiteEnabled = true;

          const websiteWrapper = document.createElement('div');
          websiteWrapper.classList.add('interact-website');
          const frame = document.createElement('iframe');
          websiteWrapper.appendChild(frame);
          frame.src = 'https://www.youtube.com/embed/j-cObepig6Q?autoplay=1';

          this.gameWrapper?.appendChild(websiteWrapper);
        }
      } else if (e.key === 'Escape' && this._websiteEnabled) {
        this._websiteEnabled = false;
        this.gameWrapper?.querySelector('.interact-website')?.remove();
      }
    });
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
    this._spriteListener();
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
