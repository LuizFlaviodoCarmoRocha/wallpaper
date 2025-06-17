# NASA APOD Wallpaper Carousel

A simple React + TypeScript + Vite application that fetches images from NASA's Astronomy Picture of the Day (APOD) API and displays them in a full-screen carousel with fade transitions.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Defaults

- Fetches 10 random images on load and every 60 minutes
- Rotates images every 60 seconds
- Caches image URLs in localStorage
