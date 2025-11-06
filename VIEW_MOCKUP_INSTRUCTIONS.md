# 🎯 How to View the Interactive Mockup

## Problem: File Opens in Text Editor Instead of Browser

If double-clicking `APP_MOCKUP.html` shows code instead of the webpage, use one of these methods:

---

## ✅ EASIEST SOLUTION: Use the Helper Scripts

### Option 1: Run the script (Mac/Linux)
```bash
./OPEN_MOCKUP.sh
```

### Option 2: Run the batch file (Windows)
```
OPEN_MOCKUP.bat
```

These scripts will automatically open the mockup in your browser!

---

## 🌐 BEST METHOD: Right-Click and "Open With"

### On Windows:
1. Navigate to `PhysioAssist/docs/` folder
2. **Right-click** on `APP_MOCKUP.html`
3. Select **"Open with"**
4. Choose:
   - Chrome
   - Firefox
   - Edge
   - Safari
5. Check "Always use this app" (optional)

### On Mac:
1. Navigate to `PhysioAssist/docs/` folder
2. **Right-click** (or Control+click) on `APP_MOCKUP.html`
3. Select **"Open With"**
4. Choose:
   - Chrome
   - Firefox
   - Safari
5. Hold **Option** key and click browser to make it default (optional)

### On Linux:
1. Navigate to `PhysioAssist/docs/` folder
2. **Right-click** on `APP_MOCKUP.html`
3. Select **"Open With"**
4. Choose:
   - Chrome
   - Firefox
   - Other browser

---

## 🖥️ METHOD 2: Drag and Drop

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Open File Explorer/Finder
3. Navigate to `PhysioAssist/docs/APP_MOCKUP.html`
4. **Drag the file** into the browser window
5. Drop it - the mockup will load!

---

## 💻 METHOD 3: From Browser Menu

### Chrome/Firefox/Safari/Edge:
1. Open your browser
2. Press `Ctrl+O` (Windows/Linux) or `Cmd+O` (Mac)
3. Navigate to: `PhysioAssist/docs/APP_MOCKUP.html`
4. Click "Open"

---

## 🌍 METHOD 4: Local Web Server (Most Reliable)

This method always works and is how websites are normally served:

### Using Python (if installed):
```bash
cd PhysioAssist
python3 -m http.server 8080
```

Then open browser and go to:
```
http://localhost:8080/docs/APP_MOCKUP.html
```

Press `Ctrl+C` to stop server when done.

### Using Node.js (if installed):
```bash
cd PhysioAssist
npx http-server -p 8080
```

Then open browser and go to:
```
http://localhost:8080/docs/APP_MOCKUP.html
```

---

## 🔧 METHOD 5: Change Default Program

### Windows:
1. Right-click `APP_MOCKUP.html`
2. Select **"Properties"**
3. Click **"Change"** next to "Opens with:"
4. Select your browser (Chrome, Firefox, Edge)
5. Click **"OK"**

### Mac:
1. Right-click `APP_MOCKUP.html`
2. Select **"Get Info"**
3. Expand **"Open with:"**
4. Select your browser
5. Click **"Change All..."** (to apply to all HTML files)

### Linux:
1. Right-click `APP_MOCKUP.html`
2. Select **"Properties"**
3. Go to **"Open With"** tab
4. Select your browser
5. Click **"Set as default"**

---

## 📱 What You Should See

Once opened correctly, you'll see:

- **Purple gradient background**
- **"PhysioAssist V2" title** at top
- **8 navigation buttons**: Login, Onboarding, Setup, Simple Mode, Advanced, Exercises, Profile, Settings
- **iPhone-style frame** in center
- **Login screen** displayed by default

### If you see HTML code instead:
❌ You're in a text editor, not a browser!
✅ Use one of the methods above to open in a browser

---

## 🎨 Interactive Features

Once opened correctly, try:
- Click navigation buttons to switch screens
- Click "Start Exercise" button (changes to "Stop")
- Toggle switches in Settings screen
- Watch animated progress bar in Simple Mode

---

## ❓ Still Having Issues?

### Check:
1. ✅ File name ends with `.html` (not `.html.txt`)
2. ✅ Opening in a **browser** (Chrome, Firefox, Safari, Edge)
3. ✅ JavaScript is enabled in browser settings
4. ✅ File size is ~32KB (not 0 bytes)

### Try:
1. Use the **drag and drop** method - works 99% of the time
2. Use the **local web server** method - most reliable
3. Try a **different browser**

---

## 🚀 Quick Commands Cheat Sheet

```bash
# Method 1: Run helper script (Mac/Linux)
./OPEN_MOCKUP.sh

# Method 2: Start local server
python3 -m http.server 8080
# Then visit: http://localhost:8080/docs/APP_MOCKUP.html

# Method 3: Open specific browser (Mac)
open -a "Google Chrome" docs/APP_MOCKUP.html
open -a "Firefox" docs/APP_MOCKUP.html
open -a "Safari" docs/APP_MOCKUP.html

# Method 4: Open specific browser (Linux)
google-chrome docs/APP_MOCKUP.html
firefox docs/APP_MOCKUP.html

# Method 5: Open specific browser (Windows)
start chrome docs\APP_MOCKUP.html
start firefox docs\APP_MOCKUP.html
start msedge docs\APP_MOCKUP.html
```

---

**The mockup MUST open in a web browser to work!** 🌐
