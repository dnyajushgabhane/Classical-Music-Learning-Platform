/**
 * Audio processing utilities for noise suppression and enhancement
 */

class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.source = null;
    this.gainNode = null;
    this.noiseGate = null;
    this.isInitialized = false;
  }

  async initialize(stream) {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1;

      // Simple noise gate implementation
      this.noiseGate = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.noiseGate.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);
        const threshold = 0.01; // Adjust threshold for noise gate

        for (let i = 0; i < input.length; i++) {
          if (Math.abs(input[i]) < threshold) {
            output[i] = 0; // Mute low-level noise
          } else {
            output[i] = input[i];
          }
        }
      };

      // Connect nodes
      this.source.connect(this.noiseGate);
      this.noiseGate.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
    }
  }

  setNoiseSuppression(enabled) {
    if (!this.noiseGate) return;

    if (enabled) {
      // Reconnect with noise gate
      this.source.disconnect();
      this.source.connect(this.noiseGate);
      this.noiseGate.connect(this.gainNode);
    } else {
      // Bypass noise gate
      this.source.disconnect();
      this.source.connect(this.gainNode);
    }
  }

  setGain(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(2, value));
    }
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}

export default AudioProcessor;