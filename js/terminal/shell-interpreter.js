import { CommandParser } from './command-parser.js';
import { SecurityLimits } from '../security/limits.js';
import { PathValidator } from '../security/path-validator.js';
import { SYSTEM_INFO } from '../core/system-info.js';

/**
 * ShellInterpreter
 * Coordinates execution of commands, handles pipelines, redirections,
 * environment variables, exit codes, and tab completion.
 */
export class ShellInterpreter {
  constructor(registry, vfs, users, processes, network) {
    this.registry = registry;
    this.vfs = vfs;
    this.users = users;
    this.processes = processes;
    this.network = network;

    const user = this.users.getCurrentUser();
    this.cwd = user.home || SYSTEM_INFO.home;
    this.env = {
      USER: user.name,
      HOME: user.home || SYSTEM_INFO.home,
      SHELL: '/bin/bash',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PWD: user.home || SYSTEM_INFO.home,
      TERM: 'xterm-256color',
      HOSTNAME: this.network.hostname,
      '?': 0
    };
  }

  getPrompt() {
    const username = this.users.getCurrentUsername();
    const isRoot = this.users.isRoot();
    const home = this.users.getCurrentUser().home || SYSTEM_INFO.home;
    let displayDir = this.cwd;
    if (displayDir === home) {
      displayDir = '~';
    } else if (displayDir.startsWith(home + '/')) {
      displayDir = '~' + displayDir.slice(home.length);
    }
    const symbol = isRoot ? '#' : '$';
    return `${username}@${this.network.hostname}:${displayDir}${symbol} `;
  }

  /**
   * Execute a full user command line
   * @param {string} rawLine 
   * @returns {Promise<{ exitCode: number, stdout: string, stderr: string, clearScreen?: boolean, exitShell?: boolean }>}
   */
  async execute(rawLine) {
    if (!rawLine || !rawLine.trim()) {
      return { exitCode: 0, stdout: '', stderr: '' };
    }

    try {
      const { chains } = CommandParser.parse(rawLine, this.env);
      let lastExitCode = 0;
      let finalStdout = '';
      let finalStderr = '';
      let shouldClear = false;
      let shouldExitShell = false;

      for (const chain of chains) {
        // Evaluate condition
        if (chain.condition === 'and' && lastExitCode !== 0) continue;
        if (chain.condition === 'or' && lastExitCode === 0) continue;

        let pipelineStdin = '';
        for (let i = 0; i < chain.pipeline.length; i++) {
          const cmdAst = chain.pipeline[i];
          const isLastStage = (i === chain.pipeline.length - 1);

          // Check input redirection '<'
          const inRedirect = cmdAst.redirects.find(r => r.type === 'REDIRECT_IN');
          if (inRedirect) {
            const readRes = this.vfs.readFile(inRedirect.target, this.cwd, this.users.getCurrentUser());
            if (!readRes.success) {
              lastExitCode = 1;
              finalStderr += `bash: ${inRedirect.target}: ${readRes.error}\n`;
              break;
            }
            pipelineStdin = readRes.content;
          }

          const executionContext = {
            cwd: this.cwd,
            user: this.users.getCurrentUser(),
            env: this.env,
            stdin: pipelineStdin,
            isPipeline: !isLastStage
          };

          const cmdDef = this.registry.get(cmdAst.name);
          if (!cmdDef) {
            lastExitCode = 127;
            finalStderr += `bash: ${cmdAst.name}: command not found\n`;
            break;
          }

          // Execute command handler
          const result = await cmdDef.execute(cmdAst.args, executionContext);
          lastExitCode = result.exitCode !== undefined ? result.exitCode : 0;
          this.env['?'] = lastExitCode;

          if (result.newCwd) {
            this.cwd = result.newCwd;
            this.env.PWD = result.newCwd;
          }
          const activeUser = this.users.getCurrentUser();
          this.env.USER = activeUser.name;
          this.env.HOME = activeUser.home;
          this.env.HOSTNAME = this.network.hostname;
          if (result.clearScreen) {
            shouldClear = true;
          }
          if (result.exitShell) {
            shouldExitShell = true;
          }

          let stageOut = result.stdout || '';
          let stageErr = result.stderr || '';

          // Handle output redirection '>' or '>>'
          const outRedirect = cmdAst.redirects.find(r => r.type === 'REDIRECT_OUT' || r.type === 'APPEND_OUT');
          if (outRedirect) {
            const isAppend = (outRedirect.type === 'APPEND_OUT');
            const writeRes = this.vfs.writeFile(outRedirect.target, stageOut, this.cwd, this.users.getCurrentUser(), isAppend);
            if (!writeRes.success) {
              finalStderr += `bash: ${outRedirect.target}: ${writeRes.error}\n`;
              lastExitCode = 1;
            }
            stageOut = ''; // redirected, not sent to stdout/pipeline
          }

          if (isLastStage) {
            finalStdout += stageOut;
            finalStderr += stageErr;
          } else {
            pipelineStdin = stageOut; // Feed to next pipeline stage
          }
        }
      }

      // Security check: truncate output if exceeding bounds
      if (finalStdout.length > SecurityLimits.MAX_OUTPUT_CHARS) {
        finalStdout = finalStdout.slice(0, SecurityLimits.MAX_OUTPUT_CHARS) + '\n[Output truncated: limit exceeded]\n';
      }

      return {
        exitCode: lastExitCode,
        stdout: finalStdout,
        stderr: finalStderr,
        clearScreen: shouldClear,
        exitShell: shouldExitShell
      };
    } catch (err) {
      this.env['?'] = 1;
      return {
        exitCode: 1,
        stdout: '',
        stderr: `bash: error: ${err.message || err}\n`
      };
    }
  }

  /**
   * Provide Tab Autocompletions for current input word
   * @param {string} line Current line text
   * @returns {{ completions: string[], prefix: string }}
   */
  getCompletions(line) {
    const trimmed = line.trimStart();
    const parts = line.split(/\s+/);
    const isFirstWord = (parts.length <= 1);
    const lastWord = parts[parts.length - 1] || '';

    if (isFirstWord) {
      // Complete command names
      const allCmds = this.registry.getAll().map(c => c.name);
      const matches = allCmds.filter(c => c.startsWith(lastWord)).sort();
      return { completions: matches, prefix: lastWord };
    } else {
      // Complete filenames in current directory or target path
      let searchDir = this.cwd;
      let filePrefix = lastWord;

      if (lastWord.includes('/')) {
        const split = PathValidator.split(lastWord);
        searchDir = PathValidator.normalize(split.dirname, this.cwd, this.users.getCurrentUser().home);
        filePrefix = split.basename;
      }

      const res = this.vfs.listDirectory(searchDir, this.cwd, this.users.getCurrentUser());
      if (!res.success) return { completions: [], prefix: lastWord };

      const matches = res.entries
        .filter(e => e.name.startsWith(filePrefix))
        .map(e => e.type === 'dir' ? `${e.name}/` : e.name)
        .sort();

      return { completions: matches, prefix: filePrefix };
    }
  }
}
