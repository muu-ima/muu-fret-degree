import { metronomeMixerChannels, type MetronomeMix, type MetronomeMixerChannel } from "../../lib/metronome-mixer";
import styles from "./MetronomeMixer.module.css";

type Props = { mix: MetronomeMix; onChange: (channel: MetronomeMixerChannel, volume: number) => void };

export function MetronomeMixer({ mix, onChange }: Props) {
  return (
    <fieldset className={styles.mixer}>
      <legend>ノートミキシング</legend>
      <p>4分は表、8分の裏は「&」、16分の裏は「e・a」。0%でその音を消せます。</p>
      <div className={styles.channels}>
        {metronomeMixerChannels.map((channel) => (
          <label key={channel.id} className={styles.channel}>
            <span>{channel.label}</span>
            <input type="range" min="0" max="100" step="1" value={Math.round(mix[channel.id] * 100)}
              aria-label={`${channel.label}の音量`} aria-valuetext={`${Math.round(mix[channel.id] * 100)}%`}
              onChange={(event) => onChange(channel.id, Number(event.target.value) / 100)} />
            <output>{Math.round(mix[channel.id] * 100)}%</output>
          </label>
        ))}
      </div>
      <p>アクセントは小節の頭に追加。全体の音量はVolumeで調整します。</p>
    </fieldset>
  );
}
