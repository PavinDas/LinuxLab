/**
 * CyberLinux Security Limits Configuration
 * Enforces hard bounds on memory, execution, and storage to prevent DoS.
 */
export const SecurityLimits = Object.freeze({
  MAX_INPUT_LENGTH: 4096,
  MAX_OUTPUT_LINES: 1200,
  MAX_OUTPUT_CHARS: 65536,
  MAX_FILE_SIZE_BYTES: 1024 * 1024 * 2, // 2MB per virtual file
  MAX_BACKUP_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_FILESYSTEM_NODES: 2000,
  MAX_FILENAME_LENGTH: 255,
  MAX_PATH_DEPTH: 32,
  MAX_PATH_LENGTH: 512,
  MAX_COMMAND_HISTORY: 300,
  MAX_PROCESSES: 80,
  COMMAND_TIMEOUT_MS: 3000,
  MAX_PIPE_STAGES: 16,
  MAX_LOOP_ITERATIONS: 1000,
  MAX_ENV_VAR_LENGTH: 1024,
  MAX_ENV_VARS: 128,
  STORAGE_KEY_PREFIX: 'cyberlinux_v1_'
});
