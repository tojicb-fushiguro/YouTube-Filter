# 🎬 YouTube Advanced Keyword Filter

A powerful browser extension that filters YouTube videos by keywords with allowlist/blocklist support. Compatible with **Chrome** and **Firefox**.

## ✨ Features

- **Allowlist Mode**: Only show videos matching specific keywords
- **Blocklist Mode**: Hide videos matching specific keywords
- **Multi-location Filtering**: Works on:
  - YouTube homepage
  - Search results
  - Sidebar/related videos
  - Shorts feed
- **Regex Support**: Advanced pattern matching (optional)
- **Word Boundary Matching**: Match whole words only (e.g., "game" won't match "gameplay")
- **Soft Hide Option**: Blur filtered videos instead of hiding them completely
- **Real-time Filtering**: Automatically filters as you browse
- **Persistent Settings**: Your filters are saved across sessions
- **Cross-Browser Support**: Works on both Chrome and Firefox
- **Performance Optimized**: Fast filtering with keyword caching and pre-compiled regex

## 📥 Installation

### Chrome/Chromium

#### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension folder

### Firefox

#### From Source (Temporary Installation)

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from the extension folder
5. Note: Temporary add-ons are removed when Firefox restarts

#### From Firefox Add-ons (Coming Soon)

The extension will be published to Firefox Add-ons (AMO) soon. Once published, you'll be able to install it directly from:
- Firefox Add-ons: [Link will be added after publication]

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

### Example 5: Using Word Boundary Matching
```
Enable "Match Whole Words Only" checkbox
Allowlist: (leave empty)
Blocklist: game
Result: Blocks "game" but NOT "gameplay", "gamer", or "gaming"
```

### Example 6: Using Soft Hide
```
Enable "Soft Hide (Blur instead of hide)" checkbox
Result: Filtered videos appear blurred and faded instead of being completely hidden
Useful for: Still seeing what's being filtered while keeping unwanted content less prominent
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

## 🔒 Trust & Security

### Permissions (why they’re needed)
This extension requests only:
- **`storage`** — to save your allowlist/blocklist settings.
- **`https://www.youtube.com/*`** — to run the filter on YouTube pages and hide/show videos in the UI.

It does **not** request “all websites” access, cookies, downloads, or other sensitive permissions.

### Data handling
- Filtering runs **locally in your browser** by reading video titles from the YouTube page and hiding/showing items.
- The extension **does not collect analytics/telemetry** and **does not send your data anywhere**.
- Your settings are saved using Chrome extension storage (sync storage, so settings may sync across your devices if Chrome Sync is enabled).

### Verify the source yourself (quick checks)
If you want to verify what the extension does:
1. Open `manifest.json` and confirm permissions are only `storage` + `https://www.youtube.com/*`.
2. Search the source for network/exfil keywords:
   - `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`

### Verify downloads with checksums (optional)
If you download a build from anywhere (Telegram/Discord/etc.), compare its SHA-256 hash with the official `CHECKSUMS.txt` attached to the GitHub Release.

**Windows (PowerShell):**
```powershell
Get-FileHash .\YouTube-Filter.zip -Algorithm SHA256
```
## 🛠️ Technical Details

- **Manifest Version**: 3
- **Browser Support**: Chrome, Firefox (109+)
- **Permissions**: `storage`
- **Host Permissions**: `https://www.youtube.com/*`
- **Content Script**: Runs on all YouTube pages
- **Storage**: Browser Sync Storage (settings sync across devices)
- **Cross-Browser Compatibility**: Uses WebExtension Polyfill pattern
- **Performance Optimizations**:
  - Keyword parsing cached (parsed once, not on every video)
  - Regex patterns pre-compiled (3-5x faster filtering)
  - Title normalization optimized (single lowercase operation)
  - MutationObserver scoped to YouTube containers
  - Disconnect/reconnect pattern during batch filtering

### Files Structure
```
YouTube-Filter/
├── manifest.json          # Extension configuration
├── browser-polyfill.js    # Cross-browser compatibility layer
├── content.js             # Main filtering logic
├── popup.html             # Extension popup UI
├── popup.js               # Popup interaction logic
└── popup.css              # Popup styling
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

---

## ❓ Frequently Asked Questions

### Can I use regex patterns?
Yes! Enable the "Use Regular Expressions" checkbox in the extension popup. Then you can use patterns like:
- `^Video:` - Matches titles starting with "Video:"
- `(ads|sponsored)` - Matches either "ads" or "sponsored"
- `\d{4}` - Matches 4-digit numbers

### Does this work on YouTube Music or YouTube TV?
Currently, the extension only works on `youtube.com`. Support for YouTube Music and YouTube TV may be added in future versions.

### Can I filter by channel name?
Yes! Just add the channel name to your blocklist. For example, add `CNN, BBC, Fox News` to block videos from those channels.

### Does this affect video recommendations?
No. This extension only hides videos visually on your browser. It doesn't affect YouTube's recommendation algorithm or your watch history.

### Can I export/import my filter lists?
Currently, filter lists are stored in Chrome Sync Storage. They will sync across devices where you're logged into the same Chrome profile. Export/import feature may be added in the future.

### Does this work with YouTube Shorts?
Yes! The extension filters Shorts in feeds and search results. However, it cannot filter the autoplay feed when you're actively watching Shorts (inside the `/shorts/` player).

### How many keywords can I add?
There's no hard limit! However, for best performance, we recommend keeping your total keywords under 100. The extension processes each keyword on every video title.

### Does this slow down YouTube?
No. The extension is highly optimized and runs efficiently in the background. Version 1.3 includes major performance improvements:
- Keywords are parsed once and cached (not re-parsed for every video)
- Regex patterns are pre-compiled for 3-5x faster matching
- MutationObserver is scoped to specific YouTube containers
- Filtering uses optimized title normalization

The extension only processes visible videos and uses debouncing to minimize performance impact.

---

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

### Version 1.3
- ✅ **Performance Optimizations**:
  - Keywords parsed once and cached (not re-parsed for every video)
  - Regex patterns pre-compiled for 3-5x faster matching
  - Title normalization optimized (single lowercase operation)
  - MutationObserver scoped to YouTube containers
  - Disconnect/reconnect pattern during batch filtering
- ✅ **New Features**:
  - Word Boundary Matching: Match whole words only (e.g., "game" won't match "gameplay")
  - Soft Hide Option: Blur filtered videos instead of hiding completely
- ✅ **Bug Fixes**:
  - Fixed "settings is undefined" error in content script
  - Improved settings initialization

### Version 1.2
- ✅ Main feed filtering (homepage, search)
- ✅ Sidebar/related videos filtering
- ✅ YouTube Shorts filtering (in feeds)
- ✅ Allowlist/Blocklist support
- ✅ Regex support (optional)
- ✅ Persistent settings with Chrome Sync
- ✅ Dark theme UI
