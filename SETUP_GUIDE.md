# 🚀 Buildwise Setup Guide - Complete Instructions

## Prerequisites (Install These First!)

### 1. **Install Node.js** 
- Go to: https://nodejs.org/
- Download the **LTS version** (recommended for most users)
- Run the installer and follow default settings
- **Verify installation**: Open terminal/command prompt and type:
  ```bash
  node --version
  npm --version
  ```
  You should see version numbers like `v18.17.0` and `9.6.7`

### 2. **Install Git**
- Go to: https://git-scm.com/downloads
- Download for your operating system
- Run installer with default settings
- **Verify installation**:
  ```bash
  git --version
  ```

### 3. **Install VS Code (Optional but Recommended)**
- Go to: https://code.visualstudio.com/
- Download and install
- Great for viewing and editing the code

---

## 📂 Getting the Code

### Step 1: Clone the Repository
```bash
# Open terminal/command prompt and run:
git clone https://github.com/anas-muhmed/buildwise.git

# Navigate to the project folder:
cd buildwise
```

### Step 2: Install Dependencies
```bash
# This installs all required packages (takes 2-3 minutes):
npm install
```

### Step 3: Start the Development Server
```bash
# This starts the app (takes 30 seconds):
npm run dev
```

### Step 4: Open in Browser
- Open your browser
- Go to: **http://localhost:3000**
- You should see the Buildwise homepage! 🎉

---

## 🌐 Demo Pages to Show

### Main Features:
1. **Homepage**: `http://localhost:3000`
2. **Login Page**: `http://localhost:3000/login`
3. **Register Page**: `http://localhost:3000/register`  
4. **AI Generator**: `http://localhost:3000/generative-ai` ⭐ **Main Feature!**

---

## 🛠️ Troubleshooting Common Issues

### Issue 1: "command not found" or "'npm' is not recognized"
**Solution**: Node.js not installed properly
- Restart terminal/command prompt
- Re-install Node.js from https://nodejs.org/
- Make sure to check "Add to PATH" during installation

### Issue 2: "EACCES" or permission errors
**Solution**: 
```bash
# On Windows (run as administrator):
npm install --force

# On Mac/Linux:
sudo npm install
```

### Issue 3: Port 3000 already in use
**Solution**:
```bash
# Kill the process using port 3000:
# Windows:
npx kill-port 3000

# Or use a different port:
npm run dev -- --port 3001
# Then visit: http://localhost:3001
```

### Issue 4: "Cannot find module" errors
**Solution**:
```bash
# Delete node_modules and reinstall:
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: Internet/Firewall Issues
**Solution**:
- Make sure internet connection is stable
- Try using mobile hotspot if college WiFi blocks downloads
- Use `npm install --registry https://registry.npmjs.org/`

---

## 💡 Quick Demo Script for Presentation

### 1. **Show Homepage** (30 seconds)
- Point out the clean design
- Show navigation with login/register buttons
- Click "AI Architecture Designer" card

### 2. **Demo Registration** (1 minute)
- Go to register page
- Show form validation
- Demonstrate password strength indicator
- Show real-time validation

### 3. **Demo Login** (30 seconds)
- Go to login page
- Show clean form design
- Demo the "remember me" and social options

### 4. **Main AI Feature** (3-4 minutes)
- Navigate to `/generative-ai`
- Try sample prompts:
  - "Food delivery app like Swiggy"
  - "Video streaming platform like Netflix"
  - "Chat app with real-time messages"
- Show the arrows and connections
- Highlight the professional explanations
- Demo export functionality

---

## 📱 If All Else Fails - Backup Plan

### Option 1: Use GitHub Codespaces
- Go to: https://github.com/anas-muhmed/buildwise
- Click green "Code" button → "Codespaces" → "Create codespace"
- Wait 2-3 minutes for setup
- Run `npm run dev` in the terminal
- Click "Open in Browser" when prompted

### Option 2: Use Online Demo
- Deploy to Vercel/Netlify (if needed)
- Share live link for demonstration

### Option 3: Screen Recording
- Record the demo on your working laptop
- Show the recording if live demo fails

---

## 🎯 Key Points to Emphasize

1. **Professional UI/UX**: Mention the gradient backgrounds, animations
2. **Real Architecture Patterns**: Highlight the technical explanations
3. **Educational Value**: Show how it teaches system design
4. **Modern Tech Stack**: React, Next.js, TypeScript, Tailwind CSS
5. **Export Functionality**: Demonstrate the JSON export feature

---

## 📞 Emergency Contacts

If you face issues during setup:
1. **Check the terminal output** for specific error messages
2. **Google the exact error message** - usually has quick solutions
3. **Restart everything**: Close terminal, reopen, try again
4. **Use mobile hotspot** if college WiFi is blocking downloads

---

## ✅ Final Checklist

Before presentation:
- [ ] Node.js installed and working (`node --version`)
- [ ] Git installed and working (`git --version`)
- [ ] Code cloned successfully (`cd buildwise`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] App running (`npm run dev` shows "ready" message)
- [ ] Browser opens to localhost:3000
- [ ] All demo pages working (login, register, AI generator)
- [ ] Sample prompts generate architectures
- [ ] Export functionality works

**You're ready to impress! 🚀✨**

---

*Made with ❤️ for tomorrow's presentation success!*