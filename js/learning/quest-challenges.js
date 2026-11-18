/**
 * Linux Command Quest — Progressive CTF Learning Lab Challenges Data
 *
 * Educational CTF curriculum designed to teach Linux commands progressively
 * from absolute beginner to advanced cybersecurity investigator.
 *
 * NOTE ON SECURITY / CLIENT-SIDE LIMITATION:
 * Panda OS is a static browser-based desktop simulator. Flags and validation logic
 * execute within client-side JavaScript. A determined user inspecting Developer Tools
 * or storage could find the flags. This platform is designed for educational progression,
 * cognitive practice, and skill building rather than competitive scoring.
 */

export const QuestChallengesData = [
  // =========================================================================
  // 1. BEGINNER CHALLENGES (One command, basic navigation & listing)
  // =========================================================================
  {
    id: 'quest-01-first-contact',
    number: 1,
    title: 'Challenge 01 — First Contact',
    command: 'ls',
    difficulty: 'Beginner',
    category: 'Directory Navigation',
    points: 10,
    estimatedMinutes: 2,
    startingDirectory: '/home/student',
    mission: 'Your journey begins here. A Linux system contains many files and directories, but you need to understand your surroundings first. Explore your current location and retrieve the flag.',
    objective: 'List the files and directories in your starting directory to spot the flag directly in the directory listing.',
    tags: ['ls', 'directory listing', 'navigation'],
    flag: 'FLAG{FIRST_STEP_LS_DISCOVERY}',
    badge: 'First Flag',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'You need a command that displays all files and folders located right where you are standing.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The command name is a short two-letter abbreviation for "list".'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Type "ls" and press Enter. The flag is displayed directly in the output listing without needing any other commands.'
      }
    ],
    learningSummary: {
      commandName: 'ls',
      purpose: 'List directory contents',
      syntax: 'ls [options] [path]',
      optionsIntroduced: [
        {
          option: '(no options)',
          explanation: 'Outputs the names of visible files and folders in alphabetical order.'
        }
      ],
      exampleUsage: 'ls',
      exampleOutput: 'Desktop  Documents  Downloads  Pictures  Projects  FLAG{FIRST_STEP_LS_DISCOVERY}',
      practicalApplication: 'Running "ls" is almost always the first action taken upon gaining access to a shell or entering a new folder to survey the environment.',
      commonMistakes: [
        'Typing "dir" out of Windows habit (while often aliased, "ls" is the POSIX standard).',
        'Expecting invisible (hidden) files to appear in standard listing.'
      ]
    }
  },

  {
    id: 'quest-02-follow-the-path',
    number: 2,
    title: 'Challenge 02 — Follow the Path',
    command: 'cd',
    difficulty: 'Beginner',
    category: 'Directory Navigation',
    points: 10,
    estimatedMinutes: 3,
    startingDirectory: '/home/student',
    mission: 'You discovered the contents of your home directory. Another directory contains your next clue. Navigate to the correct location and retrieve the flag.',
    objective: 'Change your working directory into "quest_chamber" using cd to reveal the navigation clue.',
    tags: ['cd', 'paths', 'navigation'],
    flag: 'FLAG{CD_PATH_NAVIGATOR_FOUND}',
    badge: 'Pathfinder',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'In Linux, moving between directories is accomplished with the change directory command.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The command is "cd" followed by the name of the destination directory. Check the directories you saw earlier.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "cd quest_chamber". Notice how directory navigation outputs the chamber discovery message with your flag.'
      }
    ],
    learningSummary: {
      commandName: 'cd',
      purpose: 'Change the current working directory',
      syntax: 'cd [directory]',
      optionsIntroduced: [
        {
          option: 'cd <dir>',
          explanation: 'Moves the shell process context into the specified directory path.'
        },
        {
          option: 'cd ..',
          explanation: 'Moves up one level to the parent directory.'
        },
        {
          option: 'cd ~ (or cd alone)',
          explanation: 'Returns directly to the active user\'s home directory.'
        }
      ],
      exampleUsage: 'cd quest_chamber',
      exampleOutput: '[Directory Navigation] Clue Discovered: FLAG{CD_PATH_NAVIGATOR_FOUND}',
      practicalApplication: 'Navigating folder trees allows you to inspect deep configuration paths (/etc), logs (/var/log), and staging areas (/tmp).',
      commonMistakes: [
        'Forgetting the space between "cd" and the directory name (e.g. typing "cd.." instead of "cd ..").',
        'Assuming directory names are case-insensitive (Linux paths are strictly case-sensitive).'
      ]
    }
  },

  {
    id: 'quest-03-the-invisible-file',
    number: 3,
    title: 'Challenge 03 — The Invisible File',
    command: 'ls -a',
    difficulty: 'Beginner',
    category: 'File Discovery',
    points: 10,
    estimatedMinutes: 3,
    startingDirectory: '/home/student/Documents',
    mission: 'You have entered the Documents directory. Something is hidden here, and a normal directory listing will not reveal everything. Discover the hidden file and retrieve its flag.',
    objective: 'Reveal hidden files starting with a dot (.) using the all flag of the directory listing command.',
    tags: ['ls', 'hidden files', 'flags'],
    flag: 'FLAG{HIDDEN_IN_PLAIN_SIGHT_LSA}',
    badge: 'Hidden File Hunter',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'In Linux, files that start with a period (.) are concealed from standard listings to avoid clutter.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'Commands support option flags preceded by a hyphen. Look for the flag that stands for "all".'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "ls -a". Look closely at the filenames that begin with a dot (.) in the output.'
      }
    ],
    learningSummary: {
      commandName: 'ls -a',
      purpose: 'List all directory entries, including hidden files',
      syntax: 'ls -a [path]',
      optionsIntroduced: [
        {
          option: '-a (--all)',
          explanation: 'Prevents filtering out entries starting with a dot (.), revealing hidden configuration files and directories.'
        }
      ],
      exampleUsage: 'ls -a',
      exampleOutput: '.  ..  .FLAG{HIDDEN_IN_PLAIN_SIGHT_LSA}  audit_log.txt  pentest_notes.txt',
      practicalApplication: 'Threat actors and system software frequently hide tools, keys, and persistence scripts in dotfiles (e.g. .bashrc, .ssh, .config).',
      commonMistakes: [
        'Confusing . (current directory) and .. (parent directory) with actual hidden files.',
        'Believing hidden files in Linux are encrypted or have a special file attribute like in Windows (in Linux, a leading dot is all that hides a file).'
      ]
    }
  },

  {
    id: 'quest-04-detailed-investigation',
    number: 4,
    title: 'Challenge 04 — Detailed Investigation',
    command: 'ls -l',
    difficulty: 'Beginner',
    category: 'Metadata Analysis',
    points: 10,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Documents',
    mission: 'Detailed directory listings reveal vital file metadata that filenames alone do not show: permissions, owners, groups, file sizes, and timestamps. Inspect the directory with a detailed list format to analyze metadata and retrieve the flag.',
    objective: 'Run a detailed long listing (ls -l) to inspect file metadata and locate the target file with the distinct 1337-byte size.',
    tags: ['ls', 'long listing', 'metadata', 'permissions'],
    flag: 'FLAG{METADATA_INSPECTOR_LSL}',
    badge: 'Metadata Inspector',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Filenames alone don\'t tell you file sizes, who owns a file, or its creation timestamp.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The "-l" option requests the long listing format, presenting file properties in structured columns.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "ls -l". Inspect the size and filename columns to find the 1337-byte anomaly holding your flag.'
      }
    ],
    learningSummary: {
      commandName: 'ls -l',
      purpose: 'List directory contents in long format with complete metadata',
      syntax: 'ls -l [path]',
      optionsIntroduced: [
        {
          option: '-l',
          explanation: 'Displays detailed metadata in columns: [type & permissions] [links] [owner] [group] [byte size] [last modified] [filename].'
        }
      ],
      exampleUsage: 'ls -l',
      exampleOutput: '-rw-r--r-- 1 student student 1337 Nov 18 10:00 FLAG{METADATA_INSPECTOR_LSL}',
      practicalApplication: 'Auditing file permissions and sizes is the core foundation for security triage, detecting abnormal binary modifications, and identifying privilege boundaries.',
      commonMistakes: [
        'Confusing the letter "l" with the digit "1". Always use lowercase "l" for long format.',
        'Misinterpreting the 5th column: by default, it represents size in exact raw bytes, not kilobytes.'
      ]
    }
  },

  {
    id: 'quest-05-the-hidden-combination',
    number: 5,
    title: 'Challenge 05 — The Hidden Combination',
    command: 'ls -la',
    difficulty: 'Beginner',
    category: 'Command Composition',
    points: 10,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Projects',
    mission: 'In Linux, options can be combined into a single command flag. A critical hidden file with detailed permissions is concealed in Projects. Discover the hidden file and examine its details using a single combined command.',
    objective: 'Combine the long format (-l) and all files (-a) options into a single command (ls -la) to inspect hidden files with metadata.',
    tags: ['ls', 'combined options', 'hidden files'],
    flag: 'FLAG{COMBINED_OPTIONS_POWER_LSLA}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'You previously used "-l" for detailed views and "-a" for hidden files. Now combine them.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'Single-letter flags can be concatenated together after one hyphen (e.g. -la or -al).'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "ls -la" (or "ls -al") to list all files, including hidden ones, in full metadata detail.'
      }
    ],
    learningSummary: {
      commandName: 'ls -la',
      purpose: 'Combine options to show all entries (including hidden) in detailed long format',
      syntax: 'ls -la [path] (or ls -l -a, ls -al)',
      optionsIntroduced: [
        {
          option: '-la (or -al)',
          explanation: 'Stacks the -l (long format) and -a (all files) options together in a single compact flag.'
        }
      ],
      exampleUsage: 'ls -la',
      exampleOutput: '-rwxr-xr-x 1 student student 2048 Nov 18 10:30 .FLAG{COMBINED_OPTIONS_POWER_LSLA}',
      practicalApplication: 'Sysadmins and penetration testers run "ls -la" routinely to check permissions on user home folders and hidden ssh / configuration directories.',
      commonMistakes: [
        'Thinking that option order matters (e.g. thinking "-la" is different from "-al" — both are identical).',
        'Forgetting that flags must be preceded by a dash (-).'
      ]
    }
  },

  {
    id: 'quest-06-where-am-i',
    number: 6,
    title: 'Challenge 06 — Where Am I?',
    command: 'pwd',
    difficulty: 'Beginner',
    category: 'Directory Navigation',
    points: 10,
    estimatedMinutes: 2,
    startingDirectory: '/home/student/Projects/checkpoint_FLAG{PWD_LOCATION_CONFIRMED}',
    mission: 'When exploring deep directory structures, you frequently need to confirm your exact absolute path. Verify your present working directory to retrieve the path-based flag.',
    objective: 'Print your current working directory to retrieve the flag embedded in your path.',
    tags: ['pwd', 'absolute path', 'environment'],
    flag: 'FLAG{PWD_LOCATION_CONFIRMED}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Find a command that prints your full location from the system root.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The acronym stands for "Print Working Directory".'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "pwd" in your terminal. Look at the directory name printed at the end of the path.'
      }
    ],
    learningSummary: {
      commandName: 'pwd',
      purpose: 'Print the current/working directory full path name',
      syntax: 'pwd [-L | -P]',
      optionsIntroduced: [
        {
          option: '(no options)',
          explanation: 'Outputs the absolute path from the root (/) to the current directory.'
        },
        {
          option: '-P',
          explanation: 'Resolves physical paths without following symbolic links.'
        }
      ],
      exampleUsage: 'pwd',
      exampleOutput: '/home/student/Projects/checkpoint_FLAG{PWD_LOCATION_CONFIRMED}',
      practicalApplication: 'Essential when scripting, confirming installation targets, and documenting evidence locations during investigations.',
      commonMistakes: [
        'Confusing relative paths (like "./Documents") with absolute paths starting with "/".',
        'Assuming ~ is an actual directory name on the disk (it is an alias shell variable for $HOME).'
      ]
    }
  },

  // =========================================================================
  // 2. EASY CHALLENGES (Reading, file creation, file manipulation)
  // =========================================================================
  {
    id: 'quest-07-reading-the-message',
    number: 7,
    title: 'Challenge 07 — Reading the Message',
    command: 'cat',
    difficulty: 'Easy',
    category: 'File Operations',
    points: 20,
    estimatedMinutes: 3,
    startingDirectory: '/home/student/Documents',
    mission: 'A confidential memo was dropped in the Documents directory. You cannot see its inner contents from the directory listing alone. Read the file to retrieve the secret flag.',
    objective: 'Display the contents of "confidential_memo.txt" using cat.',
    tags: ['cat', 'reading files', 'output'],
    flag: 'FLAG{CAT_FILE_READER_SUCCESS}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Listing files only shows names; you need a tool that dumps text file contents directly to the screen.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The command is named after "concatenate". Provide the filename as the argument.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "cat confidential_memo.txt" to print the document contents.'
      }
    ],
    learningSummary: {
      commandName: 'cat',
      purpose: 'Concatenate and display file contents to standard output',
      syntax: 'cat [options] [file...]',
      optionsIntroduced: [
        {
          option: '-n',
          explanation: 'Numbers all output lines starting from 1.'
        },
        {
          option: '-b',
          explanation: 'Numbers only non-blank output lines.'
        }
      ],
      exampleUsage: 'cat confidential_memo.txt',
      exampleOutput: 'Attention Agent: Here is your security flag: FLAG{CAT_FILE_READER_SUCCESS}',
      practicalApplication: 'Quickly inspecting configuration files, reading scripts, and piping data into filtering utilities.',
      commonMistakes: [
        'Using "cat" on huge multi-gigabyte log files (which floods the terminal; use "less", "head", or "tail" instead).',
        'Running "cat" on binary files (which outputs garbage characters and can distort terminal settings).'
      ]
    }
  },

  {
    id: 'quest-08-creating-the-signal',
    number: 8,
    title: 'Challenge 08 — Creating the Signal',
    command: 'touch',
    difficulty: 'Easy',
    category: 'File Operations',
    points: 20,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Documents',
    mission: 'A monitoring system expects an activation signal file named "activate.sig" to be created in your directory. Read the signal beacon instructions, create the file, and retrieve the flag.',
    objective: 'Use touch to create "activate.sig" and verify the signal beacon instructions.',
    tags: ['touch', 'file creation', 'timestamps'],
    flag: 'FLAG{TOUCH_FILE_CREATOR_SIGNAL}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'First read "signal_beacon.txt" to understand the signal protocol.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'In Linux, "touch" is used to create empty files or update timestamps without modifying contents.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "cat signal_beacon.txt" for the flag, and run "touch activate.sig" to generate the required file.'
      }
    ],
    learningSummary: {
      commandName: 'touch',
      purpose: 'Create empty files or update file access and modification timestamps',
      syntax: 'touch [options] file...',
      optionsIntroduced: [
        {
          option: 'touch <file>',
          explanation: 'If the file does not exist, an empty file is created. If it exists, its mtime/atime are updated to current time.'
        },
        {
          option: '-a',
          explanation: 'Change only the access time (atime).'
        },
        {
          option: '-m',
          explanation: 'Change only the modification time (mtime).'
        }
      ],
      exampleUsage: 'touch activate.sig',
      exampleOutput: '(Creates activate.sig with 0 bytes)',
      practicalApplication: 'Lockfile creation, timestamp alteration (timestomping analysis in forensics), and initializing blank template files.',
      commonMistakes: [
        'Assuming touch can write text into a file (touch only creates empty files or touches timestamps; use echo or a text editor to write content).'
      ]
    }
  },

  {
    id: 'quest-09-building-the-archive',
    number: 9,
    title: 'Challenge 09 — Building the Archive',
    command: 'mkdir',
    difficulty: 'Easy',
    category: 'Directory Operations',
    points: 20,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Projects',
    mission: 'Organizing your workspace is fundamental in Linux. The system requires an archive directory structure named "archive/backups" with nested folders. Read mission_archive.txt and create the directory hierarchy.',
    objective: 'Inspect "mission_archive.txt" and use mkdir -p to create nested parent and child directories.',
    tags: ['mkdir', 'directories', 'nested paths'],
    flag: 'FLAG{MKDIR_NESTED_DIRS_SUCCESS}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Read "mission_archive.txt" using cat to get the mission directive and flag.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'When creating nested folders where the parent doesn\'t exist yet, standard mkdir fails unless you pass a flag.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'The flag "-p" creates intermediate parent directories as needed: run "mkdir -p archive/backups".'
      }
    ],
    learningSummary: {
      commandName: 'mkdir',
      purpose: 'Create directories on the filesystem',
      syntax: 'mkdir [options] directory...',
      optionsIntroduced: [
        {
          option: '-p (--parents)',
          explanation: 'Creates parent directories as needed without failing if intermediate directories do not exist.'
        },
        {
          option: '-m',
          explanation: 'Sets file mode / permissions directly during creation (e.g. mkdir -m 700 secret).'
        }
      ],
      exampleUsage: 'mkdir -p archive/backups',
      exampleOutput: '(Creates archive/ and archive/backups/ in one command)',
      practicalApplication: 'Setting up project hierarchies, staging folders for forensic evidence, and script workspaces.',
      commonMistakes: [
        'Running "mkdir dir1/dir2" without "-p", which produces "No such file or directory" error if dir1 does not exist.'
      ]
    }
  },

  {
    id: 'quest-10-making-a-backup',
    number: 10,
    title: 'Challenge 10 — Making a Backup',
    command: 'cp',
    difficulty: 'Easy',
    category: 'File Operations',
    points: 20,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Documents',
    mission: 'Before modifying critical files, administrators always create backups. Inspect "database.conf" to find the backup directive and retrieve the configuration flag.',
    objective: 'Read database.conf to retrieve the flag, and practice creating a copy database.conf.bak using cp.',
    tags: ['cp', 'copying', 'backup'],
    flag: 'FLAG{CP_BACKUP_SPECIALIST_READY}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Examine database.conf with cat to find the embedded flag.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The copy command "cp" requires two arguments: source path and destination path.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "cp database.conf database.conf.bak" to create the backup, and "cat database.conf" to read the flag.'
      }
    ],
    learningSummary: {
      commandName: 'cp',
      purpose: 'Copy files and directories',
      syntax: 'cp [options] source destination',
      optionsIntroduced: [
        {
          option: 'cp <src> <dest>',
          explanation: 'Duplicates the source file into the destination path.'
        },
        {
          option: '-r (or -R)',
          explanation: 'Recursively copies directories and their contents.'
        },
        {
          option: '-p',
          explanation: 'Preserves file mode, ownership, and timestamps.'
        }
      ],
      exampleUsage: 'cp database.conf database.conf.bak',
      exampleOutput: '(Creates identical copy database.conf.bak)',
      practicalApplication: 'Creating safety backups before altering system configs (/etc/nginx/nginx.conf.bak), duplicating artifacts for analysis.',
      commonMistakes: [
        'Attempting to copy a directory without the "-r" flag, which fails with "omitting directory".',
        'Accidentally overwriting an existing destination file (use "-i" for interactive confirmation prompt).'
      ]
    }
  },

  {
    id: 'quest-11-relocating-assets',
    number: 11,
    title: 'Challenge 11 — Relocating Assets',
    command: 'mv',
    difficulty: 'Easy',
    category: 'File Operations',
    points: 20,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Projects',
    mission: 'A misplaced artifact named "temp_clue.dat" needs to be relocated and renamed into "final_clue.txt". Read the artifact to extract the flag.',
    objective: 'Read temp_clue.dat to uncover the flag, and use mv to rename/move it to final_clue.txt.',
    tags: ['mv', 'moving', 'renaming'],
    flag: 'FLAG{MV_RELOCATE_AND_RENAME}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'First read temp_clue.dat with cat to find your flag.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'In Linux, "mv" handles both moving a file to a new folder AND renaming a file.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "mv temp_clue.dat final_clue.txt" to perform the rename operation.'
      }
    ],
    learningSummary: {
      commandName: 'mv',
      purpose: 'Move (rename) files and directories',
      syntax: 'mv [options] source destination',
      optionsIntroduced: [
        {
          option: 'mv <source> <target>',
          explanation: 'Moves the file or directory to a new path. If in the same directory, it effectively renames it.'
        },
        {
          option: '-i',
          explanation: 'Prompt before overwriting an existing file.'
        },
        {
          option: '-n',
          explanation: 'Do not overwrite an existing file.'
        }
      ],
      exampleUsage: 'mv temp_clue.dat final_clue.txt',
      exampleOutput: '(Renames temp_clue.dat to final_clue.txt in place)',
      practicalApplication: 'Moving payloads into target directories, renaming exfiltrated logs, organizing evidence bins.',
      commonMistakes: [
        'Accidentally moving a file into a directory without specifying the desired new name.',
        'Overwriting a file without warning when destination already exists.'
      ]
    }
  },

  {
    id: 'quest-12-cleaning-up-traces',
    number: 12,
    title: 'Challenge 12 — Cleaning Up Traces',
    command: 'rm',
    difficulty: 'Easy',
    category: 'File Operations',
    points: 20,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Downloads',
    mission: 'A decoy malicious script "malware_sample.sh" was quarantined. Read the disposal instructions in "disposal_guide.txt" for authorization clearance and remove the quarantined sample.',
    objective: 'Read disposal_guide.txt to obtain the flag, then safely delete malware_sample.sh using rm.',
    tags: ['rm', 'file deletion', 'cleanup'],
    flag: 'FLAG{RM_CLEANUP_CERTIFIED}',
    badge: 'File Operator',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Check disposal_guide.txt using cat to find the clearance flag.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The "rm" command permanently removes files from the filesystem. There is no Trash bin in standard command line.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "rm malware_sample.sh" to delete the sample.'
      }
    ],
    learningSummary: {
      commandName: 'rm',
      purpose: 'Remove files or directories',
      syntax: 'rm [options] file...',
      optionsIntroduced: [
        {
          option: 'rm <file>',
          explanation: 'Permanently deletes the file unlinking it from the directory.'
        },
        {
          option: '-r (or -R)',
          explanation: 'Recursively remove directories and their contents.'
        },
        {
          option: '-f',
          explanation: 'Force removal without prompting or reporting non-existent files.'
        }
      ],
      exampleUsage: 'rm malware_sample.sh',
      exampleOutput: '(Permanently removes the file)',
      practicalApplication: 'Cleaning temporary payloads, removing outdated log rotations, and securely disposing quarantined samples.',
      commonMistakes: [
        'Dangerous command: "rm -rf /" or "rm -rf *" in the wrong directory can erase entire systems without confirmation.',
        'Assuming rm can be undone like dragging to a desktop trash can.'
      ]
    }
  },

  // =========================================================================
  // 3. INTERMEDIATE CHALLENGES (Inspection, search, filtering, text analysis)
  // =========================================================================
  {
    id: 'quest-13-mystery-formats',
    number: 13,
    title: 'Challenge 13 — Mystery Formats',
    command: 'file',
    difficulty: 'Intermediate',
    category: 'File Inspection',
    points: 30,
    estimatedMinutes: 5,
    startingDirectory: '/home/student/Downloads',
    mission: 'In Linux, file extensions like .txt or .png can be deceiving. A file named "mystery_asset" has no extension. Determine its actual MIME/file type using file to uncover its hidden identity.',
    objective: 'Run "file mystery_asset" to inspect its header magic bytes and read its classification.',
    tags: ['file', 'magic bytes', 'file types'],
    flag: 'FLAG{FILE_TYPE_MAGIC_DETECTIVE}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Linux does not rely on extensions like .exe or .txt; it identifies files by inspecting header magic bytes.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The command is literally called "file". Pass the target filename to it.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "file mystery_asset". The output will tell you the file type and output the detective flag.'
      }
    ],
    learningSummary: {
      commandName: 'file',
      purpose: 'Determine file type using magic numbers and file signatures',
      syntax: 'file [options] [file...]',
      optionsIntroduced: [
        {
          option: 'file <file>',
          explanation: 'Reads magic numbers from the file header to determine real MIME type regardless of extension.'
        },
        {
          option: '-b',
          explanation: 'Brief mode; does not prepend the filename to output lines.'
        },
        {
          option: '-i',
          explanation: 'Outputs standard MIME type strings (e.g. text/plain; charset=utf-8).'
        }
      ],
      exampleUsage: 'file mystery_asset',
      exampleOutput: 'mystery_asset: ASCII text, with flag FLAG{FILE_TYPE_MAGIC_DETECTIVE}',
      practicalApplication: 'Malware analysis: attackers often rename executable ELF binaries to .jpg or .png to bypass superficial filters.',
      commonMistakes: [
        'Assuming changing a file\'s extension changes how Linux interprets it.'
      ]
    }
  },

  {
    id: 'quest-14-deep-metadata-audit',
    number: 14,
    title: 'Challenge 14 — Deep Metadata Audit',
    command: 'stat',
    difficulty: 'Intermediate',
    category: 'Forensics & Metadata',
    points: 30,
    estimatedMinutes: 5,
    startingDirectory: '/home/student/Documents',
    mission: 'When "ls -l" is not detailed enough, stat provides comprehensive inode, exact access/modify/change timestamps, and octal permission breakdown. Inspect "evidence.bin" with stat.',
    objective: 'Run "stat evidence.bin" to view complete inode and timestamp forensics and retrieve the flag.',
    tags: ['stat', 'inodes', 'atime', 'mtime', 'ctime'],
    flag: 'FLAG{STAT_METADATA_DEEP_DIVE}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Find a command that displays file status (stat).'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The "stat" utility prints inode numbers, device IDs, IO blocks, and timestamps down to seconds.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "stat evidence.bin" in your terminal. Check the status report output.'
      }
    ],
    learningSummary: {
      commandName: 'stat',
      purpose: 'Display file or filesystem status and deep metadata',
      syntax: 'stat [options] file...',
      optionsIntroduced: [
        {
          option: 'stat <file>',
          explanation: 'Dumps complete inode metadata: Device, Inode, Links, Access (octal permissions), Uid, Gid, and Access/Modify/Change timestamps.'
        },
        {
          option: '-c',
          explanation: 'Use specified format string instead of default output.'
        }
      ],
      exampleUsage: 'stat evidence.bin',
      exampleOutput: 'File: evidence.bin\nSize: 76  Blocks: 1  IO Block: 4096  regular file\nDevice: 801h/2049d  Inode: 133701 ... FLAG{STAT_METADATA_DEEP_DIVE}',
      practicalApplication: 'Digital forensics: analyzing MACB (Modified, Accessed, Changed, Birth) timestamps to reconstruct incident timelines.',
      commonMistakes: [
        'Confusing mtime (when file contents changed) with ctime (when metadata or permissions changed).'
      ]
    }
  },

  {
    id: 'quest-15-the-needle-in-the-system',
    number: 15,
    title: 'Challenge 15 — The Needle in the System',
    command: 'find',
    difficulty: 'Intermediate',
    category: 'Search & Discovery',
    points: 30,
    estimatedMinutes: 5,
    startingDirectory: '/home/student',
    mission: 'A flag file named "flag_treasure.txt" was lost somewhere deep within the system hierarchy. Searching folder by folder is impossible. Locate it with a single find search.',
    objective: 'Use find to search recursively for "flag_treasure.txt" and read its contents.',
    tags: ['find', 'search', 'recursion'],
    flag: 'FLAG{FIND_SEARCH_MASTER_DISCOVERED}',
    badge: 'Search Specialist',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'The "find" utility walks the filesystem tree starting from any directory you designate.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'To search by name, use the "-name" predicate followed by the filename in quotes.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "find . -name flag_treasure.txt" (or "find /home/student -name flag_treasure.txt"), then use "cat" on the discovered path.'
      }
    ],
    learningSummary: {
      commandName: 'find',
      purpose: 'Search for files in a directory hierarchy based on arbitrary criteria',
      syntax: 'find [starting-point...] [expression]',
      optionsIntroduced: [
        {
          option: '-name <pattern>',
          explanation: 'Matches filenames against a shell glob pattern (e.g. -name "*.txt").'
        },
        {
          option: '-type <f|d|l>',
          explanation: 'Filters search by entry type (f for regular file, d for directory, l for symbolic link).'
        },
        {
          option: '-perm',
          explanation: 'Finds files matching specific permission bits (e.g. -perm -4000 for SUID files).'
        }
      ],
      exampleUsage: 'find /home/student -name "flag_treasure.txt"',
      exampleOutput: '/home/student/Projects/archive/backups/flag_treasure.txt',
      practicalApplication: 'Hunting for sensitive configuration files, SUID privilege escalation binaries, and modified web shells.',
      commonMistakes: [
        'Omitting the starting path (e.g. typing "find -name test.txt" instead of "find . -name test.txt").',
        'Not quoting wildcards (e.g. typing "find . -name *.log" instead of "find . -name \'*.log\'"), which causes shell expansion issues.'
      ]
    }
  },

  {
    id: 'quest-16-log-pattern-hunter',
    number: 16,
    title: 'Challenge 16 — Log Pattern Hunter',
    command: 'grep',
    difficulty: 'Intermediate',
    category: 'Pattern Matching & Search',
    points: 30,
    estimatedMinutes: 5,
    startingDirectory: '/home/student',
    mission: 'A massive authentication log file /var/log/auth.log contains thousands of lines. Somewhere inside is a security alert containing the keyword "SECURITY_FLAG". Extract the matching line.',
    objective: 'Use grep to search /var/log/auth.log for the pattern "SECURITY_FLAG".',
    tags: ['grep', 'logs', 'regular expressions', 'filtering'],
    flag: 'FLAG{GREP_LOG_HUNTER_REGEX}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'You need a search utility that scans inside file contents for matching text patterns.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The command "grep" takes a pattern and one or more target files.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "grep SECURITY_FLAG /var/log/auth.log" to filter and display the alert line.'
      }
    ],
    learningSummary: {
      commandName: 'grep',
      purpose: 'Print lines matching a pattern or regular expression',
      syntax: 'grep [options] pattern [file...]',
      optionsIntroduced: [
        {
          option: '-i (--ignore-case)',
          explanation: 'Ignore case distinctions in patterns and input data.'
        },
        {
          option: '-n (--line-number)',
          explanation: 'Prefix each line of output with its 1-based line number within its input file.'
        },
        {
          option: '-v (--invert-match)',
          explanation: 'Inverts the sense of matching, selecting non-matching lines.'
        },
        {
          option: '-r (--recursive)',
          explanation: 'Read all files under each directory recursively.'
        }
      ],
      exampleUsage: 'grep SECURITY_FLAG /var/log/auth.log',
      exampleOutput: 'Nov 18 09:22:15 cyberlinux sshd[2841]: SECURITY_FLAG: FLAG{GREP_LOG_HUNTER_REGEX}',
      practicalApplication: 'Searching logs for failed logins, finding hardcoded API keys in source repositories, and isolating threat indicators.',
      commonMistakes: [
        'Swapping pattern and filename arguments: grep syntax is always "grep PATTERN FILE".',
        'Not using "-i" when the casing of the target keyword is uncertain.'
      ]
    }
  },

  {
    id: 'quest-17-the-opening-lines',
    number: 17,
    title: 'Challenge 17 — The Opening Lines',
    command: 'head',
    difficulty: 'Intermediate',
    category: 'Text Processing',
    points: 30,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Documents',
    mission: 'A huge database dump file "giant_dataset.csv" contains over 1,000 lines. Reading the entire file with cat floods your terminal. Inspect only the top 5 lines to retrieve the header flag.',
    objective: 'Use head -n 5 giant_dataset.csv to extract the flag in the header record.',
    tags: ['head', 'text processing', 'csv'],
    flag: 'FLAG{HEAD_TOP_LINES_EXTRACTED}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Use a command specifically built to view the beginning/head of files.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'By default, "head" prints the first 10 lines. You can specify custom line counts with "-n".'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "head -n 5 giant_dataset.csv" to see the top 5 lines and find the flag.'
      }
    ],
    learningSummary: {
      commandName: 'head',
      purpose: 'Output the first part (lines or bytes) of files',
      syntax: 'head [options] [file...]',
      optionsIntroduced: [
        {
          option: '(default)',
          explanation: 'Outputs the first 10 lines of each file.'
        },
        {
          option: '-n <count>',
          explanation: 'Prints the specified number of lines instead of the default 10.'
        },
        {
          option: '-c <bytes>',
          explanation: 'Prints the first N bytes of the file.'
        }
      ],
      exampleUsage: 'head -n 5 giant_dataset.csv',
      exampleOutput: '# HEADER_RECORD,FLAG{HEAD_TOP_LINES_EXTRACTED},DATA_SOURCE',
      practicalApplication: 'Checking CSV column structures, reading magic file headers, and previewing voluminous configuration dumps.',
      commonMistakes: [
        'Using "cat" on multi-gigabyte files when you only need to inspect headers.'
      ]
    }
  },

  {
    id: 'quest-18-the-final-clue',
    number: 18,
    title: 'Challenge 18 — The Final Clue',
    command: 'tail',
    difficulty: 'Intermediate',
    category: 'Text Processing',
    points: 30,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Documents',
    mission: 'A streaming server log file "server_stream.log" records continuous telemetry. The incident occurred right at the very end. View the last lines of the file to recover the trailing flag.',
    objective: 'Use tail to view the end of "server_stream.log" and retrieve the trailing flag.',
    tags: ['tail', 'logs', 'telemetry'],
    flag: 'FLAG{TAIL_LOG_STREAM_MONITOR}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'If "head" views the beginning, its counterpart views the opposite end.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The "tail" command outputs the last lines of a file.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "tail -n 5 server_stream.log" to inspect the concluding lines of the file.'
      }
    ],
    learningSummary: {
      commandName: 'tail',
      purpose: 'Output the last part of files',
      syntax: 'tail [options] [file...]',
      optionsIntroduced: [
        {
          option: '(default)',
          explanation: 'Outputs the last 10 lines of each file.'
        },
        {
          option: '-n <count>',
          explanation: 'Outputs the last N lines instead of the default 10.'
        },
        {
          option: '-f (--follow)',
          explanation: 'Outputs appended data in real-time as the file grows (live log monitoring).'
        }
      ],
      exampleUsage: 'tail -n 5 server_stream.log',
      exampleOutput: '[STREAM_END] Incident captured in trailing packet: FLAG{TAIL_LOG_STREAM_MONITOR}',
      practicalApplication: 'Monitoring real-time web server logs (tail -f /var/log/nginx/access.log) to observe live attacks as they occur.',
      commonMistakes: [
        'Forgetting that "tail -f" keeps running indefinitely until terminated with Ctrl+C.'
      ]
    }
  },

  {
    id: 'quest-19-paging-through-history',
    number: 19,
    title: 'Challenge 19 — Paging Through History',
    command: 'less',
    difficulty: 'Intermediate',
    category: 'Text Processing',
    points: 30,
    estimatedMinutes: 5,
    startingDirectory: '/home/student/Documents',
    mission: 'When files are too long for one terminal screen, a pager allows navigating forward and backward interactively. Inspect "system_history.txt" using less to locate the embedded flag.',
    objective: 'View "system_history.txt" with less and retrieve the flag.',
    tags: ['less', 'pager', 'navigation'],
    flag: 'FLAG{LESS_PAGER_NAVIGATOR}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'A terminal pager allows you to scroll through text one screen at a time.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The popular pager utility is called "less" (as the adage goes: "less is more").'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "less system_history.txt". Navigate through the file or search for the flag.'
      }
    ],
    learningSummary: {
      commandName: 'less',
      purpose: 'Opposite of more: an interactive terminal pager allowing forward and backward movement',
      syntax: 'less [options] file',
      optionsIntroduced: [
        {
          option: 'less <file>',
          explanation: 'Opens file in paginated screen viewer.'
        },
        {
          option: '-N',
          explanation: 'Displays line numbers alongside each text line.'
        }
      ],
      exampleUsage: 'less system_history.txt',
      exampleOutput: 'System Historical Timeline ... Flag: FLAG{LESS_PAGER_NAVIGATOR}',
      practicalApplication: 'Reading lengthy manual pages (man pages use less as their default pager) and auditing system logs without terminal overflow.',
      commonMistakes: [
        'Not knowing how to exit: press "q" to quit less and return to the shell.'
      ]
    }
  },

  {
    id: 'quest-20-word-byte-count',
    number: 20,
    title: 'Challenge 20 — Word & Byte Count',
    command: 'wc',
    difficulty: 'Intermediate',
    category: 'Text Processing',
    points: 30,
    estimatedMinutes: 4,
    startingDirectory: '/home/student/Documents',
    mission: 'Forensic investigators verify file integrity by checking exact line, word, and character counts. Run wc on "packet_dump.txt" to inspect counts and read the verification flag.',
    objective: 'Run wc packet_dump.txt to inspect metrics, and read the flag inside the integrity record.',
    tags: ['wc', 'line count', 'integrity', 'word count'],
    flag: 'FLAG{WC_WORD_LINE_COUNTER}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'The "word count" utility counts lines, words, and byte lengths.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The command is "wc". You can also read packet_dump.txt with cat to confirm the verification flag.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "wc packet_dump.txt", then "cat packet_dump.txt" to read the integrity flag.'
      }
    ],
    learningSummary: {
      commandName: 'wc',
      purpose: 'Print newline, word, and byte counts for each file',
      syntax: 'wc [options] [file...]',
      optionsIntroduced: [
        {
          option: '-l (--lines)',
          explanation: 'Prints only the newline count.'
        },
        {
          option: '-w (--words)',
          explanation: 'Prints only the word count.'
        },
        {
          option: '-c (--bytes)',
          explanation: 'Prints only the raw byte count.'
        }
      ],
      exampleUsage: 'wc packet_dump.txt',
      exampleOutput: '  2  12  78 packet_dump.txt',
      practicalApplication: 'Counting items in pipelines (e.g. ps aux | wc -l to count active processes, or cat wordlist.txt | wc -l).',
      commonMistakes: [
        'Forgetting that "wc -l" counts newline characters (\\n), so a file missing a final newline at the last line may report N-1.'
      ]
    }
  },

  // =========================================================================
  // 4. ADVANCED CHALLENGES (Permissions, ownership, pipes, processes)
  // =========================================================================
  {
    id: 'quest-21-the-forbidden-vault',
    number: 21,
    title: 'Challenge 21 — The Forbidden Vault',
    command: 'chmod',
    difficulty: 'Advanced',
    category: 'Permissions & Security',
    points: 50,
    estimatedMinutes: 6,
    startingDirectory: '/home/student/Projects',
    mission: 'A secured script "vault_unlocker.sh" exists in your directory, but its execution permission is turned off (rw-r--r--). You cannot execute it. Modify its permissions with chmod +x or chmod 755 and run it to unlock the vault.',
    objective: 'Make vault_unlocker.sh executable with chmod +x and execute ./vault_unlocker.sh to reveal the flag.',
    tags: ['chmod', 'execute permission', 'octal', 'scripts'],
    flag: 'FLAG{CHMOD_PERMISSIONS_MASTER_755}',
    badge: 'Permission Investigator',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Try executing the script: "./vault_unlocker.sh". Notice the "Permission denied" error.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'In Linux, files need the "x" (execute) permission bit to be launched as programs.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "chmod +x vault_unlocker.sh" (or "chmod 755 vault_unlocker.sh"), then execute "./vault_unlocker.sh".'
      }
    ],
    learningSummary: {
      commandName: 'chmod',
      purpose: 'Change file mode bits / permissions',
      syntax: 'chmod [options] mode file...',
      optionsIntroduced: [
        {
          option: 'chmod +x <file>',
          explanation: 'Grants execute permission to user, group, and others.'
        },
        {
          option: 'chmod 755 <file>',
          explanation: 'Sets rwxr-xr-x using octal (4=read, 2=write, 1=execute; 7=rwx, 5=r-x).'
        },
        {
          option: 'chmod 600 <file>',
          explanation: 'Restricts file to read and write by owner only (used for SSH private keys).'
        }
      ],
      exampleUsage: 'chmod +x vault_unlocker.sh && ./vault_unlocker.sh',
      exampleOutput: 'Vault Unlocked! Secret Flag: FLAG{CHMOD_PERMISSIONS_MASTER_755}',
      practicalApplication: 'Hardening sensitive configuration files (chmod 600 id_rsa) and deploying executable security tools.',
      commonMistakes: [
        'Setting overly permissive modes like "chmod 777" on production servers, giving anyone write access.',
        'Forgetting the "./" when running a script located in the current working directory.'
      ]
    }
  },

  {
    id: 'quest-22-transfer-of-ownership',
    number: 22,
    title: 'Challenge 22 — Transfer of Ownership',
    command: 'chown',
    difficulty: 'Advanced',
    category: 'Permissions & Security',
    points: 50,
    estimatedMinutes: 6,
    startingDirectory: '/home/student/Projects',
    mission: 'A restricted configuration file "service.conf" belongs to "root". Using administrative privileges (sudo chown), change its ownership to "student" so standard audits can process it.',
    objective: 'Change the owner of service.conf to student using sudo chown student service.conf, then read the flag.',
    tags: ['chown', 'ownership', 'sudo', 'users'],
    flag: 'FLAG{CHOWN_OWNERSHIP_TRANSFERRED}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Inspect "service.conf" with "ls -l" to observe that it is owned by root.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The "chown" (change owner) command requires superuser authority to reassign ownership.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "sudo chown student service.conf", then run "cat service.conf" to read the flag.'
      }
    ],
    learningSummary: {
      commandName: 'chown',
      purpose: 'Change file owner and group',
      syntax: 'chown [options] [owner][:[group]] file...',
      optionsIntroduced: [
        {
          option: 'chown user file',
          explanation: 'Transfers file ownership to the designated user.'
        },
        {
          option: 'chown user:group file',
          explanation: 'Simultaneously sets user owner and primary group.'
        },
        {
          option: '-R',
          explanation: 'Recursively changes ownership for directories and contents.'
        }
      ],
      exampleUsage: 'sudo chown student:student service.conf',
      exampleOutput: '(Transfers ownership to student)',
      practicalApplication: 'Configuring web server directory ownership (chown -R www-data:www-data /var/www/html) and restoring permissions after file migrations.',
      commonMistakes: [
        'Running chown as an unprivileged user (regular users cannot give away file ownership in standard Linux).'
      ]
    }
  },

  {
    id: 'quest-23-pipeline-reconnaissance',
    number: 23,
    title: 'Challenge 23 — Pipeline Reconnaissance',
    command: '| (Pipe) & grep',
    difficulty: 'Advanced',
    category: 'Pipes & Redirection',
    points: 50,
    estimatedMinutes: 6,
    startingDirectory: '/home/student',
    mission: 'Linux power lies in combining modular utilities with pipes (|). Pipe the output of cat /etc/passwd into grep to isolate the account containing "FLAG{" in its description.',
    objective: 'Combine cat and grep using a pipe (|) to search /etc/passwd: cat /etc/passwd | grep FLAG',
    tags: ['pipes', 'grep', 'redirection', 'passwd'],
    flag: 'FLAG{PIPE_REDIRECTION_CONDUIT}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'The pipe operator (|) takes stdout from the left command and streams it as stdin to the right command.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'Run "cat /etc/passwd", but stream its output directly into "grep FLAG".'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run: cat /etc/passwd | grep FLAG'
      }
    ],
    learningSummary: {
      commandName: '| (Pipe operator)',
      purpose: 'Conduit connecting standard output of one command to standard input of another',
      syntax: 'command1 | command2 [| command3...]',
      optionsIntroduced: [
        {
          option: 'cmd1 | cmd2',
          explanation: 'Streams stdout of cmd1 into stdin of cmd2 without writing intermediate files to disk.'
        },
        {
          option: '> file',
          explanation: 'Redirects stdout to a file, overwriting existing contents.'
        },
        {
          option: '>> file',
          explanation: 'Redirects stdout to a file, appending to existing contents.'
        }
      ],
      exampleUsage: 'cat /etc/passwd | grep FLAG',
      exampleOutput: '# flag_agent:x:1338:1338:FLAG{PIPE_REDIRECTION_CONDUIT}:/home/flag_agent:/bin/bash',
      practicalApplication: 'Building complex processing pipelines: ps aux | grep python | awk \'{print $2}\' | xargs kill -9',
      commonMistakes: [
        'Confusing the pipe (|) with logical OR (||).',
        'Confusing pipe (|) with file redirection (> or <).'
      ]
    }
  },

  {
    id: 'quest-24-rogue-process-interception',
    number: 24,
    title: 'Challenge 24 — Rogue Process Interception',
    command: 'ps & kill',
    difficulty: 'Advanced',
    category: 'Process Management',
    points: 50,
    estimatedMinutes: 7,
    startingDirectory: '/home/student',
    mission: 'A suspicious background crypto-mining script is consuming CPU cycles. Use ps aux to locate the rogue process PID and command line, terminate it with kill, and retrieve the flag.',
    objective: 'Run ps aux to inspect active processes, locate PID 1337 running miner_payload.py, and retrieve the flag in the command line.',
    tags: ['ps', 'kill', 'processes', 'signals'],
    flag: 'FLAG{PROCESS_HUNTER_KILL_SIGTERM}',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'The "ps" command lists active processes running in memory.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'The standard snapshot options "aux" show processes for all users, including background daemons.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Run "ps aux | grep miner" (or "ps aux"). Look at the command arguments for PID 1337, and terminate it with "kill 1337".'
      }
    ],
    learningSummary: {
      commandName: 'ps & kill',
      purpose: 'Inspect active processes and send termination signals',
      syntax: 'ps aux ; kill [-signal] PID',
      optionsIntroduced: [
        {
          option: 'ps aux',
          explanation: 'a=all users, u=user-oriented format, x=processes not attached to a terminal.'
        },
        {
          option: 'kill <pid>',
          explanation: 'Sends SIGTERM (signal 15) requesting graceful shutdown.'
        },
        {
          option: 'kill -9 <pid>',
          explanation: 'Sends SIGKILL (signal 9) for immediate unconditional termination by the kernel.'
        }
      ],
      exampleUsage: 'ps aux | grep miner ; kill 1337',
      exampleOutput: 'student 1337 78.4 4.2 ... python3 miner_payload.py --flag FLAG{PROCESS_HUNTER_KILL_SIGTERM}',
      practicalApplication: 'Detecting rogue miner scripts, identifying hung daemon services, and neutralizing backdoor connections.',
      commonMistakes: [
        'Attempting to kill a process by its name with "kill" (use "pkill" or "killall" for name-based termination, or pass the PID to kill).'
      ]
    }
  },

  // =========================================================================
  // 5. EXPERT CHALLENGES (Multi-step incident forensics)
  // =========================================================================
  {
    id: 'quest-25-the-intruders-trail',
    number: 25,
    title: 'Challenge 25 — The Intruder\'s Trail',
    command: 'Forensic Investigation',
    difficulty: 'Expert',
    category: 'Forensics & Incident Response',
    points: 100,
    estimatedMinutes: 10,
    startingDirectory: '/var/log',
    mission: 'An unknown attacker breached the server during the night. You must conduct a full incident response: 1) Search /var/log/auth.log for accepted sessions, 2) Identify the attacker\'s dropped staging directory in /tmp, 3) Inspect the hidden evidence file to recover the master incident flag.',
    objective: 'Reconstruct the attack: grep /var/log/auth.log for accepted sessions, navigate to /tmp/.backdoor_session, reveal the hidden report with ls -a, and read it with cat.',
    tags: ['forensics', 'incident response', 'auth.log', 'investigation', 'expert'],
    flag: 'FLAG{EXPERT_CYBER_INCIDENT_RESOLVED}',
    badge: 'Terminal Expert',
    hints: [
      {
        id: 1,
        title: 'Hint 1 — General Direction',
        text: 'Step 1: Check authentication logs in /var/log/auth.log for accepted connections or suspicious bash activity.'
      },
      {
        id: 2,
        title: 'Hint 2 — Linux Concept',
        text: 'Run "grep Accepted /var/log/auth.log" and check for mentions of "/tmp" in auth.log.'
      },
      {
        id: 3,
        title: 'Hint 3 — Specific Guidance',
        text: 'Notice the attacker staging area in "/tmp/.backdoor_session". Navigate there with "cd /tmp/.backdoor_session", run "ls -la" to see ".incident_report.txt", and read it with "cat".'
      }
    ],
    learningSummary: {
      commandName: 'Multi-Step Forensics Investigation',
      purpose: 'End-to-end incident investigation correlating logs, directory traversal, and artifact analysis',
      syntax: 'grep -> cd -> ls -la -> cat',
      optionsIntroduced: [
        {
          option: 'Incident Methodology',
          explanation: 'Correlate authentication timestamps (/var/log/auth.log), inspect temporary staging folders (/tmp), uncover concealed dotfiles (ls -a), and extract artifacts (cat).'
        }
      ],
      exampleUsage: 'grep "backdoor" /var/log/auth.log && cat /tmp/.backdoor_session/.incident_report.txt',
      exampleOutput: 'Master Incident Flag: FLAG{EXPERT_CYBER_INCIDENT_RESOLVED}',
      practicalApplication: 'Real-world digital forensics and incident response (DFIR) investigations into compromised enterprise hosts.',
      commonMistakes: [
        'Looking only in home directories: attackers almost invariably stage tools and persistence scripts in /tmp or /dev/shm.'
      ]
    }
  }
];

export const QUEST_BADGES = [
  {
    id: 'First Flag',
    name: 'First Flag',
    icon: '🚩',
    description: 'Solved Challenge 01 and retrieved your first Linux CTF flag using directory listing.',
    requirement: 'Complete Challenge 01'
  },
  {
    id: 'Pathfinder',
    name: 'Pathfinder',
    icon: '🧭',
    description: 'Mastered filesystem navigation and discovered path-based secrets using cd.',
    requirement: 'Complete Challenge 02'
  },
  {
    id: 'Hidden File Hunter',
    name: 'Hidden File Hunter',
    icon: '🕵️',
    description: 'Uncovered concealed dotfiles and hidden configurations using ls -a.',
    requirement: 'Complete Challenge 03'
  },
  {
    id: 'Metadata Inspector',
    name: 'Metadata Inspector',
    icon: '🔍',
    description: 'Interpreted detailed permissions, byte sizes, and timestamps using ls -l.',
    requirement: 'Complete Challenge 04'
  },
  {
    id: 'File Operator',
    name: 'File Operator',
    icon: '📁',
    description: 'Demonstrated mastery of core file manipulation: touch, mkdir, cp, mv, and rm.',
    requirement: 'Complete Challenge 12'
  },
  {
    id: 'Search Specialist',
    name: 'Search Specialist',
    icon: '🔎',
    description: 'Located hidden assets and filtered log patterns across the filesystem using find and grep.',
    requirement: 'Complete Challenge 15'
  },
  {
    id: 'Permission Investigator',
    name: 'Permission Investigator',
    icon: '🛡️',
    description: 'Audited and adjusted POSIX permissions and execute bits using chmod.',
    requirement: 'Complete Challenge 21'
  },
  {
    id: 'Terminal Expert',
    name: 'Terminal Expert',
    icon: '⭐',
    description: 'Solved the multi-step Expert Incident Forensics scenario and resolved the breach.',
    requirement: 'Complete Challenge 25'
  },
  {
    id: 'Command Master',
    name: 'Command Master',
    icon: '👑',
    description: 'Completed every challenge in Linux Command Quest from Beginner to Expert.',
    requirement: 'Complete all 25 Challenges'
  }
];
