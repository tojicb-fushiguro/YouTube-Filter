# 🎬 YouTube Advanced Keyword Filter

A powerful Chrome extension that filters YouTube videos by keywords with allowlist/blocklist support.

---

## 🎯 **Why This Extension Exists**

YouTube's algorithm shows you **mixed content** - tutorials, drama, gaming, politics, vlogs all jumbled together. This extension lets you **take control** of what you see without unsubscribing from channels or clearing your history.

**The Problem:**
- You watch coding tutorials, but YouTube shows you gaming videos
- You want educational content, but you get entertainment mixed in
- You hate political content, but it keeps appearing
- Shorts and compilations clutter your feed
- You can't focus on specific topics

**The Solution:**
This extension acts as a **visual filter** - it hides unwanted videos from your feed and shows only what matches your preferences.

---

## 💡 **Real-World Use Cases**

### 1. **Focus Mode (Students/Professionals)**
**Goal:** Only see educational content while working

**Settings:**
- **Allowlist:** `tutorial, course, lecture, guide, education, learning`
- **Blocklist:** `vlog, gaming, entertainment, drama`

**Result:** YouTube becomes a focused learning platform

---

### 2. **Politics-Free Zone**
**Goal:** Avoid political content while browsing

**Settings:**
- **Allowlist:** *(leave empty)*
- **Blocklist:** `trump, biden, politics, election, news, cnn, msnbc, fox`

**Result:** Clean feed with no political content

---

### 3. **Gaming Only**
**Goal:** Only see gaming videos

**Settings:**
- **Allowlist:** `gaming, gameplay, walkthrough, playthrough, let's play`
- **Blocklist:** *(optional)*

**Result:** Pure gaming content feed

---

### 4. **No Shorts, No Compilations**
**Goal:** Hide short-form content

**Settings:**
- **Allowlist:** *(leave empty)*
- **Blocklist:** `shorts, compilation, tiktok, meme, funny moments`

**Result:** Only long-form videos

---

### 5. **Channel-Specific Blocking**
**Goal:** Block specific creators without unsubscribing

**Settings:**
- **Blocklist:** `mrbeast, pewdiepie, mkbhd` *(example names)*

**Result:** Videos from these channels are hidden

---

## ⚠️ **Important: What This Extension Does & Doesn't Do**

### ✅ **What It Does**
- **Filters videos already visible** on your page (homepage, search, sidebar)
- **Hides videos** based on title keywords using exact substring matching
- **Works client-side** - runs in your browser, no server communication
- **Supports regex** - advanced pattern matching for power users
- **Persists settings** - your filters sync across devices via Chrome

### ❌ **What It DOESN'T Do**
- **Does NOT change** YouTube's recommendation algorithm
- **Does NOT request** different videos from YouTube servers
- **Does NOT affect** what videos YouTube loads or suggests
- **Does NOT modify** your watch history or subscriptions
- **Cannot show** videos that YouTube didn't already load

**Think of it like a coffee filter ☕** - it removes unwanted elements from what's already there, but it can't brew new coffee or change what YouTube serves you!

---

## 🚀 **Getting Started: First-Time Setup**

If you're new to YouTube filtering, follow these steps for best results:

### **Step 1: Train YouTube First (Do This Before Using the Extension!)**

The extension can only filter what YouTube shows you. Make sure YouTube is showing the content you want:

1. **Search** for topics you're interested in (e.g., "Python tutorials")
2. **Watch** 5-10 videos completely (don't skip through them)
3. **Like** and **comment** on videos you enjoy
4. **Subscribe** to relevant channels
5. **Use YouTube's "Not Interested"** feature on unwanted videos
6. **Wait 1-3 days** for YouTube to adjust its recommendations

**Why this matters:** If YouTube only shows you gaming videos, filtering for "tutorials" will leave you with an empty feed!

---

### **Step 2: Start with Blocklist (Recommended for Beginners)**

Don't jump to Allowlist immediately - it's very restrictive!

1. Open the extension popup (click the extension icon)
2. **Enable** the "Enable Filter" checkbox
3. Leave **Allowlist** empty for now
4. Add keywords to **Blocklist** for content you DON'T want:
   - Example: `vlog, react, reaction, drama, gossip, shorts`
5. Click **Save Settings**
6. Refresh YouTube

**Result:** Unwanted content disappears, everything else stays visible

---

### **Step 3: Advanced Filtering with Allowlist (Optional)**

Once comfortable, try Allowlist for laser-focused browsing:

1. Add keywords you WANT to see:
   - Example: `python, javascript, coding, tutorial, programming`
2. **⚠️ Warning:** This will hide EVERYTHING that doesn't match!
3. Only use this when you want extreme focus

**Pro Tip:** Combine both for best results:
- **Allowlist:** `tutorial, course, education`
- **Blocklist:** `politics, drama, vlog`

---

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

### Example 1: Complete Beginner Setup

**Day 1-3: Train YouTube**
1. Search "Python programming tutorials"
2. Watch 10 videos completely
3. Subscribe to 3-5 tutorial channels
4. Like and comment on helpful videos

**Day 4: Set Up Extension**
- Blocklist: `gaming, vlog, entertainment, music`
- Allowlist: *(leave empty)*

**Result:** Your feed now focuses on tutorials with noise removed

---

### Example 2: Block Political & Reaction Content
```
Allowlist: (leave empty)
Blocklist: react, reacts, reaction, trump, biden, politics, political, msnbc, cnn, fox, news
```

---

### Example 3: ONLY Show Gaming Content
```
Allowlist: gaming, gameplay, game, walkthrough, playthrough, minecraft, fortnite
Blocklist: (optional - add specific games you don't like)
```

---

### Example 4: ONLY Show Educational Content, No Politics
```
Allowlist: tutorial, education, learn, course, documentary, science, technology
Blocklist: trump, biden, politics, election, news
```

---

### Example 5: Block Specific Content Types
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

## 🔒 Trust & Security

### Permissions (why they’re needed)
This extension requests only:
- **`storage`** — to save your allowlist/blocklist settings.
- **`https://www.youtube.com/*`** — to run the filter on YouTube pages and hide/show videos in the UI. :contentReference[oaicite:1]{index=1}

It does **not** request “all websites” access, cookies, downloads, or other sensitive permissions. :contentReference[oaicite:2]{index=2}

### Data handling
- Filtering runs **locally in your browser** by reading video titles from the YouTube page and hiding/showing items. :contentReference[oaicite:3]{index=3}
- The extension **does not collect analytics/telemetry** and **does not send your data anywhere**.
- Your settings are saved using Chrome extension storage (sync storage, so settings may sync across your devices if Chrome Sync is enabled). :contentReference[oaicite:4]{index=4}

### Verify the source yourself (quick checks)
If you want to verify what the extension does:
1. Open `manifest.json` and confirm permissions are only `storage` + `https://www.youtube.com/*`. :contentReference[oaicite:5]{index=5}
2. Search the source for network/exfil keywords:
   - `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`

### Verify downloads with checksums (optional)
If you download a build from anywhere (Telegram/Discord/etc.), compare its SHA-256 hash with the official `CHECKSUMS.txt` attached to the GitHub Release.

**Windows (PowerShell):**
```powershell
Get-FileHash .\YouTube-Filter.zip -Algorithm SHA256
```

---

## 🚫 **Common Mistakes to Avoid**

### Mistake 1: Using Allowlist Without Training YouTube First
**Problem:** You set Allowlist to `course, tutorial` but see an empty feed

**Why:** YouTube isn't showing you those videos yet!

**Fix:** 
- Remove Allowlist keywords
- Use Blocklist instead
- Or spend 3-5 days watching content you want

---

### Mistake 2: Expecting Different Video Recommendations
**Problem:** "I added 'python' but YouTube still recommends gaming"

**Why:** The extension doesn't change what YouTube recommends, it only hides what you don't want

**Fix:** 
- Use YouTube's algorithm training (watch, like, subscribe)
- Use the extension to filter OUT unwanted content
- Be patient - algorithms take time to adjust

---

### Mistake 3: Too Strict Allowlist
**Problem:** Allowlist is `react, tutorial` but you see almost nothing

**Why:** Only videos with BOTH words in the title will show (very restrictive!)

**Fix:** 
- Add more variations: `react, reactjs, react.js, tutorial, guide, course`
- Or use Blocklist instead

---

### Mistake 4: Exact Word Matching Issues
**Problem:** Blocklist has `reaction` but videos titled "I reacted to this" still appear

**Why:** The extension uses exact substring matching - "reaction" ≠ "reacted"

**Fix:** 
- Add all variations: `react, reacts, reaction, reacting, reacted, reactor`
- Or enable "Use Regular Expressions" and use: `react(s|ion|ing|ed|or)?`

---

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

---

## ❓ Frequently Asked Questions

### Why am I not seeing ANY videos after setting filters?

**Most Common Reason:** You're using **Allowlist mode** and YouTube isn't showing videos with those keywords yet.

**How Allowlist works:**
- Only shows videos that match your keywords
- Everything else gets hidden (very restrictive!)
- If YouTube loads 20 videos and none match, you see nothing

**Solution:**
1. **Option A:** Use Blocklist instead (removes unwanted, keeps everything else)
2. **Option B:** Train YouTube by watching your desired content for 3-5 days
3. **Option C:** Add more keyword variations to your Allowlist

**Example of the problem:**
```
Your Allowlist: "python programming"
YouTube shows you: gaming videos, vlogs, music
Result: Empty feed (nothing matches!)
```

---

### I added "course" to filters but still see gaming videos. What's wrong?

You need to understand **Allowlist vs Blocklist**:

**If you want to REMOVE gaming:**
- Use **Blocklist:** `gaming, gameplay, game, let's play, walkthrough`
- This hides gaming content, shows everything else

**If you want ONLY courses:**
- Use **Allowlist:** `course, tutorial, education, lecture`
- This shows ONLY educational content (very restrictive!)
- Everything else disappears

**Best approach for most users:** Use **Blocklist** to remove noise!

---

### Will this extension make YouTube show me different videos?

**No.** This extension is **100% client-side** and does not communicate with YouTube's servers.

**What actually happens:**
1. YouTube loads videos based on your watch history and algorithm
2. Videos appear in your browser
3. The extension scans the titles
4. Matching videos get hidden using CSS (`display: none`)
5. You only see what passes the filter

**To get different videos from YouTube itself:**
- Watch videos on topics you like (trains the algorithm)
- Use YouTube's "Not Interested" feature
- Clear unwanted videos from watch history
- Subscribe to channels you enjoy
- Give it 1-3 days to adjust

**The extension filters your feed, it doesn't generate new content!**

---

### What's the difference between Allowlist and Blocklist?

**Blocklist (Recommended for 90% of users):**
- **Purpose:** Remove unwanted content
- **Behavior:** Hides videos matching keywords, shows everything else
- **Example:** `drama, gossip, vlog, shorts` → Removes these topics
- **Use when:** You want to clean up your feed

**Allowlist (Advanced - Very restrictive!):**
- **Purpose:** Ultra-focused filtering
- **Behavior:** ONLY shows videos matching keywords, hides everything else
- **Example:** `python, javascript, coding` → Only programming videos appear
- **Use when:** You want extreme focus on one topic

**Pro Tip:** Start with Blocklist. Only use Allowlist when you're comfortable with how the extension works!

---

### Why does it say "0/20 hidden" but I have filters set?

This means **none of the 20 videos on screen matched your filter keywords**.

**Possible reasons:**

1. **Your keywords don't appear in any video titles**
   - Check the actual titles of videos you see
   - Maybe your keywords aren't exact matches

2. **YouTube isn't showing that type of content**
   - If you filter for "tutorials" but YouTube shows gaming, nothing happens
   - Train YouTube's algorithm first!

3. **Typo or wrong keywords**
   - Double-check your spelling
   - Remember: case-insensitive but exact substring matching

4. **You're using Allowlist and nothing matches**
   - Very common mistake!
   - Solution: Use Blocklist instead

**Debug tip:** Press F12 in Chrome, go to Console tab, look for `[YouTube Filter]` messages to see what's being filtered!

---

### Can I filter by channel name?

**Yes!** Just add the channel name (or part of it) to your keywords.

**Example:**
```
Blocklist: CNN, BBC, Fox News, MSNBC, New York Times
```

Any video with these words in the title will be hidden. Since many channels include their name in video titles, this effectively blocks them.

**Note:** This isn't perfect - it only works if the channel name appears in the video title.

---

### Does this affect YouTube's algorithm or my recommendations?

**No.** The extension only affects what you **see** in your browser, not what YouTube **knows** about you.

**What YouTube still tracks:**
- Your watch history
- Your likes/dislikes
- Your subscriptions
- Your search history
- Videos you click (even if hidden by extension)

**The extension:**
- Only hides videos visually using CSS
- Doesn't block tracking or analytics
- Doesn't modify network requests
- Is completely transparent to YouTube's servers

**To actually change YouTube's recommendations:** Use YouTube's built-in tools (Not Interested, Don't Recommend Channel, etc.)

---

### Can I use regex patterns instead of simple keywords?

**Yes!** Enable the "Use Regular Expressions" checkbox.

**Examples:**

**Match titles starting with "Tutorial:"**
```
^Tutorial:
```

**Match either "ads" or "sponsored":**
```
(ads|sponsored|ad)
```

**Match 4-digit years:**
```
\d{4}
```

**Match variations of "react":**
```
react(s|ion|ing|ed|or)?
```

**⚠️ Warning:** Invalid regex patterns will be ignored. Check the browser console (F12) for errors.

---

### How many keywords can I add?

**Technically:** No hard limit!

**Practically:** For best performance, keep your total keywords under 100.

**Why:** The extension checks every keyword against every video title. With 1000 keywords and 50 videos, that's 50,000 comparisons!

**Best practice:**
- Start with 10-20 keywords
- Add more as needed
- Use regex for complex patterns instead of many similar keywords

---

### Does this slow down YouTube?

**No!** The extension is highly optimized:

- ✅ Uses **debouncing** - waits 500ms before filtering to avoid excessive checks
- ✅ Uses **Mutation Observers** - only re-filters when content changes
- ✅ Processes only **visible videos** - not the entire page
- ✅ **Caches settings** - doesn't re-read storage on every filter
- ✅ Uses **efficient selectors** - targets specific YouTube elements

**Performance impact:** Negligible on modern computers. You won't notice any slowdown!

---

### Does this work with YouTube Premium?

**Yes!** The extension is completely independent of YouTube Premium.

- Works on free and Premium accounts
- Doesn't interfere with Premium features
- Doesn't affect ad-blocking (Premium is ad-free anyway)

---

### Can I export/import my keyword lists?

**Currently:** No direct export/import feature.

**However:** Settings are stored in Chrome Sync Storage, so they:
- ✅ Sync across all your Chrome browsers (same Google account)
- ✅ Persist after browser restart
- ✅ Survive extension updates

**Workaround for backup:**
1. Open extension popup
2. Copy your keywords from the text boxes
3. Save to a text file
4. Paste back when needed

**Future:** Export/import feature may be added in a future version!

---

### Does this work on YouTube Music or YouTube TV?

Currently, the extension only works on `youtube.com`. Support for YouTube Music and YouTube TV may be added in future versions.

---

### Does this work with YouTube Shorts?

Yes! The extension filters Shorts in feeds and search results. However, it cannot filter the autoplay feed when you're actively watching Shorts (inside the `/shorts/` player).

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

### Version 1.2
- ✅ Main feed filtering (homepage, search)
- ✅ Sidebar/related videos filtering
- ✅ YouTube Shorts filtering (in feeds)
- ✅ Allowlist/Blocklist support
- ✅ Regex support (optional)
- ✅ Persistent settings with Chrome Sync
- ✅ Dark theme UI
