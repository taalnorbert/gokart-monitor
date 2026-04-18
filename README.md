## Slovakiaring WebSocket Protocol Cheat Sheet

This section documents the real Slovakiaring feed behavior based on live logs and matches the current parser logic.

### Row and Event Basics

- A driver row id looks like `r14290` or `r900000152`.
- Cell updates are `rowId + column`, for example `r14290c10|tn|1:10.686`.
- Multi-line chunks can contain updates for several rows in a single WebSocket packet.

### Core Columns in Use

- `c4`: nation (can also be present in CSS class like `HUN nat`)
- `c5`: kart number
- `c6`: driver name
- `c10`: last lap display
- `c11`: lap count
- `c14`: best lap display
- `c15`: on-track or pit/out timer (context dependent)
- `c16`: pit counter
- `c17`: total pit time summary

### `c15` Dual Meaning

- `c15|in|0:xx` means live on-track timer.
- `c15|to|xx` or `c15|to|m:ss` means pit/out timer.
- While `c15` is `to`, the value must not be used as a ranking lap source.

### PIT IN and PIT OUT Sequences

Observed PIT IN pattern:

- `c2|si`
- `c15|to|00.`
- `c16|in|N`
- `*in|0`

Observed PIT OUT pattern:

- `c2|so`
- `c15|in|0:00`
- `c17|to|MM:SS`
- `*out|0`

### Non-Lap Events

- `*i1` and `*i2` are sector or intermediate updates, not completed lap events.
- They should never be interpreted as lap count increments.

### Ranking and Validity Rules Implemented

- Minimum valid lap threshold: 50 seconds.
- Fallback order for Slovakiaring ranking source:
  1. `bestLap`
  2. `onTrack` (only if not in pit/out)
  3. `lastLap`
- Any source below threshold is ignored.

### Feed Quality Notes

- `tn` and `ti` both appear for numeric-looking values, so parser should handle both safely.
- Gap fields (`c12` or `c13`) may contain times, `Lap N`, `N Laps`, or empty values.
- Duplicate packets occur frequently; dedup windows are required before persistence.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
