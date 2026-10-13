/** Finale: the whole page as one PCB. Drawn by ending-board.js (canvas), scrubbed by scroll. */
export const BOARD_PARTS = [
  ["U1", "本职工作", "work"],
  ["U2", "个人插件", "plugins"],
  ["U3", "其它项目", "more"],
  ["U4", "最近在用", "tools"],
  ["U5", "音乐", "music"],
  ["U6", "摄影", "photo"],
  ["J1", "联系", "contact"],
] as const;

export function EndingBoard() {
  return (
    <section className="ending" id="ending" aria-label="整页电路板">
      <div className="ending-pin">
        <canvas className="ending-cv" aria-hidden="true"></canvas>
        <div className="ending-parts">
          {BOARD_PARTS.map(([ref, name, id]) => (
            <a key={ref} className="ending-part" href={`#${id}`} data-ref={ref} aria-label={`${ref} ${name}`}>
              <span>
                {ref} · {name}
              </span>
            </a>
          ))}
          <a className="ending-top" href="#top" aria-label="回到顶部">
            <i aria-hidden="true"></i>回到顶部
          </a>
        </div>
      </div>
    </section>
  );
}
