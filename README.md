# 💔 INSTADRAMA 💔

**INSTADRAMA** is a playful web tool that helps you discover who unfollowed you (and who followed you) on Instagram — without the need for tears... unless you want them.  
It works entirely client-side, meaning your data stays private and never leaves your browser.

---

## ✨ Features

- 📂 Upload your **old followers list** (`.json` exported from Instagram).  
- 🆕 Upload your **current followers list** (`.json` from Instagram).  
- 🕊️ Optionally, upload your **following list** (`.json`) to see **who doesn’t follow you back**.  
- 💖 Shows:
  - **Lost followers** (people who unfollowed you).
  - **New followers** (people who recently followed you).
  - **Not following back** (optional).  
- 🔍 Search bar for filtering usernames.  
- 📥 Download results as **.txt** or **.csv**.  
- 🎨 Light/Dark theme toggle with local storage preferences.  
- 💾 Auto-saves your previous list for the next comparison.  
- 🖼️ Displays profile pictures (with a cute fallback avatar).  
- ⚡ Drag & drop support for file uploads.  

---

## 🛠️ Installation & Usage

1. **Export your Instagram data**:  
   - Go to *Instagram > Settings > Privacy and Security > Download Your Information*.  
   - Request a download in **JSON** format.  
   - Extract the ZIP and locate:
     - `followers.json` (your followers list).  
     - `following.json` (optional, for accounts you follow).  

2. **Run INSTADRAMA**:  
   - Clone or download this repository.  
   - Open `index.html` in your browser.  
   - No server required — everything runs locally.

3. **Compare lists**:  
   - Select your old and new followers `.json` files.  
   - Click **Compare and suffer 💔**.  
   - Optionally upload your `following.json` to see who doesn’t follow you back.  

---

## 📂 Project Structure

```
.
├── index.html    # Main interface
├── style.css     # Styling (light/dark themes, coquette vibes ✨)
└── script.js     # Core logic: parsing, comparing, rendering
```

---

## 🔒 Privacy

- All comparisons happen **locally in your browser**.  
- No data is uploaded, stored, or shared externally.  
- Previous followers list is saved in **LocalStorage** only to make comparisons easier.  


---

## 💡 Notes

- Make sure you upload the **original Instagram JSON files** (not edited).  
- If you provide a ZIP instead of JSON, INSTADRAMA can extract it automatically.  
- Results are decorative and sassy — take them with humor.  

---

## 🖤 Credits

Built with plain **HTML, CSS, and JavaScript**.  
Extra sparkle provided by emojis ✨ and drama 💔.  

---