# React Native Desktop DevTools

A modern, high-performance desktop companion app for debugging React Native applications. Built with **Tauri v2 (Rust)**, **React 19**, **Vite**, and **Tailwind CSS**.

Replaces bloated Electron-based debuggers with a lightweight (~4MB) native binary featuring an embedded Rust/Tokio WebSocket hub and a clean, 3-column Flipper-inspired inspection workbench.

---

## Key Features

- **Embedded Rust WebSocket Server**: Ultra-low latency communication hub on port `9020` powered by Tokio and `tokio-tungstenite`. No external background daemon needed.
- **Console Inspector**: Real-time console streaming with log level filtering (`log`, `info`, `warn`, `error`, `debug`), text search, error stack trace inspection, and one-click JSON payload copying.
- **Network Inspector & Live Mocks**: Complete HTTP/HTTPS traffic inspector (fetch, Axios, GraphQL, XHR) with request/response headers, status codes, timing metrics, and a built-in response mock override engine.
- **TanStack Query Inspector**: Deep query cache inspection, query status tags (`fresh`, `fetching`, `stale`, `paused`), and real-time remote actions (invalidate, refetch, reset query).
- **GitHub Plugin Store & Registry**: Browse, install, and update custom inspector plugins live from GitHub (`unified-devtools/plugins`) or any custom repository with 1-click installation.
- **MMKV & AsyncStorage Explorers**: Zero-boilerplate storage inspection. View live key-value pairs, serialized JSON trees, byte footprints, and trigger remote clear/reload actions directly from desktop.
- **Extensible Zero-Desktop Plugin Engine**: Dynamically displays custom debugging panels registered at runtime by mobile clients without recompiling the desktop binary.
- **Multi-Device & Multi-App Switching**: Effortlessly monitor multiple simulators, emulators, or connected physical devices from a single window.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│          React Native Desktop DevTools (Host)          │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │   Rust / Tokio Core   │  │   React 19 / Vite UI  │  │
│  │   WS Server (:9020)   │◄─┤  3-Column Workbench  │  │
│  └───────────▲───────────┘  └───────────────────────┘  │
└──────────────┼─────────────────────────────────────────┘
               │ JSON WebSocket Handshake & RPC
┌──────────────▼─────────────────────────────────────────┐
│              React Native Mobile Client                │
│  @archie-dev/react-native-core & unified-devtools      │
│  (iOS Simulator, Android Emulator, Physical Devices)   │
└────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://www.rust-lang.org/tools/install) (stable)
- Platform build dependencies (Xcode command-line tools for macOS, C++ build tools for Windows)

### Installation

```bash
# Clone the repository
cd react-native-desktop-devtools

# Install frontend dependencies
npm install
```

### Running in Development

Start both Vite dev server and Tauri desktop window:

```bash
npm run tauri dev
```

To run only the web frontend preview in a browser:

```bash
npm run dev
```

### Building for Production

Build an optimized, code-signed release installer (`.dmg` on macOS, `.msi` / `.exe` on Windows):

```bash
npm run tauri build
```

The output binary will be located in:
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Windows**: `src-tauri/target/release/bundle/msi/`

---

## Device Connection Guide

### iOS Simulator
Works automatically out of the box via `127.0.0.1:9020`.

### Android Emulator
Android emulators route host machine loopback through `10.0.2.2`. The client SDK automatically detects Android and connects to `10.0.2.2:9020`.

### Physical Android Devices (USB)
Forward the WebSocket port to your connected device using ADB:

```bash
adb reverse tcp:9020 tcp:9020
```

### Physical iOS / Android Devices (Wi-Fi)
Ensure both your development computer and the testing device are on the same local network, and configure the host IP in your React Native app:

```typescript
import { initDevTools } from '@archie-dev/react-native-core';

initDevTools({
  host: '192.168.1.50', // Replace with your computer's local LAN IP
  port: 9020,
});
```

---

## Project Structure

```
react-native-desktop-devtools/
├── src/
│   ├── components/       # Workbench UI panels (ConsoleView, NetworkView, QueryView, CustomPluginView)
│   ├── theme/            # Theme tokens, dark mode, color palettes
│   ├── types/            # TypeScript schemas for WebSocket packets and plugin models
│   ├── App.tsx           # Main 3-column layout and WebSocket state machine
│   └── main.tsx          # React application root
├── src-tauri/
│   ├── src/              # Rust backend (Tokio WebSocket server, system integration)
│   ├── Cargo.toml        # Rust dependencies (Tauri, Tokio, tokio-tungstenite)
│   └── tauri.conf.json   # Tauri configuration, window dimensions, and permissions
├── package.json
└── vite.config.ts
```

---

## License

MIT © [Unified DevTools Team](https://github.com/unified-devtools)
