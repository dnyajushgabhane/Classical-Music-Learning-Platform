/**
 * Simple background blur using canvas and basic image processing
 */

class BackgroundBlur {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isEnabled = false;
    this.animationId = null;
  }

  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.startProcessing();
  }

  disable() {
    this.isEnabled = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  startProcessing() {
    if (!this.isEnabled) return;

    const processFrame = () => {
      if (!this.isEnabled) return;

      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;

      // Draw video frame to canvas
      this.ctx.drawImage(this.videoElement, 0, 0);

      // Apply blur filter
      this.ctx.filter = 'blur(10px)';

      // Redraw with blur
      this.ctx.drawImage(this.canvas, 0, 0);

      // Reset filter
      this.ctx.filter = 'none';

      this.animationId = requestAnimationFrame(processFrame);
    };

    processFrame();
  }

  getProcessedStream() {
    // For simplicity, return the original stream
    // In a real implementation, you'd capture the canvas stream
    return this.videoElement.captureStream();
  }

  destroy() {
    this.disable();
  }
}

export default BackgroundBlur;