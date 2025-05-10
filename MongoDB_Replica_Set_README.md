# 📦 OldPhoneDeals – MongoDB Replica Set Setup Guide

This guide provides setup instructions for initializing a local MongoDB **replica set** to support development and testing of the OldPhoneDeals eCommerce application.

---

## ✅ Requirements

- MongoDB (v7 or later)
- Node.js and npm installed
- Git and access to the USyd GitHub organization
- Cloned project repository

---

## ⚙️ Manual Setup (Windows & macOS)

### 1. Install MongoDB

**Windows:**
Download from: https://www.mongodb.com/try/download/community  
During installation, make sure `mongod.exe` is added to your `PATH`.

**macOS:**
Using Homebrew:

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
```

### 2. Create MongoDB Data Directory

**Windows:**
```powershell
mkdir C:\data\db
```

**macOS:**
```bash
mkdir -p ~/data/db
```

### 3. Start MongoDB with Replica Set

> Open a terminal and run the appropriate command below.

**Windows:**
```powershell
& "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --replSet rs0 --dbpath "C:\data\db"
```

**macOS:**
```bash
mongod --replSet rs0 --dbpath ~/data/db
```

> Keep this terminal running.

### 4. Initiate the Replica Set

Open a **new terminal** and start the MongoDB shell:

```bash
mongosh
```

Then inside the shell, run:

```javascript
rs.initiate()
```

### 5. Check Replica Set Status

```javascript
rs.status()
```

You should see `"myState": 1` and `"set": "rs0"` in the output.

---

## ⚡ macOS: One-Line Quick Start Command

This command does everything: creates the DB path, starts `mongod` in background, waits 5 seconds, and runs `rs.initiate()` in the shell.

```bash
mkdir -p ~/data/db && mongod --replSet rs0 --dbpath ~/data/db & sleep 5 && echo 'rs.initiate()' | mongosh
```

## ⚡ Windows: One-Line Quick Start Command

```powershell
New-Item -ItemType Directory -Force -Path "C:\data\db"; Start-Process powershell -ArgumentList '-NoExit','-Command','"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --replSet rs0 --dbpath "C:\data\db"'; Start-Sleep -Seconds 5; mongosh -Command "rs.initiate()"
```

> ✅ Use this only once to initialize your dev environment.

---

## 🧪 Troubleshooting

- **Port in use:** `lsof -i :27017` (macOS) or check Task Manager (Windows).
- **Permission denied:** Run `chmod 755 ~/data/db` on macOS.
- **Replica Set not working:** Ensure you’ve run `rs.initiate()` after `mongod` starts.
- **DB not found:** Verify the `--dbpath` exists and is correct.

---

## ✅ Ready to Run

- MongoDB should be listening at: `mongodb://localhost:27017/oldphonedeals?replicaSet=rs0`
- Start the backend server with: `npm start` or `node app.js`

---

Happy developing! 🚀