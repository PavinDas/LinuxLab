/**
 * Interactive Hands-On Cybersecurity Challenges Data
 */
export const ChallengesData = [
  {
    id: 'challenge-1-log-analysis',
    title: 'Challenge 1: Rogue IP Log Investigation',
    difficulty: 'Beginner',
    category: 'Log Forensics',
    badge: 'Log Detective',
    objective: 'Investigate /var/log/auth.log to identify the external attacker IP address that repeatedly failed SSH password authentication.',
    hint: 'Run: grep "Failed password" /var/log/auth.log',
    solution: '192.168.1.105',
    verifyType: 'input', // expects user to submit the IP string
    points: 100
  },
  {
    id: 'challenge-2-suid-hunting',
    title: 'Challenge 2: SUID Privilege Escalation Hunting',
    difficulty: 'Intermediate',
    category: 'Privilege Escalation',
    badge: 'SUID Hunter',
    objective: 'Locate the dangerous SUID binary configured on the system that is owned by root and has the 4000 permission bit set.',
    hint: 'Run: find / -perm -4000 -type f 2>/dev/null',
    solution: '/usr/bin/find',
    verifyType: 'input',
    points: 150
  },
  {
    id: 'challenge-3-network-recon',
    title: 'Challenge 3: Port Reconnaissance & Version Detection',
    difficulty: 'Beginner',
    category: 'Reconnaissance',
    badge: 'Port Scanner',
    objective: 'Scan the lab host at 192.168.1.10 using Nmap. Identify the exact version of the FTP server software running on port 21.',
    hint: 'Run: nmap -sV 192.168.1.10',
    solution: 'vsftpd 2.3.4',
    verifyType: 'input',
    points: 100
  },
  {
    id: 'challenge-4-hash-cracking',
    title: 'Challenge 4: Password Hash Cracking',
    difficulty: 'Intermediate',
    category: 'Cryptography',
    badge: 'Hash Breaker',
    objective: 'Crack the password of the "student" user using the simulated John the Ripper tool and wordlist.',
    hint: 'Run: john --wordlist=wordlist.txt hash.txt',
    solution: 'cyber',
    verifyType: 'input',
    points: 150
  },
  {
    id: 'challenge-5-web-discovery',
    title: 'Challenge 5: Hidden Web Directory Busting',
    difficulty: 'Intermediate',
    category: 'Web Security',
    badge: 'Content Discoverer',
    objective: 'Use Gobuster against http://192.168.1.10 with wordlist.txt. Find the backup directory returning HTTP 200.',
    hint: 'Run: gobuster dir -u http://192.168.1.10 -w /home/student/Documents/wordlist.txt',
    solution: '/backup',
    verifyType: 'input',
    points: 150
  }
];
