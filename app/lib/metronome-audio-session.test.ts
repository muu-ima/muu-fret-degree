import { describe, expect, it, vi } from "vitest";
import { createMetronomeAudioSession } from "./metronome-audio-session";
import { playMetronomeClick } from "./audio";
vi.mock("./audio", () => ({ playMetronomeClick: vi.fn() }));

describe("metronome audio session", () => {
  it("uses absolute audio times and stops only its own output, including queued clicks", async () => {
    const output = { connect: vi.fn(), disconnect: vi.fn(), gain: { setValueAtTime: vi.fn() } };
    const context = { currentTime: 7, createGain: () => output, resume: vi.fn().mockResolvedValue(undefined), close: vi.fn() };
    const destination = {} as AudioNode;
    const session = createMetronomeAudioSession(context as unknown as AudioContext, destination);
    await session.ready;
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(output.connect).toHaveBeenCalledWith(destination);
    session.play(7.1, "subdivision", "soft", 0.7);
    expect(playMetronomeClick).toHaveBeenCalledWith(context, 7.1, "subdivision", "soft", 0.7, output);
    context.currentTime = 7.05;
    expect(session.now()).toBe(7.05);
    session.stop();
    session.stop();
    expect(output.gain.setValueAtTime).toHaveBeenCalledWith(0, 7.05);
    expect(output.disconnect).toHaveBeenCalledTimes(1);
    expect(context.close).not.toHaveBeenCalled();
    vi.mocked(playMetronomeClick).mockClear();
    session.play(7.2, "beat", "wood", 1);
    expect(playMetronomeClick).not.toHaveBeenCalled();
  });
});
