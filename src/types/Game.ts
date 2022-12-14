export interface ImageSet {
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;

  cachedImage?: HTMLImageElement;
}

export interface Sprite {
  x: number;
  y: number;

  width: number;
  height: number;

  name?: string;
  image: string | ImageSet;

  isPassable?: boolean;
  isInteractable?: boolean;
  url?: string;
  showText?: boolean;
}

export interface BackgroundSprite extends Sprite {

}
