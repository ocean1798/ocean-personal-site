import type { Metadata } from "next";
import { PhotographyReveal } from "../components/photography-reveal";
import { ResponsivePhoto } from "../components/responsive-photo";
import { SiteChrome } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "摄影",
  description: "Ocean 眼中的世界，12 张日常拍下的照片。",
};

const photoGroups = [
  {
    className: "",
    startNumber: 1,
    photos: [
      {
        name: "lines-red-installation",
        source: "深圳美术馆",
        alt: "展厅中，密集红线从天花垂下，旧行李箱散落在地面",
        width: 1800,
        height: 1200,
        layout: "photo-full",
      },
      {
        name: "lines-wire-sculpture",
        source: "深圳美术馆",
        alt: "浅色背景前，由细金属丝交叠形成的团状雕塑",
        width: 1800,
        height: 2700,
        layout: "photo-pair-large",
      },
      {
        name: "lines-bridge-cables",
        source: "重庆",
        alt: "夜色中，红色桥梁与放射状桥索横跨江面",
        width: 1800,
        height: 1200,
        layout: "photo-pair-small photo-delay",
      },
      {
        name: "lines-window-grid",
        source: "楼宇间的白云",
        alt: "暮色里，高楼立面由重复窗格和竖线分割",
        width: 1800,
        height: 2400,
        layout: "photo-closing",
      },
    ],
  },
  {
    className: "photography-chapter-sea",
    startNumber: 5,
    photos: [
      {
        name: "sea-yellow-buoy",
        source: "海边",
        alt: "蓝色海面上一枚黄色浮标，远处货船沿山脚排开",
        width: 1800,
        height: 1200,
        layout: "photo-full",
      },
      {
        name: "sea-rock-waves",
        source: "天文台",
        alt: "海浪拍向褐色礁石，远处小船散在蓝色海面",
        width: 1800,
        height: 1200,
        layout: "photo-pair-large",
      },
      {
        name: "sea-cliff",
        source: "美人鱼拍摄取景地",
        alt: "右侧岩壁切开大面积天空与海面，远处有一艘小船",
        width: 1800,
        height: 2700,
        layout: "photo-pair-small photo-delay",
      },
      {
        name: "sea-harbor-boat",
        source: "香港",
        alt: "蓝色海港中，一艘红帆船驶过城市与山影",
        width: 1800,
        height: 1200,
        layout: "photo-closing",
      },
    ],
  },
  {
    className: "",
    startNumber: 9,
    photos: [
      {
        name: "sky-rain-city",
        source: "深圳",
        alt: "厚重雨云压过城市，远处雨幕落在建筑群上",
        width: 1800,
        height: 1200,
        layout: "photo-full",
      },
      {
        name: "sky-clouds-city",
        source: "深圳",
        alt: "高空俯瞰深圳建筑群，明亮积云覆盖城市上空",
        width: 1800,
        height: 1200,
        layout: "photo-pair-large",
      },
      {
        name: "sky-sunset",
        source: "夕阳",
        alt: "橙色晚霞越过深色山影与云层",
        width: 1800,
        height: 1350,
        layout: "photo-pair-small photo-delay",
      },
      {
        name: "sky-airplane-twilight",
        source: "飞机上拍下的景象",
        alt: "飞机翼尖指向橙紫色地平线，弯月悬在暗色天空",
        width: 1800,
        height: 1350,
        layout: "photo-closing",
      },
    ],
  },
] as const;

export default function PhotographyPage() {
  return (
    <SiteChrome>
      <PhotographyReveal />
      <header className="photography-hero section">
        <h1>我眼中的世界</h1>
      </header>

      {photoGroups.map((group) => (
        <section
          className={`photography-chapter section ${group.className}`}
          key={group.startNumber}
        >
          <div className="photography-grid">
            {group.photos.map((photo, index) => (
              <figure
                className={`photography-item ${photo.layout}`}
                data-photo-reveal
                key={photo.name}
              >
                <div className="photography-frame">
                  <ResponsivePhoto
                    name={photo.name}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes={
                      photo.layout === "photo-full"
                        ? "(max-width: 680px) calc(100vw - 2.3rem), min(92vw, 1800px)"
                        : "(max-width: 680px) calc(100vw - 2.3rem), min(64vw, 1400px)"
                    }
                    loading={group.startNumber === 1 && index === 0 ? "eager" : "lazy"}
                  />
                </div>
                <figcaption>
                  <span>
                    {String(group.startNumber + index).padStart(2, "0")}
                  </span>
                  {photo.source}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </SiteChrome>
  );
}
