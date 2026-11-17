# CyberLinux - Interactive Linux Desktop Simulator for Cybersecurity Education

![CyberLinux Mascot](assets/mascot/panda.svg)

**CyberLinux** is a fully interactive, browser-based Linux desktop simulator built from scratch using pure HTML5, modern CSS3, and vanilla JavaScript. Inspired by GNOME and styled with a cute, friendly cartoon aesthetic (featuring the CyberLinux Panda mascot), it gives beginners a hands-on, realistic Linux operating system experience directly in their web browser.

Students can explore the filesystem, run Linux commands, inspect command outputs, manage permissions, and learn cybersecurity concepts through simulated terminal tools—all without installing Linux, using a virtual machine, or exposing their host operating system to security risks.

**Live Static Deployment:** Ready for instant hosting on **GitHub Pages** (no backend server, no database, no external dependencies).

---

## 🌟 Key Features

### 🖥️ Cute GNOME-Inspired Desktop Environment
- **Top System Panel**: Activities button, active window indicator, live clock with interactive calendar popup, simulated Wi-Fi/Audio/Battery pills, and light/dark theme switcher.
- **Floating Application Dock (Dash)**: Pinned favorites with running indicator dots and smooth hover animations.
- **Application Overview (Launcher)**: Fullscreen categorized overview with instant live search across all applications.
- **Window Manager**: Movable, resizable desktop windows with titlebars, minimize, maximize, restore, stacking order (z-index), and boundary constraints.
- **Desktop Interactions**: Double-click desktop icons, right-click context menu (Terminal, New Folder, Settings, Change Wallpaper).
- **Multiple Wallpapers**: Original cute cartoon wallpapers (Panda Mascot & Laptop, Cyber Neon Grid, Pastel Sunrise, Minimal Slate).

### 💻 Realistic Linux Terminal & Command Interpreter
- **210+ Recognizable Linux & Cybersecurity Commands** matching the entire reference syllabus across all 16 categories.
- **Deterministic Command Interpreter**:
  - Argument and option parsing (`-a`, `-lah`, `--help`, etc.)
  - Pipeline operator (`|`) passing stdout to stdin across stages
  - Redirection operators (`>`, `>>`, `<`)
  - Command chaining (`&&`, `||`, `;`)
  - Environment variable expansion (`$USER`, `$HOME`, `$?`, `${VAR}`)
  - Tab completion for command names and filesystem paths
  - Up/Down arrow command history with persistence
  - Configurable themes (Cyber Green, GNOME Dark, Matrix Neon, Retro Amber)
  - Configurable font sizes and clear screen (`Ctrl+L`)
- **Shared Virtual State**: Files created in the terminal instantly appear in the GUI File Manager and vice versa!

### 📁 Graphical File Manager (GNOME Files)
- Quick access places: Home, Desktop, Documents, Downloads, Pictures, Projects, Root (`/`), and Logs (`/var/log`).
- Breadcrumb navigation bar and Back/Forward history.
- Grid View and List View with file sizes and POSIX permissions (`-rwxr-xr-x`).
- Context menu: Open, Edit in Text Editor, Rename, Delete, and Permissions/Properties inspector (change octal modes like `755`, `644`, `4755`).
- File search and instant filtering.
- Pictures includes two JPEG photos and vector samples; images open in the Image Viewer.

### 📖 Searchable Command Reference Catalog
- Searchable in-app documentation of all commands in the syllabus.
- Filter by category: Linux Fundamentals, Users & Permissions, Process Management, Networking, Package Management, Scripting, Cryptography, Hardening, Penetration Testing, Forensics, Privilege Escalation, and Containers.
- Detailed cards with Description, Syntax, Flags, Practical Cybersecurity Use, Examples, and Expected Outputs.
- "Run in Terminal" action button to test commands immediately.

### 🛠️ Additional Core Applications
- **Text Editor (Gedit style)**: Create, open, edit virtual files, line numbers, word/char count, unsaved indicator, and `Ctrl+S` saving.
- **Calculator**: Clean calculator powered by a safe recursive-descent parser (`SafeMath` without `eval()`).
- **System Monitor**: Live simulated CPU %, RAM MB, and Virtual Disk gauges with an interactive process table to terminate processes.
- **Image Viewer**: Safe SVG and bundled JPEG viewer with Zoom In/Out, 90° rotation, and metadata inspector.
- **Settings**: Theme selection (Light / Dark mode), wallpaper picker, user profile details, JSON backup export/import, and factory reset.
- **About CyberLinux**: Architecture and security summary.

---

## 🔒 Security Architecture Summary

Security is designed into every layer:
1. **Zero Host Execution**: The terminal runs on a JavaScript simulation engine. No user command can ever escape to the host operating system.
2. **Zero `eval()` or `new Function()`**: Strictly forbidden across the entire codebase, including command execution, scripting, and the calculator.
3. **Strict Content Security Policy (CSP)**: Compatible with GitHub Pages, restricting scripts, frames, and objects.
4. **Path Traversal Prevention**: Canonical path normalization confines all operations within the virtual root (`/`). Redundant slashes, `.`, and `..` cannot escape.
5. **XSS Protection**: Untrusted file contents, usernames, and command inputs are rendered using `textContent` or safe DOM builders.
6. **Prototype Pollution Protection**: VFS directory nodes use `Map` structures, and JSON parsing strips dangerous keys (`__proto__`, `constructor`, `prototype`).
7. **DoS Prevention**: Hard bounds on command length (4096 chars), output buffers (65536 chars), virtual file sizes (2MB), directory depth (32), and process limits (80).

*For the complete security model and audit documentation, read [SECURITY.md](file:///home/pavin/Panda/LinuxOS/SECURITY.md).*

---

## 📁 Technical Architecture & File Structure

```text
CyberLinux/
├── index.html                   # Main single-page application & CSP configuration
├── README.md                    # Project documentation & deployment guide
├── SECURITY.md                  # Comprehensive security architecture & threat model
├── LICENSE                      # MIT Open Source License
│
├── assets/
│   ├── mascot/                  # Cute Cyber Panda mascot SVG
│   ├── pictures/                # Bundled JPEG photos shown in the virtual Pictures folder
│   └── wallpapers/              # Wallpaper graphics and preview styles
│
├── css/
│   ├── main.css                 # Colors, CSS custom properties, resets, light/dark themes
│   ├── desktop.css              # Desktop container, wallpapers, desktop icons, notifications
│   ├── panel.css                # Top GNOME panel, clock, calendar popup, quick pills
│   ├── dock.css                 # Floating application dock, running indicators, animations
│   ├── launcher.css             # Application overview screen, categories, live search
│   ├── windows.css              # Window manager, titlebars, controls, dragging, resizing
│   ├── terminal.css             # Terminal styling, themes (Cyber, Matrix, Amber), fonts
│   ├── applications.css         # Styles for Files, Editor, Calculator, Monitor, Settings, Lab
│   └── responsive.css           # Tablet and mobile viewport adaptations
│
├── js/
│   ├── app.js                   # Application bootstrapper and window router
│   ├── core/
│   │   ├── event-bus.js         # Decoupled pub/sub event bus
│   │   ├── virtual-users.js     # User context (student, root), UIDs, /etc/passwd simulation
│   │   ├── virtual-permissions.js # Linux POSIX rwx permission evaluator and SUID checker
│   │   ├── virtual-filesystem.js # Tree-based VFS using Maps, starter directory hierarchy
│   │   ├── virtual-processes.js  # Process table (ps, top, kill, resource stats)
│   │   ├── virtual-network.js   # Interfaces (eth0, lo), ARP, DNS, lab scan targets
│   │   └── storage-manager.js   # Local persistence, schema versioning, JSON export/import
│   ├── security/
│   │   ├── limits.js            # Hard bounds and DoS quotas
│   │   ├── sanitizer.js         # XSS escaping, safe DOM builder, safe JSON parser
│   │   ├── path-validator.js    # Canonical path normalization and traversal prevention
│   │   └── safe-math.js         # Recursive-descent math parser (zero eval)
│   ├── terminal/
│   │   ├── command-parser.js    # Tokenizer, quotes, pipelines, redirection, chaining
│   │   ├── command-history.js   # Up/down arrow history recall and deduplication
│   │   ├── command-registry.js  # Central command dictionary with help/man metadata
│   │   ├── commands-catalog.js  # 150+ Linux & Cybersecurity command implementations
│   │   └── shell-interpreter.js # Command execution coordinator, pipelines, tab completion
│   ├── desktop/
│   │   ├── window-manager.js    # Window stacking, dragging, bounds checking, resizing
│   │   ├── dock.js              # Application dock with active indicators
│   │   ├── launcher.js          # GNOME application overview
│   │   ├── panel.js             # Top panel, live clock, calendar popup
│   │   ├── notifications.js     # Cute achievement toasts
│   │   └── context-menu.js      # Custom right-click menu
│   ├── apps/
│   │   ├── terminal-app.js      # Terminal UI, font scaler, theme switcher
│   │   ├── file-manager-app.js  # GNOME Files GUI, places sidebar, permissions modal
│   │   ├── text-editor-app.js   # Virtual text editor, line numbers, word count
│   │   ├── calculator-app.js    # Safe calculator
│   │   ├── system-monitor-app.js# CPU/RAM/Disk gauges and process terminator
│   │   ├── settings-app.js      # Themes, wallpapers, backup/restore, reset
│   │   ├── learning-center-app.js # 8-week curriculum, challenges, badge showcase
│   │   ├── command-reference-app.js # Searchable command master list
│   │   ├── image-viewer-app.js  # SVG and picture viewer
│   │   └── about-app.js         # System info dialog
│   └── learning/
│       ├── lessons-data.js      # 8-week lesson content and practical examples
│       ├── challenges-data.js   # Hands-on challenge specifications
│       └── progress-manager.js  # Score, badge, and challenge progress tracker
│
└── tests/
    ├── test-runner.html         # Visual browser-based automated test runner
    ├── test-framework.js        # Self-contained unit testing assertion framework
    ├── filesystem-tests.js      # VFS CRUD, permissions, and hierarchy tests
    ├── terminal-tests.js        # Tokenizer, pipes, redirection, and command tests
    ├── security-tests.js        # Injection, XSS, Path traversal, and DoS tests
    └── application-tests.js     # Calculator, processes, and learning progress tests
```

---

## 🚀 GitHub Pages Deployment Guide

Deploying CyberLinux on GitHub Pages takes under two minutes:

1. **Create a GitHub Repository**:
   Create a new public repository (e.g. `cyberlinux`) on GitHub.

2. **Push the Files**:
   Push the project files to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CyberLinux Simulator"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - In your GitHub repository, navigate to **Settings** > **Pages** (under the "Code and automation" section).
   - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   - Under **Branch**, choose `main` and set the folder to `/ (root)`.
   - Click **Save**.

4. **Access your Simulator**:
   Within 30–60 seconds, GitHub Pages will deploy your site at:
   `https://<your-username>.github.io/<your-repo-name>/`

*Note: All asset links and script imports use relative paths (`./css/...`, `./js/...`), ensuring full compatibility with GitHub project subpaths.*

---

## 💻 Local Testing & Development

To run CyberLinux locally on any machine with Python, Node, or standard HTTP tools:

### Using Python 3:
```bash
python3 -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Using Node.js `npx serve`:
```bash
npx serve .
```

### Running the Automated Test Suite:
- **In Browser**: Navigate to [http://localhost:8000/tests/test-runner.html](http://localhost:8000/tests/test-runner.html) to see the visual test suite.
- **In Terminal**:
  ```bash
  node -e '
  import("./tests/test-framework.js").then(async ({ runner }) => {
    await import("./tests/filesystem-tests.js");
    await import("./tests/terminal-tests.js");
    await import("./tests/security-tests.js");
    await import("./tests/application-tests.js");
    const summary = await runner.run((evt) => {
      if (evt.type === "test-pass") console.log("✔", evt.description);
      if (evt.type === "test-fail") console.error("✘", evt.description, evt.error);
      if (evt.type === "summary") console.log("\nSummary:", evt.summary);
    });
    if (summary.failed > 0) process.exit(1);
  });'
  ```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Alt + T` | Open new Terminal window |
| `Ctrl + Q` | Close the active emulator window |
| `Super` (Windows key) | Toggle Application Overview (Launcher) |
| `Ctrl + Shift + Esc` | Open System Monitor |
| `Ctrl + L` | Clear terminal screen |
| `Ctrl + W` | Delete the previous word in the terminal input |
| `Ctrl + C` | Cancel current command / interrupt prompt |
| `Ctrl + S` | Save file in Text Editor |
| `Tab` | Autocomplete command names and filesystem paths |
| `Up / Down Arrows` | Browse terminal command history |
| `Escape` | Close Application Overview or Context Menu |

---

## 🔬 Ethical Use Disclaimer

CyberLinux is created solely for educational purposes to teach Linux systems administration, defensive security, log analysis, and authorized ethical hacking fundamentals. All network targets (`192.168.1.10`, `example.com`), scan outputs, and vulnerability data are controlled, safe local simulations. CyberLinux never interacts with real external networks or physical hardware.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
