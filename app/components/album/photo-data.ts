import { withBasePath } from "../../lib/site-path";
import type { AlbumPhoto } from "./photo-album";

export type SitePhoto = {
  name: string;
  source: string;
  alt: string;
  width: number;
  height: number;
};

// Same 12 photos as the photography page, in the same order.
export const SITE_PHOTOS: readonly SitePhoto[] = [
  {
    name: "lines-red-installation",
    source: "深圳美术馆",
    alt: "展厅中，密集红线从天花垂下，旧行李箱散落在地面",
    width: 1800,
    height: 1200,
  },
  {
    name: "lines-wire-sculpture",
    source: "深圳美术馆",
    alt: "浅色背景前，由细金属丝交叠形成的团状雕塑",
    width: 1800,
    height: 2700,
  },
  {
    name: "lines-bridge-cables",
    source: "重庆",
    alt: "夜色中，红色桥梁与放射状桥索横跨江面",
    width: 1800,
    height: 1200,
  },
  {
    name: "lines-window-grid",
    source: "楼宇间的白云",
    alt: "暮色里，高楼立面由重复窗格和竖线分割",
    width: 1800,
    height: 2400,
  },
  {
    name: "sea-yellow-buoy",
    source: "海边",
    alt: "蓝色海面上一枚黄色浮标，远处货船沿山脚排开",
    width: 1800,
    height: 1200,
  },
  {
    name: "sea-rock-waves",
    source: "天文台",
    alt: "海浪拍向褐色礁石，远处小船散在蓝色海面",
    width: 1800,
    height: 1200,
  },
  {
    name: "sea-cliff",
    source: "美人鱼拍摄取景地",
    alt: "右侧岩壁切开大面积天空与海面，远处有一艘小船",
    width: 1800,
    height: 2700,
  },
  {
    name: "sea-harbor-boat",
    source: "香港",
    alt: "蓝色海港中，一艘红帆船驶过城市与山影",
    width: 1800,
    height: 1200,
  },
  {
    name: "sky-rain-city",
    source: "深圳",
    alt: "厚重雨云压过城市，远处雨幕落在建筑群上",
    width: 1800,
    height: 1200,
  },
  {
    name: "sky-clouds-city",
    source: "深圳",
    alt: "高空俯瞰深圳建筑群，明亮积云覆盖城市上空",
    width: 1800,
    height: 1200,
  },
  {
    name: "sky-sunset",
    source: "夕阳",
    alt: "橙色晚霞越过深色山影与云层",
    width: 1800,
    height: 1350,
  },
  {
    name: "sky-airplane-twilight",
    source: "飞机上拍下的景象",
    alt: "飞机翼尖指向橙紫色地平线，弯月悬在暗色天空",
    width: 1800,
    height: 1350,
  },
];

export function photoNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function albumPhotosFrom(photos: readonly SitePhoto[] = SITE_PHOTOS): AlbumPhoto[] {
  return photos.map((photo, index) => ({
    number: photoNumber(index),
    source: photo.source,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    webp900: withBasePath(`/images/photography/${photo.name}-900.webp`),
  }));
}
