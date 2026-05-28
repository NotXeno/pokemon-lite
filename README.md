# 🎮 Pokémon Lite - Multiplayer Web Battle

Pokémon Lite is a turn-based multiplayer web game that lets two players battle in real-time using their favorite Pokémon. Built with a microservices architecture using React (Frontend) and Flask (Backend), it uses WebSocket communication for smooth, delay-free battles.

## ✨ Features
- **Real-Time Multiplayer:** Custom room system for live battles.
- **Spectator Mode:** Other players can join an ongoing room to watch the battle live.
- **3v3 Battle System:** Pick 3 Pokémon to build your ultimate team.
- **Type Advantage Logic:** Element weaknesses apply (e.g., Water beats Fire, Fire beats Grass) for extra strategy.
- **Retro UI & BGM:** Gameboy-style user interface with background music and an auto-scrolling live battle log.
- **Rematch System:** Instant rematch option after a battle ends.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS
- **Backend:** Python, Flask, Flask-Sock (WebSocket)
- **Message Broker & Cache:** RabbitMQ, Redis
- **Infrastructure:** Docker & Docker Compose

## 📥 How to Download

### Method 1: Git Clone
Open your terminal and run this command:
```bash
git clone https://github.com/NotXeno/pokemon-lite.git
```

### Method 2: ZIP Download
Click the green **"<> Code"** button at the top right of this repository page, then select **"Download ZIP"**. Extract the ZIP file to your computer.

## 🚀 How to Run Locally

**Requirement:** Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your computer.

1. Open your terminal and go to the project folder:
```bash
cd pokemon-lite
```
2. Make sure the IP addresses in `frontend/src/App.jsx` are set to `127.0.0.1` for the `fetch` and `WebSocket` connections.
3. Start all containers using Docker Compose:
```bash
docker compose up -d --build
```
4. Open your browser and go to: `http://localhost:5173`

*(Note: If the "Join Room" button doesn't work right after starting, run `docker compose restart backend` in your terminal. RabbitMQ sometimes takes a few extra seconds to fully start).*

## ☁️ How to Deploy to Cloud Server (Google Cloud / Linux VPS)

1. Create a VM Instance (e2-medium specs with 4GB RAM is recommended) and use Ubuntu OS.
2. Open ports **5173** and **8000** in your server's Firewall rules.
3. Open the server's SSH terminal and install Git and Docker:
```bash
   sudo apt update && sudo apt install git docker.io docker-compose-v2 -y
```
4. Clone this repository into the server.
5. **Important:** Open `frontend/src/App.jsx` using `nano` and change all `127.0.0.1` addresses to your server's **Public IP (External IP)**.
6. Run Docker Compose:
```bash
sudo docker compose up -d --build
```
7. Play the game via browser using your server's IP: `http://<YOUR_SERVER_PUBLIC_IP>:5173`

## 📖 How to Play

1. Enter a unique **Room ID** and your **Player Name**. Share the Room ID with your friend.
2. Wait until your friend joins the exact same room.
3. Pick 3 Pokémon for your team, then click **Ready**.
4. In the arena, take turns using attacks. You cannot use the exact same attack twice in a row!
5. Use element advantages (e.g., Water deals double damage to Fire) to win the battle!
