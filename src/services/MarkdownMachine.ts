import { marked } from "marked";

type ContentReporter = (text: string) => void;

type TokenSeries = {
  name: string;
  tokens: Token[];
}

type Token = {
  matching: string | RegExp;
  hiding: boolean;
};

type ContextStackEntry = {
  tokenSeries: TokenSeries;
  nextTokenIndex: number;
  tokenRanges: ContextStackTokenRange[];
};

type ContextStackTokenRange = {
  from: number;
  to: number;
  hidden: boolean;
};

export type MarkdownMachineConfig = {
  specialTokenSeries: TokenSeries[];
  onProcessedContent: ContentReporter;
  onInProcessingContent: ContentReporter;
};

export class MarkdownMachine {
  private specialTokenSeries: TokenSeries[];
  private reportProcessedContent: ContentReporter;
  private reportInProcessingContent: ContentReporter;

  private inProcessingContent: string;

  public constructor(config: MarkdownMachineConfig) {
    this.specialTokenSeries = config.specialTokenSeries;
    this.reportProcessedContent = config.onProcessedContent;
    this.reportInProcessingContent = config.onInProcessingContent;

    this.inProcessingContent = "";
  }

  public eat(text: string) {
    this.inProcessingContent += text;
    const tokens = marked.lexer(this.inProcessingContent);

    while (tokens.length > 1) {
      const firstToken = tokens.shift()!;
      
      if (firstToken.type !== "space") {
        const htmlCode = marked.parser([firstToken]);
        this.reportProcessedContent(htmlCode);
      }

      this.inProcessingContent = this.inProcessingContent.replace(firstToken.raw, "");
    }

    const contextStack = [];
    let index = 0;
    while (index < this.inProcessingContent.length) {
      const toTransform = this.inProcessingContent.slice(index);
      let consumed = false;

      for (let i = contextStack.length - 1; i >= 0; i--) {
        const stackEntry = contextStack[i];
        const nextToken = stackEntry.tokenSeries.tokens[stackEntry.nextTokenIndex];
        const matchedLength = this.matchToken(toTransform, nextToken);
        if (matchedLength === 0) {
          contextStack.splice(i);
          continue;
        } else {
          const tokenRange = { from: index, to: index + matchedLength, hidden: nextToken.hiding };
          stackEntry.tokenRanges.push(tokenRange);
  
          stackEntry.nextTokenIndex += 1;
          if (stackEntry.tokenSeries.tokens.length === stackEntry.nextTokenIndex) {
            contextStack.splice(i);
          }
  
          index += matchedLength;
          consumed = true;
  
          break;
        }
      }

      if (consumed) {
        continue;
      }

      for (const tokenSeries of this.specialTokenSeries) {
        const firstToken = tokenSeries.tokens[0];
        const matchedLength = this.matchToken(toTransform, firstToken);
        if (matchedLength === 0) {
          continue;
        }

        const stackEntry: ContextStackEntry = {
          tokenSeries,
          nextTokenIndex: 1,
          tokenRanges: [],
        };
        contextStack.push(stackEntry);

        const tokenRange = { from: index, to: index + matchedLength, hidden: firstToken.hiding };
        stackEntry.tokenRanges.push(tokenRange);

        index += matchedLength;
        consumed = true;

        break;
      }

      if (consumed) {
        continue;
      }

      index += 1;
    }

    const tokenRanges: ContextStackTokenRange[] = [];
    for (const stackEntry of contextStack) {
      for (const tokenRange of stackEntry.tokenRanges) {
        tokenRanges.push(tokenRange);
      }
    }

    let toParse = "";
    let enteredUnderstainArea = false;
    for (let i = 0; i < this.inProcessingContent.length; i++) {
      const matchingRange = tokenRanges.find((range) => range.from <= i && i < range.to);
      if (!matchingRange) {
        toParse += this.inProcessingContent.charAt(i);
        continue;
      }

      if (!enteredUnderstainArea) {
        toParse += `<span class="uncertain">`;
        enteredUnderstainArea = true;
      }

      if (!matchingRange.hidden) {
        toParse += this.inProcessingContent.charAt(i);
      }
    }

    if (enteredUnderstainArea) {
      toParse += "</span>";
    }

    const htmlCode = marked.parse(toParse) as string;
    this.reportInProcessingContent(htmlCode);
  }

  public finishEating() {
    const htmlCode = marked.parse(this.inProcessingContent) as string;
    this.reportProcessedContent(htmlCode);
    this.reportInProcessingContent("");
  }

  public reset() {
    this.inProcessingContent = "";
  }

  private matchToken(text: string, token: Token) {
    if (isString(token.matching)) {
      return text.startsWith(token.matching) ? token.matching.length : 0;
    } else {
      const result = token.matching.exec(text);
      return result?.index === 0 ? result[0].length : 0;
    }
  }
}

function isString(s: string | RegExp): s is string {
  return typeof s === "string";
}
