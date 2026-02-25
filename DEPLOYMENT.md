# Chatty Carl Chess - Deployment Guide

A comprehensive guide to deploying the Chatty Carl Chess application on an Ubuntu server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Clone and Configure](#clone-and-configure)
4. [Environment Variables](#environment-variables)
5. [Install Dependencies](#install-dependencies)
6. [Install Stockfish](#install-stockfish)
7. [Start the Application](#start-the-application)
8. [Configure PM2 for Production](#configure-pm2-for-production)
9. [Oracle Cloud Configuration](#oracle-cloud-configuration)
10. [Access the Application](#access-the-application)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Ubuntu 24.04 LTS (or similar Linux distribution)
- Node.js 18.x or higher
- sudo/root access
- Git
- GitHub account with repository access

---

## Initial Server Setup

### 1. Update System Packages

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### 2. Install Node.js 18.x

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version    # Should show v18.x
npm --version
```

### 3. Install Git

```bash
sudo apt-get install -y git
git --version
```

### 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 --version
```

---

## Clone and Configure

### 1. Navigate to Home Directory

```bash
cd ~
```

### 2. Clone the Repository

```bash
# Replace with your actual repository URL
git clone https://github.com/sy-cmd/chatty-carl-chess-.git chess-app
cd chess-app
```

### 3. Checkout the Desired Branch

```bash
# For all features (recommended)
git checkout features

# Or use main branch
git checkout main

# Pull latest changes
git pull origin
```

---

## Environment Variables

### 1. Create .env File

```bash
cd ~/chatty-carl-chess
nano .env
```

### 2. Add the Following Content

```
# Required: Get your API key from https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# Port for the application (default: 5000)
PORT=5000
```

### 3. Save and Exit

Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

---

## Install Dependencies

```bash
cd ~/chatty-carl-chess
npm install
```

This will install all required packages including:
- express
- chess.js
- dotenv
- groq-sdk
- sql.js

---

## Install Stockfish

Stockfish is the chess engine used by the AI.

```bash
sudo apt-get install -y stockfish

# Verify installation
stockfish --version
```

---

## Start the Application

### 1. Test Locally First

```bash
cd ~/chatty-carl-chess
node server.js
```

If successful, you'll see:
```
Chess server running on http://localhost:5000
Stockfish: Enabled (Skill Level 10)
Database initialized successfully
```

Press `Ctrl+C` to stop.

### 2. Start with PM2 (Production)

```bash
cd ~/chatty-carl-chess
pm2 start server.js --name chess-app
```

### 3. Check Status

```bash
pm2 status
```

Expected output:
```
┌────┬─────────────┬──────────┬──────┬───────┬─────────┬──────┐
│ id │ name       │ mode    │ pid  │ status│ cpu    │ mem  │
├────┼─────────────┼──────────┼──────┼───────┼─────────┼──────┤
│ 0  │ chess-app  │ fork    │ xxxx │ online│ 0%     │ xx%  │
└────┴─────────────┴──────────┴──────┴───────┴─────────┴──────┘
```

---

## Configure PM2 for Production

### 1. Auto-restart on Boot

```bash
# Generate startup script
pm2 startup

# Follow the instructions provided (copy and run the sudo command)

# Save PM2 process list
pm2 save
```

### 2. Useful PM2 Commands

```bash
# View logs
pm2 logs chess-app

# View logs (last 50 lines)
pm2 logs chess-app --lines 50

# Restart application
pm2 restart chess-app

# Stop application
pm2 stop chess-app

# Delete application
pm2 delete chess-app

# Monitor resources
pm2 monit
```

---

## Oracle Cloud Configuration

### 1. Open Port 5000

Go to **Oracle Cloud Console** and follow these steps:

1. Navigate to: **Networking → Virtual Cloud Networks**
2. Select your VCN (e.g., `devops-vcn`)
3. Click **Security Lists**
4. Click **Default Security List**
5. Click **Add Ingress Rules**
6. Configure:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `5000`
   - **Description**: `Chess app`
7. Click Save

### 2. Wait for Propagation

Oracle Cloud security rules can take **2-5 minutes** to propagate. Wait before testing.

---

## Access the Application

After all configuration is complete:

```
http://YOUR_SERVER_IP:5000
```

Example: `http://92.4.143.222:5000`

---

## Troubleshooting

### Issue 1: App Won't Start - Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Kill all node processes
pkill -9 node

# Or find and kill specific process
sudo ss -tulpn | grep 5000
kill -9 <PID>

# Clean PM2 and restart
pm2 delete all
pm2 start server.js --name chess-app
pm2 status
```

### Issue 2: Can't Connect from External IP

**Symptoms:**
- `curl localhost:5000` works
- `curl http://YOUR_IP:5000` fails

**Possible Causes:**

1. **Oracle Cloud security rule not applied**
   - Verify the security rule is in the correct VCN
   - Wait 2-5 minutes for propagation

2. **UFW blocking port**
   ```bash
   sudo ufw status
   sudo ufw allow 5000/tcp
   ```

3. **Instance not in correct subnet**
   - Verify instance is in the VCN with the security rule

### Issue 3: Stockfish Not Working

**Error in logs:**
```
Failed to initialize Stockfish
```

**Solution:**
```bash
# Reinstall Stockfish
sudo apt-get update
sudo apt-get install --reinstall stockfish

# Verify
which stockfish
stockfish --version
```

### Issue 4: Database Not Initializing

**Error:**
```
Failed to initialize database
```

**Solution:**
```bash
# Check if sql.js is installed
npm list sql.js

# Reinstall if missing
npm install sql.js
```

### Issue 5: PM2 Keeps Restarting App

**Symptoms:**
- App shows "restarting" repeatedly
- Status shows high restart count

**Solution:**
```bash
# Check error logs
pm2 logs chess-app --err --lines 30

# Common fixes:
# 1. Kill all processes and start fresh
pm2 kill
pkill -9 node
pm2 start server.js --name chess-app

# 2. Verify .env file exists
cat ~/chatty-carl-chess/.env
```

### Issue 6: Voice/Audio Not Working

The voice features use the browser's Web Speech API. They work in:
- Chrome (desktop)
- Edge (desktop)
- Safari (limited)

Firefox has limited/no support for speech synthesis.

### Issue 7: Slow Performance

**Solutions:**
1. Increase PM2 memory limit:
   ```bash
   pm2 start server.js --name chess-app --max-memory-restart 500M
   ```

2. Use Nginx as reverse proxy for caching

---

## Quick Reference Commands

```bash
# Start the app
pm2 start server.js --name chess-app

# Check status
pm2 status

# View logs
pm2 logs chess-app --lines 50

# Restart
pm2 restart chess-app

# Stop
pm2 stop chess-app

# Delete
pm2 delete chess-app

# View all processes
pm2 list

# Monitor in real-time
pm2 monit
```

---

## Additional Resources

- **Groq API Keys**: https://console.groq.com/keys
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Node.js Documentation**: https://nodejs.org/docs/

---

## Support

If you encounter issues not covered here:

1. Check PM2 logs: `pm2 logs chess-app --lines 100`
2. Verify all dependencies: `npm list`
3. Test locally first: `node server.js`
4. Check firewall: `sudo ufw status`

---

**Last Updated:** February 2026
**Version:** 1.0.0
