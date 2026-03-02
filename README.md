
<img width="128" height="128" alt="icon-128" src="https://github.com/user-attachments/assets/f15726ef-00aa-4f0f-8667-5c19765e6c70" />


# 🎬 YouTube Advanced Filter (v2)

A browser extension that gives you granular control over YouTube’s interface and video filtering.

This project is open-source and not monetized.  
It exists to make YouTube more controllable and less distracting.

---

## 🧭 Overview

This extension does two things:

1. 🎯 Filters videos by title, channel, and upload date  
2. 🧱 Hides specific YouTube UI elements at the DOM level  

It works on:
- Home
- Search
- Subscriptions
- Watch pages

The extension operates purely on the DOM after the page loads.  
It does **not** intercept network requests or modify YouTube APIs.
<img width="1919" height="951" alt="image" src="https://github.com/user-attachments/assets/fb81e5b8-1772-49d8-a14f-bd1d2f1a8e9d" />

<img width="1043" height="948" alt="image" src="https://github.com/user-attachments/assets/ab1d40c2-0bd6-498e-8032-4d530ee492ff" />
<img width="904" height="1280" alt="image" src="https://github.com/user-attachments/assets/6325aedc-5fd1-40a8-8615-91504e61a7e6" />


---

## 🔎 Features

### 🎥 Content Filtering

- Title allowlist
- Title blocklist
- Channel allowlist
- Channel blocklist
- Optional regex support
- Optional whole-word matching
- Date filtering (Today / Week / Month / Year)
- Soft hide (blur + disable interaction)
- Hard hide (display: none)

Filtering applies to:
- Standard videos
- Sidebar recommendations
- Search results
- Channel cards and shelves

---

### 🧩 UI Controls

#### 🔴 Core
- Hide Shorts
- Hide homepage feed
- Hide comments

#### 🟢 Feed Controls
- Hide sponsored cards
- Hide playlist cards
- Hide members-only videos
- Hide mix/radio playlists
- Hide subscription section
- Hide subscription buttons

#### 🟣 Watch Page
- Hide recommended sidebar
- Hide live chat
- Hide playlist panel
- Hide end cards overlays
- Disable autoplay

#### ⚙️ Navigation
- Hide top header
- Hide notification bell
- Hide Explore section
- Hide “More from YouTube”
- Hide “You” section

---

## 🏗️ Design Choices

### 🎨 CSS-first hiding

Where possible, UI elements are hidden using injected CSS instead of JavaScript.  
This reduces MutationObserver overhead and improves performance.

Shorts are handled entirely via CSS to avoid re-entrant observer loops.

### 🚫 No network interception

This extension does not block requests or modify YouTube responses.  
All filtering is DOM-based after content renders.

### 🔁 Observer guard

MutationObserver is protected against feedback loops to prevent excessive re-filtering when elements are hidden.

---

## ⚠️ Limitations

- Does not work on the YouTube mobile app
- Does not modify embedded videos
- Cannot remove content baked into the video itself (e.g., sponsor segments inside the video)
- Relies on YouTube’s DOM structure, so UI changes may temporarily break selectors
- Date filtering depends on relative timestamp parsing and may not cover every edge case

---

## 🔐 Permissions

- `storage` – to save settings  
- `https://www.youtube.com/*` – to modify the DOM  

No analytics. No tracking. No data collection.

---

## 🛠️ Installation (Manual)

1. Clone or download this repository  
2. Open `chrome://extensions`  
3. Enable Developer Mode  
4. Click “Load unpacked”  
5. Select the extension folder  

---

## 🚀 Version

v2.0 – Major rewrite:
- Expanded UI controls  
- Improved filtering engine  
- CSS-first hiding strategy  
- Observer loop protection  
