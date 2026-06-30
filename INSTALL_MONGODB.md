# MongoDB Installation Guide

## Windows Installation

### Option 1: MongoDB Community Server (Recommended)

1. **Download MongoDB**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Download the MSI installer

2. **Install MongoDB**
   ```
   - Run the downloaded .msi file
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)
   ```

3. **Verify Installation**
   ```bash
   # Open Command Prompt as Administrator
   net start MongoDB
   
   # Check if running
   mongo --version
   ```

4. **Create Data Directory** (if not created automatically)
   ```bash
   mkdir C:\data\db
   ```

### Option 2: MongoDB Atlas (Cloud - Free Tier)

1. **Sign Up**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Create free account

2. **Create Cluster**
   - Choose FREE tier (M0)
   - Select region closest to you
   - Create cluster (takes 3-5 minutes)

3. **Configure Access**
   - Add IP address: 0.0.0.0/0 (allow all - for development only)
   - Create database user with password

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password

5. **Update Backend .env**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urbanml?retryWrites=true&w=majority
   ```

---

## Starting MongoDB

### Windows Service
```bash
# Start (as Administrator)
net start MongoDB

# Stop
net stop MongoDB

# Check status
sc query MongoDB
```

### Manual Start
```bash
# Start MongoDB manually
mongod --dbpath C:\data\db

# Keep this terminal open while using the app
```

---

## Troubleshooting

### "MongoDB service not found"
- MongoDB not installed as service
- Use manual start: `mongod --dbpath C:\data\db`

### "Data directory not found"
```bash
mkdir C:\data\db
mongod --dbpath C:\data\db
```

### "Port 27017 already in use"
```bash
# Find process using port
netstat -ano | findstr :27017

# Kill process (replace PID)
taskkill /PID <process_id> /F
```

### Connection Refused
1. Check if MongoDB is running: `sc query MongoDB`
2. Check firewall settings
3. Verify connection string in `.env`

---

## Verify Connection

1. **Using MongoDB Compass** (GUI)
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`
   - Should see connection successful

2. **Using Command Line**
   ```bash
   mongo
   # Should open MongoDB shell
   
   show dbs
   # Should list databases
   ```

3. **Using Application**
   - Start backend server
   - Check logs for "MongoDB connected successfully"

---

## Default Configuration

- **Host**: localhost (127.0.0.1)
- **Port**: 27017
- **Database**: urbanml
- **Connection String**: `mongodb://127.0.0.1:27017/urbanml`

---

## Need Help?

- MongoDB Documentation: https://docs.mongodb.com/manual/installation/
- MongoDB Community Forums: https://www.mongodb.com/community/forums/
- MongoDB University (Free Courses): https://university.mongodb.com/
