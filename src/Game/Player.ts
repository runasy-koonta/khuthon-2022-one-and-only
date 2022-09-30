import {Sprite} from "../types/Game";
import Game from "./";

type PlayerStatus = "idle" | "walking";

class Player {
  private _playerId: string = '';
  public playerStatus: PlayerStatus = 'idle';
  public location: {
    x: number;
    y: number;
  };
  public isMe: boolean = false;

  private _nameTag: HTMLDivElement = document.createElement('div');
  private _animationStatus: number = 0;

  constructor(public playerSprite: Sprite, private game: Game) {
    this.location = {
      x: playerSprite.x,
      y: playerSprite.y,
    };

    setInterval(() => this.animationPlayer(), 350 / 32);
  }

  set playerId(playerId: string) {
    this._playerId = playerId;

    this._nameTag.classList.add('name-tag');
    this.game.gameWrapper?.appendChild(this._nameTag);
    this._nameTag.innerText = playerId;
    this._refreshNameTag();
  }
  get playerId() {
    return this._playerId;
  }

  private _refreshNameTag() {
    this._nameTag.style.left = `${this.playerSprite.x * 1.5}px`;
    this._nameTag.style.top = `${(this.playerSprite.y - 18) * 1.5}px`;
    this._nameTag.style.marginLeft = `${-(this._nameTag.offsetWidth / 2) + (16 * 1.5)}px`;
  }

  public animationPlayer() {
    this._refreshNameTag();
    if (this.playerStatus === 'walking') {
      this._animationStatus += 1;
      this._animationStatus %= 40;

      if (this.location.x < this.playerSprite.x) {
        this.playerSprite.x -= 1;
        // 좌측 보고 있는 sprite
        if (typeof this.playerSprite.image !== 'string') {
          this.playerSprite.image.x = 96;
          this.playerSprite.image.y = (Math.floor(this._animationStatus / 10) * 32);
        }
      } else if (this.location.x > this.playerSprite.x) {
        this.playerSprite.x += 1;
        // 우측 보고 있는 sprite
        if (typeof this.playerSprite.image !== 'string') {
          this.playerSprite.image.x = 64;
          this.playerSprite.image.y = (Math.floor(this._animationStatus / 10) * 32);
        }
      }

      if (this.location.y < this.playerSprite.y) {
        this.playerSprite.y -= 1;
        // 뒤 돌아본 sprite
        if (typeof this.playerSprite.image !== 'string') {
          this.playerSprite.image.x = 32;
          this.playerSprite.image.y = (Math.floor(this._animationStatus / 10) * 32);
        }
      } else if (this.location.y > this.playerSprite.y) {
        this.playerSprite.y += 1;
        // 앞 보고 있는 sprite
        if (typeof this.playerSprite.image !== 'string') {
          this.playerSprite.image.x = 0;
          this.playerSprite.image.y = (Math.floor(this._animationStatus / 10) * 32);
        }
      }

      if (this.location.x === this.playerSprite.x && this.location.y === this.playerSprite.y) {
        this.playerStatus = 'idle';

        if (typeof this.playerSprite.image !== 'string') {
          this._animationStatus = 0;
          this.playerSprite.image.y = 0;
        }
      }
    }
  }

  public movePlayer(x: number, y: number) {
    const sprites = this.game.state.sprites;
    const backgrounds = this.game.state.background;

    const canStep = backgrounds.find(sprite => sprite.x === x && sprite.y === y && (sprite.isPassable === true || sprite.isPassable === undefined)) !== undefined;
    const canPass = sprites.find(sprite => sprite.x === x && sprite.y === y && sprite.isPassable === false) === undefined;

    if (x < this.location.x && typeof this.playerSprite.image !== 'string') {
      this.playerSprite.image.x = 96;
    } else if (y < this.location.y && typeof this.playerSprite.image !== 'string') {
      this.playerSprite.image.x = 32;
    } else if (x > this.location.x && typeof this.playerSprite.image !== 'string') {
      this.playerSprite.image.x = 64;
    } else if (y > this.location.y && typeof this.playerSprite.image !== 'string') {
      this.playerSprite.image.x = 0;
    }

    if (canPass && canStep) {
      this.playerStatus = 'walking';
      this.location.x = x;
      this.location.y = y;
    }
  }

  public playerController(e: KeyboardEvent) {
    if (this.playerStatus !== 'idle') {
      return;
    }

    switch (e.key) {
      case 'ㅈ':
      case 'w':
      case 'W':
      case 'ArrowUp':
        this.game.server?.sendPlayerMoveData(this.location.x, this.location.y - 32);
        this.movePlayer(this.location.x, this.location.y - 32);
        break;
      case 'ㅁ':
      case 'a':
      case 'A':
      case 'ArrowLeft':
        this.game.server?.sendPlayerMoveData(this.location.x - 32, this.location.y);
        this.movePlayer(this.location.x - 32, this.location.y);
        break;
      case 'ㄴ':
      case 's':
      case 'S':
      case 'ArrowDown':
        this.game.server?.sendPlayerMoveData(this.location.x, this.location.y + 32);
        this.movePlayer(this.location.x, this.location.y + 32);
        break;
      case 'ㅇ':
      case 'd':
      case 'D':
      case 'ArrowRight':
        this.game.server?.sendPlayerMoveData(this.location.x + 32, this.location.y);
        this.movePlayer(this.location.x + 32, this.location.y);
        break;
    }
  }
}

export default Player;
