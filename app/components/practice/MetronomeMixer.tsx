import { useId } from "react";
import { metronomeMixerChannels, type MetronomeMix, type MetronomeMixerChannel } from "../../lib/metronome-mixer";
import styles from "./MetronomeMixer.module.css";

type Props = { mix: MetronomeMix; onChange: (channel: MetronomeMixerChannel, volume: number) => void };

const channelDisplay = {
  accent: { title: "ACC", subtitle: "小節頭", positions: [true], description: "小節の1拍目にアクセントを追加" },
  quarter: { title: "4分", subtitle: "表拍", positions: [true, false, false, false], description: "各拍の頭（1）" },
  eighth: { title: "8分", subtitle: "裏拍", positions: [false, false, true, false], description: "各拍の中間（&）" },
  sixteenth: { title: "16分", subtitle: "裏拍", positions: [false, true, false, true], description: "各拍の1/4と3/4（e・a）" },
  triplet: { title: "三連", subtitle: "3等分", positions: [true, true, true], description: "各拍を均等に3分割" },
} as const;

export function MetronomeMixer({ mix, onChange }: Props) {
  const id = useId();
  const activeCount = metronomeMixerChannels.filter((channel) => mix[channel.id] > 0).length;

  return (
    <fieldset className={styles.mixer} aria-describedby={`${id}-help`}>
      <legend>ノートミキサー</legend>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>NOTE MIX</span>
        <span className={styles.summary}>{activeCount === 0 ? "全チャンネル OFF" : `${activeCount} / 5 ON`}</span>
      </div>
      <p id={`${id}-help`} className={styles.help}>表と裏を組み合わせて、リズムをつくる。</p>
      <div className={styles.channels}>
        {metronomeMixerChannels.map((channel) => {
          const display = channelDisplay[channel.id];
          const percent = Math.round(mix[channel.id] * 100);
          const inputId = `${id}-${channel.id}`;
          return (
            <div key={channel.id} className={styles.channel} data-active={percent > 0}>
              <label htmlFor={inputId} className={styles.channelLabel}>
                <strong>{display.title}</strong>
                <span>{display.subtitle}</span>
              </label>
              <div className={styles.positions} role="img" aria-label={display.description}>
                {display.positions.map((hit, index) => <i key={index} data-hit={hit} />)}
              </div>
              <output htmlFor={inputId} className={styles.value}>{percent}<small>%</small></output>
              <div className={styles.fader}>
                <input id={inputId} type="range" min="0" max="100" step="1" value={percent}
                  aria-label={`${channel.label}の音量`} aria-valuetext={`${percent}%${percent === 0 ? "、消音" : ""}`}
                  aria-describedby={`${id}-${channel.id}-description`}
                  onChange={(event) => onChange(channel.id, Number(event.target.value) / 100)} />
              </div>
              <span className={styles.channelState}>{percent > 0 ? "ON" : "OFF"}</span>
              <span id={`${id}-${channel.id}-description`} className="srOnly">{display.description}。0%で消音。</span>
            </div>
          );
        })}
      </div>
      <div className={styles.guide}>
        <span className={styles.guideTitle}>1拍の位置</span>
        <div className={styles.beatGuide}>
          <span><strong>1</strong><small>4分</small></span>
          <span><strong>e</strong><small>16分裏</small></span>
          <span><strong>&amp;</strong><small>8分裏</small></span>
          <span><strong>a</strong><small>16分裏</small></span>
        </div>
      </div>
      <p className={styles.footer}>0%で消音 · 全体の音量はVolumeで調整</p>
    </fieldset>
  );
}
