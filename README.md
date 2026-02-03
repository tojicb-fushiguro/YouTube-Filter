# 🎬 YouTube Advanced Keyword Filter

A powerful Chrome extension that filters YouTube videos by keywords with allowlist/blocklist support.

## ✨ Features

- **Allowlist Mode**: Only show videos matching specific keywords
- **Blocklist Mode**: Hide videos matching specific keywords
- **Multi-location Filtering**: Works on:
  - YouTube homepage
  - Search results
  - Sidebar/related videos
  - Shorts feed
- **Regex Support**: Advanced pattern matching (optional)
- **Real-time Filtering**: Automatically filters as you browse
- **Persistent Settings**: Your filters are saved across sessions

## 📥 Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension folder

## 🎯 How to Use

### Understanding Allowlist vs Blocklist

**Allowlist (Show ONLY these):**
- Add keywords to **ONLY** show videos matching those terms
- Everything else gets hidden
- Leave **EMPTY** to see all videos (recommended for most users)

**Blocklist (Hide these):**
- Videos matching these keywords will be hidden
- Everything else shows normally
- Use this to filter out unwanted content

### Important: Keyword Matching

The extension does **exact substring matching** in video titles.

❌ **Won't work:**
- Blocklist: `reaction` → Won't block "User **reacts** to video"
- Blocklist: `politics` → Won't block "**Trump** speech"

✅ **Will work:**
- Blocklist: `react, reacts, reaction, reacting`
- Blocklist: `trump, biden, politics, political, election`

**Pro tip:** Add multiple variations of words you want to filter!

## 📖 Usage Examples

### Example 1: Block Political & Reaction Content
```
Allowlist: (leave empty)
Blocklist: react, reacts, reaction, trump, biden, politics, political, msnbc, cnn, fox, news
```

### Example 2: ONLY Show Gaming Content
```
Allowlist: gaming, gameplay, game, walkthrough, playthrough, minecraft, fortnite
Blocklist: (optional)
```

### Example 3: ONLY Show Educational Content, No Politics
```
Allowlist: tutorial, education, learn, course, documentary, science, technology
Blocklist: trump, biden, politics, election, news
```

### Example 4: Block Specific Content Types
```
Allowlist: (leave empty)
Blocklist: vlog, podcast, asmr, mukbang, shorts, compilation, funny, prank
```

## 🔍 Debugging

To see what the extension is doing:

1. Open any YouTube page
2. Press **F12** to open Developer Console
3. Look for messages starting with `[YouTube Filter]`:
   - `🚫 Hiding: "video title"` - Video was filtered out
   - `✅ Showing: "video title"` - Video passed filters
   - `📊 Main feed: 5/20 hidden` - Summary of filtering

## ⚠️ Known Limitations

1. **YouTube Shorts Player**: Cannot filter the autoplay feed when watching `/shorts/` URLs
   - Shorts are filtered in search results and feeds
   - Once you click and enter the Shorts player, autoplay cannot be filtered  
   
2. **Title-only Matching**: Only filters based on video titles, not descriptions
   - This is intentional for performance reasons
   
3. **Exact Matching**: Uses substring matching, not fuzzy matching
   - You must include all variations (e.g., `react, reacts, reaction`)

## 💡 Pro Tips

1. **Start Simple**: Begin with 3-5 keywords and adjust based on results

2. **Think About Actual Titles**: 
   - Look at videos you want to hide
   - Find the exact words used in titles
   - Add those specific words

3. **Use Common Variations**:
   - `react, reacts, reaction, reacting, reactor`
   - `review, reviews, reviewing, reviewer`
   - `tutorial, guide, how to, walkthrough`

4. **Channel-specific Keywords**:
   - Block specific creators: `mrbeast, pewdiepie, mkbhd`
   - Block news outlets: `msnbc, cnn, fox, bbc`

5. **No Keyword Limit**: Add as many as you need - there's no maximum!

## 🛠️ Technical Details

- **Manifest Version**: 3
- **Permissions**: `storage`
- **Host Permissions**: `https://www.youtube.com/*`
- **Content Script**: Runs on all YouTube pages
- **Storage**: Chrome Sync Storage (settings sync across devices)

### Files Structure
```
YouTube-Filter/
├── manifest.json       # Extension configuration
├── content.js          # Main filtering logic
├── popup.html          # Extension popup UI
├── popup.js            # Popup interaction logic
└── popup.css           # Popup styling
```

## 🐛 Troubleshooting

### "Too few videos showing"
- Check if you have keywords in **Allowlist**
- Allowlist = "ONLY show these" (very restrictive)
- Solution: Clear allowlist, use only blocklist

### "My keywords aren't blocking videos"
- Check if the exact word appears in video titles
- Use multiple variations: `react, reacts, reaction`
- Press F12 to see console logs

### "Extension not working"
- Refresh the YouTube page
- Check if extension is enabled in popup
- Check browser console (F12) for errors

## 📜 License

MIT License - See LICENSE file for details

## 👤 Author

**tojicb-fushiguro**
- GitHub: [@tojicb-fushiguro](https://github.com/tojicb-fushiguro)
- Repository: [YouTube-Filter](https://github.com/tojicb-fushiguro/YouTube-Filter)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

## 📝 Changelog

### Version 1.2
- ✅ Main feed filtering (homepage, search)
- ✅ Sidebar/related videos filtering
- ✅ YouTube Shorts filtering (in feeds)
- ✅ Allowlist/Blocklist support
- ✅ Regex support (optional)
- ✅ Persistent settings with Chrome Sync
- ✅ Dark theme UI
