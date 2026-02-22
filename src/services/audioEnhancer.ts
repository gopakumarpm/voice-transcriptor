/**
 * Audio pre-processing using Web Audio API.
 * Applies noise gate, high-pass filter, and compression to improve transcription quality.
 */

interface EnhancementOptions {
  noiseGate: boolean;
  highPassFilter: boolean;
  compression: boolean;
}

const DEFAULT_OPTIONS: EnhancementOptions = {
  noiseGate: true,
  highPassFilter: true,
  compression: true,
};

export async function enhanceAudio(
  audioBlob: Blob,
  options: Partial<EnhancementOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const audioContext = new OfflineAudioContext(1, 1, 44100);

    // Decode audio
    const arrayBuffer = await audioBlob.arrayBuffer();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch {
      console.warn('[VT Audio] Cannot decode audio for enhancement, returning original');
      return audioBlob;
    }

    // Create offline context with correct duration
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    let source: AudioNode = offlineCtx.createBufferSource();
    (source as AudioBufferSourceNode).buffer = audioBuffer;

    let lastNode: AudioNode = source;

    // High-pass filter — remove rumble below 80Hz
    if (opts.highPassFilter) {
      const highPass = offlineCtx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 80;
      highPass.Q.value = 0.7;
      lastNode.connect(highPass);
      lastNode = highPass;
    }

    // Compressor — normalize volume levels
    if (opts.compression) {
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      lastNode.connect(compressor);
      lastNode = compressor;
    }

    // Noise gate — suppress low-level noise using a gain node
    if (opts.noiseGate) {
      const gain = offlineCtx.createGain();
      gain.gain.value = 1.0;
      lastNode.connect(gain);
      lastNode = gain;

      // Apply noise gate by processing the buffer data directly after rendering
    }

    lastNode.connect(offlineCtx.destination);
    (source as AudioBufferSourceNode).start(0);

    const renderedBuffer = await offlineCtx.startRendering();

    // Apply noise gate post-processing
    if (opts.noiseGate) {
      applyNoiseGate(renderedBuffer, -40); // -40dB threshold
    }

    // Convert back to blob
    return await audioBufferToBlob(renderedBuffer, audioBlob.type || 'audio/wav');
  } catch (err) {
    console.warn('[VT Audio] Enhancement failed, returning original:', err);
    return audioBlob;
  }
}

function applyNoiseGate(buffer: AudioBuffer, thresholdDb: number): void {
  const threshold = Math.pow(10, thresholdDb / 20);
  const attackSamples = Math.floor(buffer.sampleRate * 0.001); // 1ms attack
  const releaseSamples = Math.floor(buffer.sampleRate * 0.05); // 50ms release

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    let gateOpen = false;
    let holdCounter = 0;

    for (let i = 0; i < data.length; i++) {
      const absVal = Math.abs(data[i]);

      if (absVal > threshold) {
        gateOpen = true;
        holdCounter = releaseSamples;
      } else if (holdCounter > 0) {
        holdCounter--;
      } else {
        gateOpen = false;
      }

      if (!gateOpen) {
        // Smooth fade to zero
        const fadeRatio = holdCounter > 0 ? holdCounter / releaseSamples : 0;
        data[i] *= fadeRatio;
      } else if (holdCounter === releaseSamples) {
        // Smooth attack
        const samplesInAttack = Math.min(i, attackSamples);
        if (samplesInAttack > 0 && samplesInAttack < attackSamples) {
          data[i] *= samplesInAttack / attackSamples;
        }
      }
    }
  }
}

async function audioBufferToBlob(buffer: AudioBuffer, mimeType: string): Promise<Blob> {
  // Convert AudioBuffer to WAV format
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = headerSize;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += bytesPerSample;
    }
  }

  // Return as WAV if original was webm (better for Whisper), else use original mime
  const outMime = mimeType.includes('webm') ? 'audio/wav' : mimeType;
  return new Blob([arrayBuffer], { type: outMime });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
