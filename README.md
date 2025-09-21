# 🚀 Real-Time Location Tracker

A minimal, futuristic real-time location tracking web app using Node.js, Express, Socket.IO, Leaflet, and modern UI/UX effects. Track multiple devices live on a map, broadcast your geolocation, and visualize activity with status, alerts, and rich popups.

## 🌟 Features

- **Real-Time Device Tracking**: See all connected devices live on a map, with instant updates using Socket.IO.
- **Geolocation Broadcast**: Share your device’s location (with consent) and see others on OpenStreetMap-powered Leaflet maps.
- **Device Identification**: Each device can set a custom name; all connected devices are listed in the sidebar.
- **Rich Popups**: Click on a device marker for platform info, battery status, connection type, and reverse-geocoded location names.
- **Status & Alerts System**: Quick status buttons (e.g., Safe, Help), real-time alerts, and an activity log for device events.
- **Futuristic UI**: Animated buttons, glowing effects, particle backgrounds, sound effects, and a real-time clock.
- **Minimal & Extensible**: Clean codebase, easy to extend with features like WebRTC, Docker, or offline tiles.

## 🖼️ Demo

Live Demo: [real-location-tracker.vercel.app](https://real-location-tracker.vercel.app)

![Screenshot](https://github.com/user-attachments/assets/efc16d74-38ad-4ca0-9266-107e143ed3c9) <!-- Add a screenshot if available -->

## ⚡ Quick Start

1. **Requirements**: Node.js v18+ and npm.
2. **Clone & Install**:
   ```bash
   git clone https://github.com/mohitsai07/realtime-location-tracker.git
   cd realtime-location-tracker
   npm install
   ```
3. **Run the App**:
   ```bash
   npm start
   ```
   App runs on `http://localhost:3007` by default.
4. **Open in Browser**: Visit the URL above. Allow geolocation access when prompted.
5. **Track Devices**: Enter a name for your device (prompted at startup), and start sharing your location. See all active devices, their locations, and details on the map.

## 🗺️ How It Works

- **Backend** (`Node.js`, `Express`, `Socket.IO`): Manages device connections, location broadcasts, and serves static files.
- **Frontend** (`Leaflet`, `EJS`, `CSS/JS`): Interactive map, device list, status panel, alerts, and activity log.
- **Device Registration**: On connect, each device registers with a name and ID; server maintains an in-memory list.
- **Location Sharing**: Devices emit location data periodically; server broadcasts updates to all clients.
- **Popups & Details**: Each marker displays enhanced popup with live info, reverse-geocoded place names (using [Nominatim](https://nominatim.openstreetmap.org/)), battery, connection type, and more.
- **Status & Alerts**: Quick status buttons send updates; alerts and activity are logged in side panel.
- **Futuristic Effects**: Glow, typewriter, particle, and sound effects create a modern UX.

## 🛠️ Project Structure

```
├── app.js                 # Express/Socket.IO backend
├── views/
│   └── index.ejs          # Main template
├── public/
│   ├── js/main.js         # Client logic: geolocation, socket, map, UI
│   ├── css/style.css      # Custom styles
│   └── ...                # Other static assets
```

## ✨ UI Features

- **Device List**: See all online devices, names, and quick status.
- **Popups**: Click any marker for device info, battery, and location.
- **Status Buttons**: Mark yourself as "Safe", "Help", etc; triggers sound and glow effects.
- **Activity Log & Alerts**: Track recent events and system alerts.
- **Share Location**: Dedicated button for broadcasting location.
- **Futuristic Animations**: Particle effects, glowing buttons, real-time clock, and more.

## 🚧 Roadmap / TODO

- [ ] WebRTC audio/video integration
- [ ] Device icons and avatars
- [ ] Docker support
- [ ] Offline map tiles
- [ ] Advanced logging and history

## 👨‍💻 Contributing

Pull requests and suggestions welcome! See [issues](https://github.com/mohitsai07/realtime-location-tracker/issues) for ideas and bugs.


## 📚 Credits

- [Socket.IO](https://socket.io/)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim Geocoding](https://nominatim.openstreetmap.org/)
- UI/UX inspired by modern dashboard aesthetics.

---

**Made with ❤️ by [@mohitsai07](https://github.com/mohitsai07)**
