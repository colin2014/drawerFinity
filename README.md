# Drawfinity 📦 | Gridfinity Cabinet & Drawer Generator

**Drawfinity** is a precision MakerCase-style web application designed to generate laser-cut storage cabinets and slide-out drawers tailored specifically for [Gridfinity](https://gridfinity.xyz/) modular storage.

## ✨ Features

- **📐 Smart Dual Dimensioning:** Toggle seamlessly between **Gridfinity Units** (e.g., `4 × 5 columns`, `6U height`) and **Exact Millimeters**.
- **🗄️ Automated Outer Cabinets:** Generates multi-tier outer cabinet casings with horizontal shelf runners and divider slots.
- **🛠️ Hardware & Handle Mounts:** Generates standardized slot cutouts designed to mount custom 3D-printed pulls or standard M3/M4 bolt hardware.
- **🔥 Laser Kerf & Joint Optimization:** Customizable finger joint sizing and adjustable kerf compensation slider (`0.0mm – 0.3mm`) for snug press-fits right off the laser.
- **👁️ Interactive Visualizer:** Real-time dual preview stage featuring interactive 3D orbit views and standalone 2D cut sheet panel inspection.
- **📥 Instant SVG Export:** Download standalone panel SVGs or combined master cut sheets ready for LightBurn, Illustrator, or Inkscape.

---

## 🚀 How to Host This on GitHub Pages (Free & Instant)

Because Drawfinity is built with pure HTML5, CSS3, and ES Modules (with zero build-step or complex node dependencies), you can host it live on GitHub in under 1 minute:

1. **Create a New GitHub Repository**
   - Go to [github.com/new](https://github.com/new) and name your repository `drawfinity`.
   - Set it to **Public**.

2. **Push These Files to GitHub**
   Initialize git in this folder and push to your new repo:
   ```bash
   git init
   git add .
   git commit -m "Initial Drawfinity release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/drawfinity.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - In your repository on GitHub, click **Settings** -> **Pages** (on the left sidebar).
   - Under **Build and deployment** -> **Source**, select `Deploy from a branch`.
   - Under **Branch**, select `main` and `/ (root)`.
   - Click **Save**.

In ~30 seconds, your live site will be published at `https://YOUR_USERNAME.github.io/drawfinity/`! 🎉

---

## 💡 Usage Notes

- **Gridfinity Baseplates:** The generated drawer bottom plates are clean flat rectangles sized to fit standard 3D printed Gridfinity baseplates inside.
- **Laser Cutting:** Red lines represent vector cuts (`#ff0000`). Blue/Cyan text and shapes represent light surface scoring/engraving or visual identification labels.
