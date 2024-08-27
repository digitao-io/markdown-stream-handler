<script setup lang="ts">
import { reactive, ref } from 'vue';
import morphdom from 'morphdom';
import { TextStreamingEngine } from './services/TextStreamingEngine';
import { MarkdownMachine } from './services/MarkdownMachine';
import { specialTokenSeries } from './services/SpecialTokenSeries';

const exampleContent = `# Markdown Streaming Test

## The examples down below are OK

Link: [This is the link text](https://example.org?foo=bar&baz=qux&randomstuff=aGVsbG8gd29ybGQ), the URL shouldn't be shown.

Link false positive: https://example.org [see footnote 1] is an interesting website (for testing).

Bold text (asterisk): **This should be bold**, the asterisks shouldn't be shown.

Bold text (underline): __This should be bold__, the underlines shouldn't be shown.

Bold false positive: ** This is not bold **

Italic text (asterisk): *This should be italic*, no asterisks should be shown.

Italic text (underline): _This should be italic_, no asterisks should be shown.

Italic false positive: 3 * 7 = 21

Italic false positive:
* this is a list, not italic
* this too

#### Headline works out of the box

####### It also handles the false positive situation

## But these are problematic

Bold false positive: **This is not bold

Italic false positive: This_is not italic

Italic false positive: 3*7=21

Bold and italic: **This should be bold, *and also italic***, the asterisks shouldn't be shown.

Italic and bold: _This should be italic, __and also bold__, and again italic_, the asterisks shouldn't be shown.

Link and bold: [This is the **link text**](https://example.org?foo=bar&baz=qux&randomstuff=aGVsbG8gd29ybGQ), the URL and asterisks shouldn't be shown.

Link and italic: [This is the _link text_](https://example.org?foo=bar&baz=qux&randomstuff=aGVsbG8gd29ybGQ), the URL and asterisks shouldn't be shown.

\`\`\`javascript
// Source code
const result = handlers[0](param);
\`\`\`

\`\`\`python
# Source code
result = 3**2**5
another_result = 3*7
\`\`\`
`;

const markdownMachine = new MarkdownMachine({
  specialTokenSeries,
  onProcessedContent: (text) => {
    processedContent.value += text;
  },
  onInProcessingContent: (text) => {
    const inProcessingContent = displayArea.value!.querySelector(".in-processing-content")!;
    morphdom(inProcessingContent, `<div class="in-processing-content">${text}</div>`)
  },
});

const textStreamingEngine = new TextStreamingEngine({
  onReceive: (text, hasMore) => {
    markdownMachine.eat(text);
    if (!hasMore) {
      markdownMachine.finishEating();
    }
  }
});

const streamingConfig = reactive({
  text: exampleContent,
  batchSize: 1,
  rate: 50,
});

const displayArea = ref<HTMLDivElement | null>(null);

const processedContent = ref("");

const onStart = () => {
  onStop();
  reset();
  textStreamingEngine.start(streamingConfig);
}

const onStop = () => {
  textStreamingEngine.stop();
}

const reset = () => {
  processedContent.value = "";

  const inRenderingContent = displayArea.value!.querySelector(".in-processing-content")!;
  inRenderingContent.innerHTML = "";

  markdownMachine.reset();
}
</script>

<template>
  <h1 class="site-title">Markdown Streaming Test</h1>
  
  <main>
    <div class="input-area">
      <textarea
        class="markdown-input"
        v-model="streamingConfig.text"
      />
      
      <div class="input-field">
        <label id="batch-size-label">Batch Size</label>
        <input
          class="batch-size-input"
          type="number"
          aria-labelledby="batch-size-label"
          v-model="streamingConfig.batchSize"
        > charactters per batch
      </div>

      <div class="input-field">
        <label id="rate-label">Rate</label>
        <input
          class="rate-input"
          type="number"
          aria-labelledby="rate-label"
          v-model="streamingConfig.rate"
        > ms per batch
      </div>

      <button
        class="start-button"
        @click="onStart"
      >
        Start Streaming
      </button>

      <button
        class="stop-button"
        @click="onStop"
      >
        Stop Streaming
      </button>
    </div>

    <div class="display-area" ref="displayArea">
      <div class="processed-content" v-html="processedContent" />
      <div class="in-processing-content" />
    </div>
  </main>
</template>

<style scoped>
main {
  display: flex;
  gap: 12px;
}

.input-area {
  flex: 1 1;
}

.display-area {
  flex: 1 1;
}

.markdown-input {
  display: block;
  width: calc(100% - 6px);
  height: 400px;
}

.input-field {
  margin: 8px 0;
  box-sizing: border-box;
}

.input-field > label {
  display: block;
}

:deep(.uncertain) {
  color: #777;
}

:deep(.uncertain)::after {
  display: inline-block;
  margin-left: 1ch;
  content: "...";
  animation: blink 0.4s infinite;
}

@keyframes blink {
  50% {
    color: transparent;
  }
}
</style>
