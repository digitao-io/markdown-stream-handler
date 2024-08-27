export const specialTokenSeries = [
  {
    name: "link",
    tokens: [
      { matching: "[", hiding: true },
      { matching: /[^\]]+/, hiding: false },
      { matching: "]", hiding: true },
      { matching: "(", hiding: true },
      { matching: /[^)]+/, hiding: true },
      { matching: ")", hiding: true },
    ],
  },
  {
    name: "bold-asterisk",
    tokens: [
      { matching: "**", hiding: true },
      { matching: /[^* ][^*]*/, hiding: false },
      { matching: "*", hiding: true },
      { matching: "*", hiding: true },
    ],
  },
  {
    name: "bold-underline",
    tokens: [
      { matching: "__", hiding: true },
      { matching: /[^_ ][^_]*/, hiding: false },
      { matching: "_", hiding: true },
      { matching: "_", hiding: true },
    ],
  },
  {
    name: "italic-asterisk",
    tokens: [
      { matching: "*", hiding: true },
      { matching: /[^* ][^*]*/, hiding: false },
      { matching: "*", hiding: true },
    ],
  },
  {
    name: "italic-underline",
    tokens: [
      { matching: "_", hiding: true },
      { matching: /[^_ ][^_]*/, hiding: false },
      { matching: "_", hiding: true },
    ],
  },
];