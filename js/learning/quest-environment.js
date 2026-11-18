/**
 * Linux Command Quest Environment Initializer
 *
 * Populates and maintains the shared virtual filesystem (VFS) and process tree
 * with progressive challenge artifacts, logs, directories, and flags.
 */

export function seedQuestEnvironment(vfs, users, processes = null) {
  if (!vfs) return;

  const rootUser = users ? (users.getUser('root') || { name: 'root', uid: 0, groups: ['root'] }) : { name: 'root', uid: 0, groups: ['root'] };
  const studentUser = users ? (users.getUser('student') || { name: 'student', uid: 1001, groups: ['student'] }) : { name: 'student', uid: 1001, groups: ['student'] };

  // Helper to ensure a directory exists with specific permissions
  const ensureDir = (path, perms = 0o775, owner = 'student', group = 'student') => {
    let node = vfs.getNode(path);
    if (!node) {
      vfs.rawMkdir(path, perms, owner, group);
      node = vfs.getNode(path);
    }
    return node;
  };

  // Helper to ensure a file exists with specific content and permissions
  const ensureFile = (path, content, perms = 0o664, owner = 'student', group = 'student', size = null) => {
    let node = vfs.getNode(path);
    if (!node) {
      vfs.rawCreateFile(path, content, perms, owner, group);
      node = vfs.getNode(path);
    }
    if (size !== null && node) {
      node.size = size;
    }
    return node;
  };

  // Ensure base home directories exist
  ensureDir('/home/student', 0o775, 'student', 'student');
  ensureDir('/home/student/Desktop', 0o775, 'student', 'student');
  ensureDir('/home/student/Documents', 0o775, 'student', 'student');
  ensureDir('/home/student/Downloads', 0o775, 'student', 'student');
  ensureDir('/home/student/Pictures', 0o775, 'student', 'student');
  ensureDir('/home/student/Projects', 0o775, 'student', 'student');
  ensureDir('/var/log', 0o755, 'root', 'root');
  ensureDir('/tmp', 0o1777, 'root', 'root');

  // If kiddy user exists, ensure kiddy has student group access for smooth lab learning
  if (users && users.users.has('kiddy')) {
    const kiddy = users.users.get('kiddy');
    if (!kiddy.groups.includes('student')) {
      kiddy.groups.push('student');
    }
  }

  // -------------------------------------------------------------------------
  // Challenge 01 — First Contact (ls)
  // Flag directly visible in /home/student directory listing
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/FLAG{FIRST_STEP_LS_DISCOVERY}',
    'Congratulations! You discovered your first Linux flag using directory listing.\nFlag: FLAG{FIRST_STEP_LS_DISCOVERY}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 02 — Follow the Path (cd)
  // Navigation into quest_chamber produces output with the flag
  // -------------------------------------------------------------------------
  const chamberNode = ensureDir('/home/student/quest_chamber', 0o755, 'student', 'student');
  if (chamberNode) {
    chamberNode.navMessage = '[Directory Navigation] Clue Discovered: FLAG{CD_PATH_NAVIGATOR_FOUND}';
  }
  ensureFile(
    '/home/student/quest_chamber/README.txt',
    'Welcome to the Quest Chamber!\nYou navigated here using the cd command.\nFlag: FLAG{CD_PATH_NAVIGATOR_FOUND}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 03 — The Invisible File (ls -a)
  // Hidden dotfile in /home/student/Documents
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Documents/.FLAG{HIDDEN_IN_PLAIN_SIGHT_LSA}',
    'Linux dotfiles are hidden by default from normal ls listings.\nFlag: FLAG{HIDDEN_IN_PLAIN_SIGHT_LSA}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 04 — Detailed Investigation (ls -l)
  // File with distinct size (1337 bytes) and detailed metadata
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Documents/audit_log.txt',
    'Routine system audit log.\nEntry 1: normal.\nEntry 2: normal.\n',
    0o644,
    'student',
    'student',
    250
  );
  ensureFile(
    '/home/student/Documents/network_capture.pcap',
    'PCAP_DUMP_HEADER_SIMULATION\n',
    0o644,
    'student',
    'student',
    4096
  );
  ensureFile(
    '/home/student/Documents/FLAG{METADATA_INSPECTOR_LSL}',
    'Anomaly identified! Detailed metadata inspection revealed this 1337-byte artifact.\nFlag: FLAG{METADATA_INSPECTOR_LSL}\n',
    0o644,
    'student',
    'student',
    1337
  );

  // -------------------------------------------------------------------------
  // Challenge 05 — The Hidden Combination (ls -la)
  // Hidden dotfile with full permissions in /home/student/Projects
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Projects/.FLAG{COMBINED_OPTIONS_POWER_LSLA}',
    'Combined options -la reveal hidden entries with complete permissions and ownership.\nFlag: FLAG{COMBINED_OPTIONS_POWER_LSLA}\n',
    0o755,
    'student',
    'student',
    2048
  );

  // -------------------------------------------------------------------------
  // Challenge 06 — Where Am I? (pwd)
  // Checkpoint folder verifying path
  // -------------------------------------------------------------------------
  ensureDir('/home/student/Projects/checkpoint_FLAG{PWD_LOCATION_CONFIRMED}', 0o755, 'student', 'student');
  ensureFile(
    '/home/student/Projects/checkpoint_FLAG{PWD_LOCATION_CONFIRMED}/location.txt',
    'Current working directory verified: /home/student/Projects/checkpoint_FLAG{PWD_LOCATION_CONFIRMED}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 07 — Reading the Message (cat)
  // Confidential memo in Documents
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Documents/confidential_memo.txt',
    'CONFIDENTIAL BRIEFING\n----------------------------------------\nOperative Clearance: Level 1\nDirect file inspection confirmed via cat.\nYour security flag: FLAG{CAT_FILE_READER_SUCCESS}\n----------------------------------------\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 08 — Creating the Signal (touch)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Documents/signal_beacon.txt',
    'Beacon Protocol:\nCreate the file "activate.sig" in this directory using touch.\nActivation Flag: FLAG{TOUCH_FILE_CREATOR_SIGNAL}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 09 — Building the Archive (mkdir)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Projects/mission_archive.txt',
    'Archive Protocol Directive:\nCreate nested directories "archive/backups" using "mkdir -p archive/backups".\nDirective Clearance Flag: FLAG{MKDIR_NESTED_DIRS_SUCCESS}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 10 — Making a Backup (cp)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Documents/database.conf',
    '# Database Configuration Master File\n[database]\nhost = 127.0.0.1\nport = 5432\nuser = dbadmin\n# Make backup copy to database.conf.bak\nbackup_flag = FLAG{CP_BACKUP_SPECIALIST_READY}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 11 — Relocating Assets (mv)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Projects/temp_clue.dat',
    '# Staging Artifact\n# Relocate this artifact to final_clue.txt using mv\nRELOCATION_KEY = FLAG{MV_RELOCATE_AND_RENAME}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 12 — Cleaning Up Traces (rm)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Downloads/disposal_guide.txt',
    'Quarantine Disposal Clearance Notice:\nSafely remove "malware_sample.sh" using rm.\nDisposal Officer Authorization Flag: FLAG{RM_CLEANUP_CERTIFIED}\n',
    0o644,
    'student',
    'student'
  );
  ensureFile(
    '/home/student/Downloads/malware_sample.sh',
    '#!/bin/bash\n# Inactive quarantine sample\necho "Quarantine sample payload"\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 13 — Mystery Formats (file)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Downloads/mystery_asset',
    'ASCII text, magic byte verification complete.\nClassification Flag: FLAG{FILE_TYPE_MAGIC_DETECTIVE}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 14 — Deep Metadata Audit (stat)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Documents/evidence.bin',
    'Forensic Evidence Block #4096.\nInode Status Verified: FLAG{STAT_METADATA_DEEP_DIVE}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 15 — The Needle in the System (find)
  // -------------------------------------------------------------------------
  ensureDir('/home/student/Projects/archive', 0o775, 'student', 'student');
  ensureDir('/home/student/Projects/archive/backups', 0o775, 'student', 'student');
  ensureFile(
    '/home/student/Projects/archive/backups/flag_treasure.txt',
    'Recursive deep search successful! You located the treasure using find.\nFlag: FLAG{FIND_SEARCH_MASTER_DISCOVERED}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 16 — Log Pattern Hunter (grep)
  // -------------------------------------------------------------------------
  const authLogNode = vfs.getNode('/var/log/auth.log');
  const alertLine = 'Nov 18 09:22:15 cyberlinux sshd[2841]: SECURITY_FLAG: FLAG{GREP_LOG_HUNTER_REGEX}\n';
  if (authLogNode && !authLogNode.content.includes('FLAG{GREP_LOG_HUNTER_REGEX}')) {
    authLogNode.content += alertLine;
    authLogNode.size = authLogNode.content.length;
  } else if (!authLogNode) {
    ensureFile('/var/log/auth.log', alertLine, 0o644, 'root', 'root');
  }

  // -------------------------------------------------------------------------
  // Challenge 17 — The Opening Lines (head)
  // -------------------------------------------------------------------------
  let csvContent = 'ID,NAME,ROLE,STATUS,TOKEN\n' +
    '1,AGENT_ALPHA,FORENSICS,ACTIVE,FLAG{HEAD_TOP_LINES_EXTRACTED}\n' +
    '2,AGENT_BETA,RECON,IDLE,TOK_8923\n' +
    '3,AGENT_GAMMA,CRYPTO,ACTIVE,TOK_9104\n' +
    '4,AGENT_DELTA,SYSADMIN,IDLE,TOK_4412\n' +
    '5,AGENT_EPSILON,SECURITY,ACTIVE,TOK_5510\n';
  for (let i = 6; i <= 100; i++) {
    csvContent += `${i},AGENT_PAD_${i},ANALYST,STANDBY,TOK_${1000 + i}\n`;
  }
  ensureFile('/home/student/Documents/giant_dataset.csv', csvContent, 0o644, 'student', 'student');

  // -------------------------------------------------------------------------
  // Challenge 18 — The Final Clue (tail)
  // -------------------------------------------------------------------------
  let logStream = '';
  for (let i = 1; i <= 60; i++) {
    logStream += `[TELEMETRY_PKT_${i.toString().padStart(3, '0')}] Status OK. Sensor ping nominal.\n`;
  }
  logStream += '[TELEMETRY_ALERT] Intrusion packet captured at stream termination.\n' +
    '[STREAM_END] Incident captured in trailing packet: FLAG{TAIL_LOG_STREAM_MONITOR}\n';
  ensureFile('/home/student/Documents/server_stream.log', logStream, 0o644, 'student', 'student');

  // -------------------------------------------------------------------------
  // Challenge 19 — Paging Through History (less)
  // -------------------------------------------------------------------------
  let histDoc = '========================================\n' +
    'CYBERLINUX HISTORICAL OPERATING LOG\n' +
    '========================================\n\n';
  for (let page = 1; page <= 8; page++) {
    histDoc += `--- CHAPTER ${page}: SYSTEM EVOLUTION ---\n`;
    histDoc += 'Linux distributions utilize pagers such as less to navigate multi-screen documentation.\n';
    histDoc += 'Forward navigation: Spacebar or Page Down. Backward navigation: b or Page Up.\n\n';
  }
  histDoc += '--- FINAL ARCHIVE DISCLOSURE ---\n' +
    'Pager Navigation Completed.\n' +
    'Historical Flag: FLAG{LESS_PAGER_NAVIGATOR}\n';
  ensureFile('/home/student/Documents/system_history.txt', histDoc, 0o644, 'student', 'student');

  // -------------------------------------------------------------------------
  // Challenge 20 — Word & Byte Count (wc)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Documents/packet_dump.txt',
    'TCP_DUMP_VERIFY_STREAM_RECORD_INTEGRITY_CHECK\nWord and byte count verification complete: FLAG{WC_WORD_LINE_COUNTER}\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 21 — The Forbidden Vault (chmod)
  // Script with 0o644 permissions (not executable until chmod +x)
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Projects/vault_unlocker.sh',
    '#!/bin/bash\necho "Vault Unlocked! Secret Flag: FLAG{CHMOD_PERMISSIONS_MASTER_755}"\n',
    0o644,
    'student',
    'student'
  );

  // -------------------------------------------------------------------------
  // Challenge 22 — Transfer of Ownership (chown)
  // Config owned by root in /home/student/Projects
  // -------------------------------------------------------------------------
  ensureFile(
    '/home/student/Projects/service.conf',
    '# Restricted Service Configuration\n# Transfer file ownership to student: chown student service.conf\nOWNERSHIP_FLAG = FLAG{CHOWN_OWNERSHIP_TRANSFERRED}\n',
    0o644,
    'root',
    'root'
  );

  // -------------------------------------------------------------------------
  // Challenge 23 — Pipeline Reconnaissance (| & grep)
  // Account entry in /etc/passwd
  // -------------------------------------------------------------------------
  const passwdNode = vfs.getNode('/etc/passwd');
  const pipeUserLine = 'flag_agent:x:1338:1338:FLAG{PIPE_REDIRECTION_CONDUIT}:/home/flag_agent:/bin/bash\n';
  if (passwdNode && !passwdNode.content.includes('FLAG{PIPE_REDIRECTION_CONDUIT}')) {
    passwdNode.content += pipeUserLine;
    passwdNode.size = passwdNode.content.length;
  }

  // -------------------------------------------------------------------------
  // Challenge 24 — Rogue Process Interception (ps & kill)
  // -------------------------------------------------------------------------
  if (processes) {
    if (!processes.get(1337)) {
      processes.processes.set(1337, {
        pid: 1337,
        ppid: 1,
        user: 'student',
        cpu: 78.4,
        mem: 4.2,
        stat: 'R',
        command: 'python3 miner_payload.py --flag FLAG{PROCESS_HUNTER_KILL_SIGTERM}',
        tty: '?',
        startTime: '09:15',
        killable: true
      });
    }
  }

  // -------------------------------------------------------------------------
  // Challenge 25 — The Intruder's Trail (Expert incident response)
  // -------------------------------------------------------------------------
  const incidentLog1 = 'Nov 18 03:14:22 cyberlinux sshd[9012]: Accepted password for root from 10.0.0.99 port 54321 ssh2\n';
  const incidentLog2 = 'Nov 18 03:14:45 cyberlinux bash: root session staged payload in /tmp/.backdoor_session\n';
  if (authLogNode && !authLogNode.content.includes('/tmp/.backdoor_session')) {
    authLogNode.content += incidentLog1 + incidentLog2;
    authLogNode.size = authLogNode.content.length;
  }

  ensureDir('/tmp/.backdoor_session', 0o755, 'root', 'root');
  ensureFile(
    '/tmp/.backdoor_session/.incident_report.txt',
    '==================================================\n' +
    'FORENSIC INCIDENT INVESTIGATION RESOLVED\n' +
    '==================================================\n' +
    'Attacker IP: 10.0.0.99\n' +
    'Compromise Vector: Unauthorized SSH Credential Session\n' +
    'Staging Artifact: /tmp/.backdoor_session\n\n' +
    'Master Incident Resolution Flag:\n' +
    'FLAG{EXPERT_CYBER_INCIDENT_RESOLVED}\n' +
    '==================================================\n',
    0o644,
    'root',
    'root'
  );
}
