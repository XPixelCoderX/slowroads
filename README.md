# Slow Roads — n2ab edition

A calm, browser-based procedural driving experience. Take the long way, explore a changing world, and just drive. This edition keeps the bundled renderer and simulation intact while giving the start screen and driving interface a cleaner, more usable presentation.

**Made by n2ab** · [discord.pcsmp.net](https://discord.pcsmp.net)

## Run locally

No build step is needed. Serve this directory over HTTP (WebGL assets do not work reliably from `file://`):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a recent desktop browser with WebGL enabled.

## What is included in this refresh

- A scenic, responsive start screen with a shareable world seed.
- Clear maker credit for **n2ab** and a direct **discord.pcsmp.net** community link.
- A simplified footer with the old creator and donation prompts removed.
- A repositioned, click-through upcoming-road SVG so it cannot block the bottom controls.
- A compact live journey panel with elapsed drive time and a locally saved personal-distance best.
- Quick access to the existing world, weather, vehicle, and graphics menus.
- Photo mode, pause, sound, route sharing, autodrive, vehicle reset, camera, and HUD actions.
- Touch steering, braking, and acceleration controls with safe pointer release handling.
- Larger menu targets, improved contrast, keyboard focus styling, reduced-motion support, and small-screen layouts.
- Accessible keyboard activation for the start button plus Escape-to-close quick menus.

## Controls

- **W / A / S / D** — accelerate, steer, and brake.
- **Space** — handbrake; **Shift** — boost.
- **P** — pause; **F** — autodrive; **C** — change camera; **M** — sound.
- **R** — reset vehicle; **U** — toggle the original game HUD.
- On touch devices, hold the on-screen arrow, brake, and drive buttons.

The world seed is copied as a `?seed=...` link, so another player can load the same generated road. The personal best is stored locally in the browser and is not uploaded.

## Credits and rights

This customized presentation and its interface improvements are maintained by **n2ab**. Join the community at <https://discord.pcsmp.net>.

The bundled simulation and media are included as supplied with this checkout. Review the rights for those original assets before publishing or redistributing a modified build.
