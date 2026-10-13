/** Finale: the real X86 motherboard from the hero, with each homepage section mapped to a real component. */
export const BOARD_PARTS = [
  ["U1", "本职工作", "work", "CPU · LGA1700"],
  ["U2", "个人插件", "plugins", "PCIe x16"],
  ["U3", "其它项目", "more", "M.2"],
  ["U4", "最近在用", "tools", "DDR · DIMM×2"],
  ["U5", "音乐", "music", "AUDIO CODEC"],
  ["U6", "摄影", "photo", "PCH"],
  ["J1", "联系", "contact", "ATX 24P"],
] as const;

export function EndingBoard() {
  return (
    <section className="ending" id="ending" aria-label="整页电路板">
      <div className="ending-pin">
        <canvas className="ending-cv" aria-hidden="true"></canvas>
        <div className="ending-parts">
          {BOARD_PARTS.map(([ref, name, id, part]) => (
            <a key={ref} className="ending-part" href={`#${id}`} data-ref={ref} aria-label={`${ref} ${name}`}>
              <b>{ref}</b>
              <span>{name}</span>
              <small>{part}</small>
            </a>
          ))}
          <a className="ending-top" href="#top" aria-label="回到顶部">
            <i aria-hidden="true"></i>回到顶部
          </a>
        </div>
        <p className="ending-credit">
          板：<a href="https://oshwhub.com/oshwhub/dian-nao-zhu-ban" target="_blank" rel="noopener">【全网首发】X86电脑主板</a> · OSHWHub 官方 · GPL-3.0
        </p>
      </div>
    </section>
  );
}
