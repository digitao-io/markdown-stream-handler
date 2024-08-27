export type TextStreamingEngineConfig = {
  onReceive: TextStreamingListener;
}

export type TextStreamingConfig = {
  text: string;
  batchSize: number;
  rate: number;
};

export type TextStreamingListener = (text: string, hasMore: boolean) => void;

export class TextStreamingEngine {
  private send: TextStreamingListener;

  private config: TextStreamingConfig;
  private continue: boolean;
  private pendingTimer: number;

  public constructor(config: TextStreamingEngineConfig) {
    this.send = config.onReceive;
    this.config = { text: "", batchSize: 0, rate: 0 };
    this.continue = false;
    this.pendingTimer = -1;
  }

  public start(config: TextStreamingConfig) {
    this.config = config;

    this.continue = true;

    const recursiveStreaming = (text: string) => {
      if (!this.continue) {
        return;
      }

      if (text === "") {
        return;
      }

      const toSendText = text.slice(0, this.config.batchSize);
      const restText = text.slice(this.config.batchSize);
      this.send(toSendText, restText.length !== 0);

      this.pendingTimer = setTimeout(() => {
        recursiveStreaming(restText);
      }, this.config.rate) as any;
    };

    recursiveStreaming(this.config.text);
  }

  public stop() {
    this.continue = false;

    clearTimeout(this.pendingTimer);
  }
}
