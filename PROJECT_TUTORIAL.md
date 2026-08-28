# 📖 Expert for IELTS — Complete Project Guide & Tutorial

Welcome to the **Expert for IELTS** online preparation platform documentation. This guide provides a comprehensive overview of the project architecture, directory structure, module creation workflow, automated indexing system, and maintenance guidelines.

---

## 🌟 1. Project Overview & Architecture

**Expert for IELTS** is a modular web platform designed for IELTS preparation across three targeted band levels:
* **Expert 5 (Band 5.0)**: Foundational grammar, reading exercises, and writing tasks.
* **Expert 6 (Band 6.0)**: Intermediate practice modules, detailed reading analysis, and structured lessons.
* **Expert 7.5 (Band 7.5)**: Advanced grammar masterclass, reading passages, and top-tier writing modules.

### Tech Stack
* **Frontend**: Vanilla HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism), and Vanilla JavaScript (ES6+).
* **Styling**: Tailored design system in `css/styles.css` + Tailwind CSS on individual interactive simulators.
* **Automation**: Node.js automated indexing & metadata extraction engine in `scripts/`.
* **Zero Heavy Dependencies**: Operates statically with fast loading speeds, client-side filtering, sorting, and dynamic folder rendering.

---

## 📁 2. Directory Structure

```text
neo-expert-ielts/
├── .gitignore                           # Git ignore rules (backups, OS files, logs)
├── README.md                            # Repository landing overview
├── PROJECT_TUTORIAL.md                  # Complete Project Documentation & Tutorial
├── index.html                           # Main Landing Portal (Level Selection)
├── package.json                         # NPM scripts for automated indexing
├── css/
│   └── styles.css                       # Global design system, badges, & layout styles
├── js/
│   ├── theme-toggle.js                  # Light/Dark mode state manager & UI switcher
│   ├── mobile.js                        # Responsive mobile UI engine (tabs, back-to-top, vh fix)
│   ├── image-viewer.js                  # Pan, drag, pinch-to-zoom, and lightbox modal engine
│   ├── study-progress.js                # Study progress tracker, module checkmarks & auto-resume
│   ├── reading-protection.js            # Password lock engine for Reading & Writing Model Answers
│   ├── render-materials.js              # Dynamically renders cards into skill folders
│   ├── file-sorter.js                   # Handles search, skill filtering, & A-Z sorting
│   └── data/
│       ├── expert-5.js                  # Band 5.0 modules dataset (window.EXPERT_5_MODULES)
│       ├── expert-6.js                  # Band 6.0 modules dataset (window.EXPERT_6_MODULES)
│       └── expert-75.js                 # Band 7.5 modules dataset (window.EXPERT_75_MODULES)
├── expert 5/
│   ├── index.html                       # Band 5.0 Course Dashboard
│   ├── update-index.bat                 # 1-Click indexing runner for Expert 5
│   └── module-*.html                    # Grammar, reading, and writing modules
├── expert 6/
│   ├── index.html                       # Band 6.0 Course Dashboard
│   ├── update-index.bat                 # 1-Click indexing runner for Expert 6
│   └── module-*.html                    # Grammar, reading, analysis, and writing modules
├── expert 7.5/
│   ├── index.html                       # Band 7.5 Course Dashboard
│   ├── update-index.bat                 # 1-Click indexing runner for Expert 7.5
│   └── module-*.html                    # Grammar, reading, and writing modules
├── scripts/
│   ├── indexer-core.js                  # Core metadata extractor & auto-indexer engine
│   ├── apply-mobile-script.js           # Backs up & links mobile.js across all HTML files
│   ├── apply-image-viewer.js            # Backs up & links image-viewer.js across all HTML files
│   ├── apply-study-progress.js          # Backs up & links study-progress.js across all HTML files
│   ├── sync-reading-protection.js       # Syncs password locks for Reading & Writing Model Answers
│   ├── update-expert-5.js               # Dedicated update runner for Expert 5
│   ├── update-expert-6.js               # Dedicated update runner for Expert 6
│   ├── update-expert-75.js              # Dedicated update runner for Expert 7.5
│   └── update-all.js                    # Synchronizes all levels & root index.html
└── _backups/                            # Automated pre-action & timestamped backups
```

---

## ⚡ 3. Automated Indexing System

The project features an automated indexing engine (`scripts/indexer-core.js`) that removes the need to manually edit JavaScript datasets or HTML count badges when adding new lessons.

### How It Works:
1. **Scans**: Detects all `.html` files in a given level folder (excluding `index.html`).
2. **Metadata Extraction**:
   - Reads `<title>` and `<h1>` to extract clean module topics.
   - Categorizes skills: `grammar`, `reading`, or `writing`.
   - Identifies module badges: `Module 1a`, `Module 10b`, `Reference`, etc.
   - Detects module types & statuses: `Active Lesson`, `Active Analysis`, `Active Exercise`, `Active Reference`.
3. **Safety Backup**: Automatically backs up modified files into `_backups/auto_index_backup_<timestamp>/`.
4. **Dataset Generation**: Formats and saves the updated dataset into `js/data/expert-X.js`.
5. **Index Synchronization**: Updates the folder badges (`X Modules`) in `expert X/index.html` and updates the stat chips in root `index.html`.

### How to Run:

#### Method 1: Using NPM (Terminal)
```bash
# Update Expert 5 (Band 5.0)
npm run update:expert5

# Update Expert 6 (Band 6.0)
npm run update:expert6

# Update Expert 7.5 (Band 7.5)
npm run update:expert75

# Synchronize All Levels & Root Index
npm run update:all
```

#### Method 2: 1-Click Windows Batch Runner (File Explorer)
Inside each course level folder, simply double-click:
* `expert 5/update-index.bat`
* `expert 6/update-index.bat`
* `expert 7.5/update-index.bat`

---

## 🛠️ 4. Tutorial: Adding New Course Modules

### Step 1: Create the HTML File
Create your new `.html` file inside the appropriate level directory (`expert 5`, `expert 6`, or `expert 7.5`).

#### Naming Conventions:
* **Grammar Lessons**: `module_1a_present_simple.html` or `module-1a-grammar.html`
* **Reading Exercises**: `module-1a-reading.html` or `module-1-reading.html`
* **Reading Analysis / Explanations**: `module-1a-reading-explanations.html`
* **Writing Tasks**: `module-1a-writing.html`

### Step 2: Set Proper HTML Metadata
Ensure your `<title>` and `<h1>` tags clearly state the topic:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Module 3a Reading — Climate Change & Coastal Cities</title>
</head>
<body>
    <h1>Reading Practice | Climate Change &amp; Coastal Cities</h1>
    ...
</body>
</html>
```

### Step 3: Run the Indexer
Run the update script for that level (e.g., `npm run update:expert6` or double-click `update-index.bat`).

The script will automatically:
- Detect the new file
- Extract the metadata and add it under the correct skill group
- Update the dataset in `js/data/`
- Update folder badges in `index.html`

---

## 🎨 5. UI Features & Controls

* **Accordion Skill Folders**: Modules are neatly categorized into **Grammar**, **Reading**, and **Writing** folders with expand/collapse states.
* **Global Search (`#materials-search`)**: Live search filtering by title, topic, or module name across all folders.
* **Skill Filters**: Filter visible folders by `All Folders`, `Grammar`, `Reading`, or `Writing`.
* **A ➔ Z / Z ➔ A Sort (`#sort-toggle-btn`)**: Alphabetical sorting toggle per folder.
* **Expand All / Collapse All (`#toggle-all-folders-btn`)**: Expands or collapses all folders in one click.

---

## 🛡️ 6. Maintenance & Backup Guidelines

1. **Pre-Action Backup Protocol**:
   - Before applying bulk refactors or manual edits, always create a safety backup in `_backups/`.
   - The automated indexing script automatically creates timestamped backups on every run.
2. **Preserving Placeholders**:
   - The indexing system preserves deliberate placeholder items in `js/data/` while seamlessly indexing new files.
3. **Updating This Documentation**:
   - Whenever architecture, script runners, or directory conventions change, update this `PROJECT_TUTORIAL.md` file to keep the documentation synchronized.

---

## 🚫 7. GitHub Upload & Exclusion Guidelines

When committing and pushing this repository to GitHub, **do NOT upload the following files and folders**:

| Excluded Item | Reason |
| :--- | :--- |
| `_backups/` | Local safety archives created during automated indexing runs. |
| `_backup_expert_ielts/` | Legacy local backup directory. |
| `node_modules/` | Generated dependency folder (if installed locally). |
| `*.log` (e.g. `npm-debug.log`) | Temporary runtime and debug logs. |
| `.DS_Store` / `Thumbs.db` / `desktop.ini` | Operating system cache and thumbnail files. |
| `.vscode/` / `.idea/` | Local IDE user preferences and settings. |

> 💡 **Tip**: All these exclusions are configured in the root [`.gitignore`](.gitignore) file. Git will automatically ignore them when you run `git add .` and `git push`.

## 🔐 8. Reading Explanations Password Protection System

To prevent students from reading full analyses, translations, and answer keys prior to class sessions, all **Reading Explanations** modules are protected with a client-side access control modal.

### How It Works:
1. **Instant Lockdown**: When a student opens a reading explanation page, page content is blurred and interaction is blocked immediately.
2. **Individual Passwords**: Each module has a specific password configured in `js/reading-protection.js`.
3. **Teacher Master Override**: The master password `neo-teacher-access` can unlock any reading explanation across all levels.
4. **Session Persistence**: Once unlocked in class, access is remembered in `sessionStorage` for the duration of the browser session. A floating **"Khóa tài liệu"** button allows re-locking at any time.

### Current Default Passwords:

| Level | Module File | Default Password |
| :--- | :--- | :--- |
| **Expert 5** | `module-4a-reading-explanations.html` | `exp5-r4a` |
| **Expert 5** | `module-4b-reading-explanations.html` | `exp5-r4b` |
| **Expert 5** | `module-5a-reading-explanations.html` | `exp5-r5a` |
| **Expert 5** | `module-5b-reading-explanations.html` | `exp5-r5b` |
| **Expert 6** | `module-1a-reading-explanations.html` | `exp6-r1a` |
| **Expert 6** | `module-1b-reading-explanations.html` | `exp6-r1b` |
| **Expert 6** | `module-2a-reading-explanations.html` | `exp6-r2a` |
| **Expert 6** | `module-2b-reading-explanations.html` | `exp6-r2b` |
| **All Levels** | *Master Teacher Password* | `neo-teacher-access` |

### Customizing Passwords:
You can directly edit passwords inside `js/reading-protection.js` under the `window.EXPERT_READING_PASSWORDS` registry.

### Adding New Reading Explanations in the Future:
When you create a new reading explanation file in any level:
- Run `npm run check:protection` to check status and see if any new files need protection.
- Run `npm run sync:protection` (or 1-click `scripts/sync-passwords.bat`) to automatically:
  1. Create a safety backup in `_backups/`.
  2. Generate and register a default password in `js/reading-protection.js`.
  3. Inject `<script src="../js/reading-protection.js" defer></script>` into the new HTML file.

---

*Last Updated: 2026-08-28*
