(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom 没有实现 matchMedia，`useColorScheme` 依赖它判断暗色
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
