# CyberLinux Security Architecture & Policy

Security is the primary architectural requirement for the **CyberLinux** desktop simulator. Because the application is intended to teach ethical hacking and terminal commands to beginners, the design enforces complete and verifiable isolation between the user's terminal input and the host operating system.

---

## 1. Primary Security Architecture & Principles

1. **Zero Host Execution Boundary**: CyberLinux contains zero native binaries, zero backend servers, and zero hooks into the host operating system. Every command is executed purely as a deterministic state transition within an in-memory JavaScript simulation engine.
2. **Strict Elimination of Dynamic Evaluation**: The functions `eval()`, `new Function()`, `setTimeout(string)`, and `setInterval(string)` are strictly prohibited across the entire codebase.
3. **Controlled Simulation vs. Real Exploits**: Security tools (such as Nmap, Gobuster, Nikto, LinPEAS, Hydra, and Searchsploit) operate exclusively against predefined, controlled in-memory lab data. CyberLinux **never** initiates socket connections or scans against the visitor's local area network or external Internet servers.
4. **Defense in Depth**: Even within the virtual client sandbox, inputs are validated, outputs are sanitized, resource bounds are enforced, and Content Security Policies prevent unauthorized code execution.

---

## 2. Threat Mitigation Specifications

### 2.1 OS Command Injection Prevention
- **Threat**: Attackers submitting terminal commands containing shell meta-characters (`; rm -rf /`, `$(reboot)`, `` `id` ``) attempting to trigger code execution on the user's machine.
- **Defense**: CyberLinux uses a custom, dedicated lexical tokenizer (`CommandParser.tokenize`) and deterministic Abstract Syntax Tree builder (`CommandParser.buildAst`). Only explicitly registered commands in `CommandRegistry` can execute. Unsupported syntax or malicious host commands are safely trapped and returned as standard simulated errors (`command not found`). No text ever reaches an operating system process.

### 2.2 Cross-Site Scripting (XSS) Prevention
- **Threat**: Malicious HTML/JavaScript payloads in virtual file names, file contents, environment variables, or challenge submissions (e.g. `<script>alert(1)</script>`, `<img src=x onerror=...>`):
- **Defense**:
  - The DOM builder (`Sanitizer.createElement`) exclusively constructs DOM nodes using `document.createElement` and `document.createTextNode`.
  - The property `innerHTML` is never used for untrusted user content.
  - The helper `Sanitizer.escapeHTML()` escapes HTML entities (`&`, `<`, `>`, `"`, `'`).
  - Terminal output is rendered into text nodes or escaped blocks.

### 2.3 Virtual Path Traversal Prevention
- **Threat**: Commands passing relative traversal sequences (`../../../../etc/shadow`, `//..//..//root`) attempting to escape the virtual root or access host file paths.
- **Defense**:
  - `PathValidator.normalize(path, cwd)` canonicalizes all paths. Segments are split by `/`, resolved against the current directory, and `.`, `..`, and redundant slashes are resolved in an array stack.
  - Traversal attempts past `/` remain clamped to `/`.
  - The virtual filesystem has zero access to the host's actual disk or files.

### 2.4 Prototype Pollution Prevention
- **Threat**: Malicious JSON backups or directory keys targeting `__proto__`, `constructor`, or `prototype` to alter JavaScript Object prototypes.
- **Defense**:
  - All directory children in `VirtualFileSystem` are stored in ES6 `Map` instances, which do not inherit prototype properties.
  - `Sanitizer.safeJSONParse()` strips `__proto__`, `constructor`, and `prototype` keys during JSON deserialization.

### 2.5 Denial of Service (DoS) Prevention
- **Threat**: Users pasting millions of characters into the terminal, spawning thousands of processes, creating massive files, or triggering infinite arithmetic loops.
- **Defense**: Hard limits configured in `SecurityLimits`:
  - `MAX_INPUT_LENGTH`: 4,096 characters per command line.
  - `MAX_OUTPUT_CHARS`: 65,536 characters (output is truncated with a warning notice).
  - `MAX_FILE_SIZE_BYTES`: 2 MB maximum file quota.
  - `MAX_FILESYSTEM_NODES`: 2,000 maximum file/directory nodes.
  - `MAX_PATH_DEPTH`: 32 levels maximum nesting.
  - `MAX_PROCESSES`: 80 maximum concurrent simulated processes.
  - `MAX_PIPE_STAGES`: 16 maximum pipeline stages (`|`).

---

## 3. Content Security Policy (CSP)

CyberLinux enforces a strict Content Security Policy specified via `<meta http-equiv="Content-Security-Policy">` in `index.html`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none';
```

- `default-src 'self'`: Restricts all resources to the current origin by default.
- `script-src 'self'`: Only permits first-party scripts loaded as modules. Disallows inline `<script>` tags and `eval()`.
- `object-src 'none'`: Prevents embedding Flash, Java, or legacy plugins.
- `frame-ancestors 'none'`: Prevents clickjacking by forbidding embedding inside external `<iframe>` elements.
- `connect-src 'self'`: Forbids unauthorized background network connections.

---

## 4. Local Storage & Data Privacy

1. All virtual filesystem data, command history, and learning progress are stored locally on the user's browser via the Web Storage API (`localStorage`).
2. CyberLinux transmits zero telemetry, zero analytics, and zero user data to any external server.
3. The Settings application provides a complete **Factory Reset** function that clears all simulator keys from `localStorage` on demand.

---

## 5. Educational Boundary Statement

CyberLinux is an **educational simulator**, not a secure sandbox for executing untrusted real-world malware or compiled binaries. Users should never attempt to use this simulator as an isolation sandbox for actual malicious binaries.
