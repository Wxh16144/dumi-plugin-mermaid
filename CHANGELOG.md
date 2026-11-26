# [1.3.0](https://github.com/Wxh16144/dumi-plugin-mermaid/compare/v1.2.0...v1.3.0) (2026-11-26)

### Bug Fixes

- **playground:** resolve local plugin from \_\_dirname ([29304f4](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/29304f4a7c9a7c27dfd5da0455a9366b35636661))

### Features

- defer mermaid loading and support external runtime url ([5987de8](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/5987de8b4834e502312a2d0a9c5c783afef0c5dc))
- inject runtimeURL at build time instead of per-diagram props ([888db2f](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/888db2f032e7bdead4330de4e6779d0dcaddda40))

### Performance Improvements

- **component:** add skeleton placeholder, prefetch and tab semantics ([7a0970b](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/7a0970bc08682c26192e401141314117d0b069b8))
- keep rendered diagram mounted to avoid flicker when switching views ([71ed54e](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/71ed54ee45f3c12f7fac4115f75650d613e97056))

# [1.2.0](https://github.com/Wxh16144/dumi-plugin-mermaid/compare/v1.1.0...v1.2.0) (2026-09-29)

### Features

- show dumi loading skeleton while rendering mermaid diagram ([f7aaa0c](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/f7aaa0c94dd95bf548744a1a461dce6b1ed9063d))
- syntax highlight mermaid source code ([f2af6bd](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/f2af6bd30faade51433d8f047d5d645ccf68dd86))

# [1.1.0](https://github.com/Wxh16144/dumi-plugin-mermaid/compare/v1.0.0...v1.1.0) (2026-09-28)

### Features

- add MermaidSource component and onRender callback; update documentation ([80f9b13](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/80f9b135f943fab53ff9ab30f14c2d6f41222e3b))
- update Mermaid component to serialize SVG on render; improve documentation ([cd3921e](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/cd3921e71ab02fc523e0fac03ddd30e1bdb55cee))

# 1.0.0 (2026-09-28)

### Bug Fixes

- Update component name references to DumiPluginMermaid for consistency ([85aa446](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/85aa446b4c5ddb93e74d6316100077eea25923d0))

### Features

- Add MermaidToggle component for switching between diagram and source code views; enhance README and usage documentation ([bc13cca](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/bc13cca7090fdcb5ea186e28ca6ffaf80a52adbd))
- center mermaid diagrams by default ([3678ca4](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/3678ca41cb642434b17b1d0c0a84550359c85aa4))
- Enhance Mermaid support with additional diagram examples and improve marker handling ([ee8e3ed](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/ee8e3ed17817746525cb8fe7de8f2184bbe71ba5))
- Introduce Mermaid and MermaidToggle components; enhance documentation and tests for improved usage ([0fce097](https://github.com/Wxh16144/dumi-plugin-mermaid/commit/0fce09798be9c318aece7bde8c1101d24c5a6d7b))
