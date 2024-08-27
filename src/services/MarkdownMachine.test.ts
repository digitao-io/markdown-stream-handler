import { MarkdownMachine } from "./MarkdownMachine";
import { specialTokenSeries } from "./SpecialTokenSeries";

describe("MarkdownMachine", () => {
  const outputRecorder = {
    processedContent: "",
    inProcessingContent: "",
  };
  const markdownMachine = new MarkdownMachine({
    specialTokenSeries,
    onProcessedContent: (text) => {
      outputRecorder.processedContent = text;
    },
    onInProcessingContent: (text) => {
      outputRecorder.inProcessingContent = text;
    },
  });

  function testAll(specs: Array<{ input: string, expected: string }>) {
    specs.forEach((spec, index) => {
      it(`step ${index + 1}`, () => {
        markdownMachine.eat(spec.input);
        expect(outputRecorder.inProcessingContent).toEqual(spec.expected);
      });
    });
  }

  beforeEach(() => {
    outputRecorder.processedContent = "";
    outputRecorder.inProcessingContent = "";
    markdownMachine.reset();
  });

  describe("hides special characters on the fly while parsing links", () => {
    const specs = [
      { input: "[", expected: `<p><span class="uncertain"></span></p>\n` },
      { input: "[Hello World", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "[Hello World]", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "[Hello World](", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "[Hello World](https://example", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "[Hello World](https://example.org)", expected: `<p><a href="https://example.org">Hello World</a></p>\n` },
    ];

    testAll(specs);
  });

  describe("hides special characters on the fly while parsing bold text (asterisk)", () => {
    const specs = [
      { input: "**", expected: `<p><span class="uncertain"></span></p>\n` },
      { input: "**Hello World", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "**Hello World*", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "**Hello World**", expected: `<p><strong>Hello World</strong></p>\n` },
    ];

    testAll(specs);
  });

  describe("hides special characters on the fly while parsing bold text (underline)", () => {
    const specs = [
      { input: "__", expected: `<p><span class="uncertain"></span></p>\n` },
      { input: "__Hello World", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "__Hello World_", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "__Hello World__", expected: `<p><strong>Hello World</strong></p>\n` },
    ];

    testAll(specs);
  });

  describe("hides special characters on the fly while parsing italic text (asterisk)", () => {
    const specs = [
      { input: "*", expected: `<p><span class="uncertain"></span></p>\n` },
      { input: "*Hello World", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "*Hello World*", expected: `<p><em>Hello World</em></p>\n` },
    ];

    testAll(specs);
  });

  describe("hides special characters on the fly while parsing italic text (underline)", () => {
    const specs = [
      { input: "_", expected: `<p><span class="uncertain"></span></p>\n` },
      { input: "_Hello World", expected: `<p><span class="uncertain">Hello World</span></p>\n` },
      { input: "_Hello World_", expected: `<p><em>Hello World</em></p>\n` },
    ];

    testAll(specs);
  });
});
