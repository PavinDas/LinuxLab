/**
 * Comprehensive Structured Cybersecurity Syllabus and Lessons Data
 * Aligned with the 8-Week Roadmap and Master Command Catalog.
 */
export const LessonsData = [
  {
    id: 'week1-fundamentals',
    week: 1,
    title: 'Week 1: Linux Fundamentals & Navigation',
    category: 'Fundamentals',
    badge: 'Terminal Novice',
    summary: 'Master the command line, directory navigation, file inspection, and basic text manipulation.',
    content: `
### 1. The Linux Philosophy
In Linux, almost everything is represented as a file—including disks, running processes, network sockets, and hardware devices. Mastering navigation and file inspection is the first requirement for cybersecurity practitioners.

### 2. Core Navigation Commands
- \`pwd\`: Print Working Directory. Shows where you are in the filesystem tree.
- \`ls -lah\`: List files including hidden ones (\`.\` files), with permissions, owner, size, and date.
- \`cd <path>\`: Change directory. Use \`cd ..\` for parent directory, \`cd ~\` for home.
- \`cat <file>\`: Read entire file contents.
- \`head -n 10 <file>\` & \`tail -n 10 <file>\`: View the first or last lines of a file.

### 3. Practical Exercise
1. Open the terminal and type \`pwd\`
2. Type \`ls -la\` to inspect permissions in your home folder.
3. Read the welcome guide with \`cat Desktop/welcome.txt\`
4. Search for files ending with \`.txt\` using \`find . -name "*.txt"\`
    `,
    suggestedCommands: ['pwd', 'ls -lah', 'cd Documents', 'cat welcome.txt', 'find . -name "*.txt"']
  },
  {
    id: 'week2-permissions',
    week: 2,
    title: 'Week 2: Users, Permissions & Processes',
    category: 'System Admin',
    badge: 'Permission Master',
    summary: 'Understand Linux POSIX permissions (rwx), SUID bits, sudo access, and process control.',
    content: `
### 1. Understanding Linux Permissions (rwx)
Permissions are divided into three tiers:
- **User (Owner)**: First 3 characters (e.g. \`rwx\`)
- **Group**: Middle 3 characters (e.g. \`r-x\`)
- **Others (World)**: Last 3 characters (e.g. \`r--\`)

Values:
- \`r\` (Read) = 4
- \`w\` (Write) = 2
- \`x\` (Execute) = 1

Example: \`chmod 755 script.sh\` gives Owner full access (7=4+2+1), Group read & execute (5=4+1), and Others read & execute (5=4+1).

### 2. The SUID Bit (Setuid)
When a binary has SUID set (numeric 4000, shown as \`s\` instead of \`x\`), it executes with the privileges of the **file owner** rather than the running user. If an SUID file is owned by root, executing it runs as root!

### 3. Process Control
- \`ps aux\`: List all running processes with CPU and Memory metrics.
- \`top\` / \`htop\`: Interactive real-time process manager.
- \`kill -9 <pid>\`: Forcefully terminate a runaway or malicious process.
    `,
    suggestedCommands: ['id', 'sudo -l', 'ps aux', 'chmod 755 notes.txt', 'kill -9 1520']
  },
  {
    id: 'week3-networking',
    week: 3,
    title: 'Week 3: Networking & Reconnaissance',
    category: 'Networking',
    badge: 'Network Scout',
    summary: 'Inspect network interfaces, open listening sockets, DNS records, and port scans.',
    content: `
### 1. Linux Network Inspection
- \`ip a\`: Modern command to list all network interfaces, IP addresses, and MAC addresses.
- \`ip r\`: View routing tables and default gateway.
- \`ss -tulnp\`: Inspect TCP/UDP listening ports and the processes bound to them.
- \`ping <host>\`: Send ICMP packets to test latency and reachability.

### 2. Domain & DNS Intelligence
- \`dig example.com ANY\`: Query DNS records (A, MX, NS, TXT).
- \`whois example.com\`: Query registrar and domain contact information.
- \`curl -I http://192.168.1.10\`: Inspect HTTP response headers (server software, PHP versions).

### 3. Port Scanning with Nmap
Nmap discovers live hosts and open TCP/UDP ports:
\`\`\`bash
nmap -sV -sC 192.168.1.10
\`\`\`
- \`-sV\`: Probe open ports for service version information.
- \`-sC\`: Run default security evaluation scripts.
    `,
    suggestedCommands: ['ip a', 'ss -tulnp', 'ping -c 4 192.168.1.10', 'dig example.com ANY', 'nmap -sV 192.168.1.10']
  },
  {
    id: 'week4-scripting',
    week: 4,
    title: 'Week 4: Shell Scripting & Automation',
    category: 'Scripting',
    badge: 'Automation Wizard',
    summary: 'Harness pipes, redirections, grep regex, sed, awk, and automate security checks.',
    content: `
### 1. Pipes and Redirection
- \`|\` (Pipe): Passes the standard output of the left command into the standard input of the right command.
- \`>\`: Overwrites output to a file.
- \`>>\`: Appends output to the end of a file.
- \`<\`: Feeds file content into command stdin.

### 2. Powerful Text Processing
- \`grep -i "failed" /var/log/auth.log\`: Case-insensitive search for failed authentication.
- \`awk -F: '{print $1, $6}' /etc/passwd\`: Extract usernames and home directories.
- \`sort | uniq -c\`: Sort and count unique occurrences.
- \`sed 's/find/replace/g'\`: Stream text replacement.
    `,
    suggestedCommands: ['grep -i "failed" /var/log/auth.log', "awk -F: '{print $1}' /etc/passwd", 'echo "test" >> notes.txt', 'cat /etc/passwd | wc -l']
  },
  {
    id: 'week5-hardening',
    week: 5,
    title: 'Week 5: Linux Security & Log Analysis',
    category: 'Security',
    badge: 'Log Sleuth',
    summary: 'Analyze authentication logs, configure firewalls (ufw), and audit system security with Lynis.',
    content: `
### 1. Investigating Linux Authentication Logs
Authentication attempts on Debian/Ubuntu are stored in \`/var/log/auth.log\` (or \`/var/log/secure\` on RHEL):
\`\`\`bash
grep "Failed password" /var/log/auth.log
\`\`\`
Look for repeated brute force patterns from anomalous IP addresses.

### 2. Host Firewalls (UFW)
- \`sudo ufw status verbose\`: Check active firewall rules.
- \`sudo ufw allow 22/tcp\`: Allow SSH.
- \`sudo ufw deny from 192.168.1.105\`: Block attacker IP.

### 3. Automated Auditing
- \`sudo lynis audit system\`: Run hundreds of security checks on kernel settings, permissions, and packages.
    `,
    suggestedCommands: ['grep "Failed password" /var/log/auth.log', 'sudo ufw status verbose', 'sudo lynis audit system']
  },
  {
    id: 'week6-pentest',
    week: 6,
    title: 'Week 6: Penetration Testing Tools',
    category: 'Ethical Hacking',
    badge: 'Vulnerability Hunter',
    summary: 'Deploy Web discovery (Gobuster, Nikto), exploit search (Searchsploit), and password audits (Hydra, John).',
    content: `
### 1. Web Content Discovery (Gobuster)
Enumerate hidden URLs and directories using dictionary attacks:
\`\`\`bash
gobuster dir -u http://192.168.1.10 -w /home/student/Documents/wordlist.txt
\`\`\`

### 2. Vulnerability Scanning (Nikto)
Scan web servers for obsolete software, misconfigurations, and dangerous files:
\`\`\`bash
nikto -h http://192.168.1.10
\`\`\`

### 3. Exploit Searching
Search local copies of Exploit-DB for public exploits:
\`\`\`bash
searchsploit vsftpd 2.3.4
\`\`\`
    `,
    suggestedCommands: ['gobuster dir -u http://192.168.1.10 -w /home/student/Documents/wordlist.txt', 'nikto -h http://192.168.1.10', 'searchsploit vsftpd 2.3.4']
  },
  {
    id: 'week7-privesc',
    week: 7,
    title: 'Week 7: Privilege Escalation & Forensics',
    category: 'Privilege Escalation',
    badge: 'Privilege Escalator',
    summary: 'Hunt SUID misconfigurations, GTFOBins, automated enumeration scripts, and metadata forensics.',
    content: `
### 1. SUID Privilege Escalation
Search for all SUID binaries on the system:
\`\`\`bash
find / -perm -4000 -type f 2>/dev/null
\`\`\`
If you discover a binary like \`/usr/bin/find\` with SUID set, consult GTFOBins! The \`-exec\` parameter allows running arbitrary commands as the file owner (root).

### 2. Automated Enumeration (LinPEAS)
\`\`\`bash
linpeas
\`\`\`
LinPEAS highlights high-probability privilege escalation vectors in bold red and yellow.

### 3. File Forensics
- \`exiftool <file>\`: Inspect hidden metadata.
- \`strings <binary>\`: Extract printable ASCII/Unicode strings.
- \`sha256sum <file>\`: Calculate forensic hash.
    `,
    suggestedCommands: ['find / -perm -4000 -type f 2>/dev/null', 'linpeas', 'exiftool mascot.svg', 'strings /usr/bin/find']
  },
  {
    id: 'week8-cloud-containers',
    week: 8,
    title: 'Week 8: Containers & Modern Cloud Security',
    category: 'Cloud & Containers',
    badge: 'Cloud Defender',
    summary: 'Audit Docker containers, Kubernetes pods, and cloud infrastructure security hygiene.',
    content: `
### 1. Container Security Basics
- \`docker ps\`: View running containers, exposed host ports, and base images.
- Check if current user is in the \`docker\` group: membership in the docker group is equivalent to root privileges because a user can mount \`/\` into a container!

### 2. Kubernetes Auditing
- \`kubectl get pods\`: Inspect running workloads in the cluster.
- \`kubectl get secrets\`: Audit access to sensitive environment configuration.
    `,
    suggestedCommands: ['docker ps', 'kubectl get pods']
  }
];
