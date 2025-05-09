# 📦 OldPhoneDeals – MongoDB Replica Set Setup Guide

This guide provides setup instructions for initializing a local MongoDB **replica set** to support development and testing of the OldPhoneDeals eCommerce application.

---

## ✅ Requirements

- MongoDB (v7 or later)
- Node.js and npm installed
- Git and access to the USyd GitHub organization
- Cloned project repository

---

## ⚙️ Step-by-Step Setup (Windows & macOS)

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

> Open a new terminal and run the following command based on your OS:

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

### 5. Check Status

```javascript
rs.status()
```

You should see `"myState": 1` and `"set": "rs0"` in the output.

---
## 🧪 Troubleshooting

- **Port in use:** `lsof -i :27017` (macOS) or use Task Manager (Windows).
- **Permission denied:** Run `chmod 755 ~/data/db` on macOS.
- **Replica Set not working:** Ensure you’ve initiated using `rs.initiate()`.
- **DB not found:** Make sure the db path is correct and accessible.

---

## ✅ Ready to Run

- Confirm MongoDB is listening on `mongodb://localhost:27017/?replicaSet=rs0`
- Start your backend: `npm start` or `node app.js`

---

Happy developing! 🚀