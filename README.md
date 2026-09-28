# Slow Roads — open-road refresh

A browser build of **Slow Roads**, the procedural driving game by Anslo. The bundled simulation and original media are kept intact; this checkout adds a responsive presentation layer and optional quality-of-life controls around the existing game.

## Run locally

No build step is needed. Serve this directory over HTTP (WebGL assets do not work reliably from `file://`):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a recent desktop browser with WebGL enabled.

## What changed in this refresh

- A scenic, responsive start screen with a shareable world seed.
- A compact live journey panel with elapsed drive time and a locally saved personal-distance best.
- Quick access to the game's existing world, weather, vehicle, and graphics menus.
- Photo mode to hide the interface, plus quick pause, sound, and route-link actions.
- Touch-screen steering, brake, and acceleration buttons; desktop play remains keyboard-first.
- Larger menu targets, improved contrast, keyboard focus styling, reduced-motion support, and small-screen layouts.

## Controls

- **W / A / S / D** — accelerate, steer, and brake; **Space** — handbrake; **Shift** — boost.
- **P** — pause; **F** — autodrive; **C** — change camera; **M** — sound.
- **R** — reset vehicle; **U** — toggle the original game HUD.
- On touch devices, hold the on-screen arrow, brake, and drive buttons.

The world seed is copied as a `?seed=...` link, so another player can load the same generated road. The personal best is stored locally in the browser and is not uploaded.

## Credits and rights

Slow Roads and its original game code/media are by [Anslo](https://anslo.dev) (RobertTBS's original repository describes this checkout as an unofficial, outdated copy). Please retain the original attribution. The source README identifies the original material as **CC BY-NC-ND 4.0**; that notice restricts redistribution of adapted versions, so obtain permission from the rights holder before publishing or redistributing a modified build. This repository's refresh layer is provided for local experimentation.
