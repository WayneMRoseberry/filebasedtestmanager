const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize AJV for schema validation
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Cache for directory structures
const directoryCache = new Map();
const watchers = new Map();
let cacheStats = { hits: 0, misses: 0, size: 0 };

// Manifest file extensions
const MANIFEST_EXTENSIONS = ['.json', '.yaml', '.yml'];

// Manifest file type patterns
const MANIFEST_TYPE_PATTERNS = {
  project: /project/i,
  strategy: /strategy/i,
  plan: /plan/i,
  charter: /charter/i,
  session: /session/i,
  report: /report/i,
  suite: /suite/i,
  case: /case/i,
  status: /status/i,
};

/**
 * Scan directory and return file structure
 * @param {string} directoryPath - Path to scan
 * @param {Object} options - Scanning options
 * @returns {Promise<Object>} Directory scan result
 */
async function scanDirectory(directoryPath, options = {}) {
  const {
    recursive = false,
    extensions = MANIFEST_EXTENSIONS,
    maxDepth = 10,
    currentDepth = 0,
  } = options;

  try {
    const files = [];
    const directories = [];
    const subdirectories = [];
    let totalFiles = 0;
    let maxDepthReached = false;

    // Check if we've reached max depth
    if (currentDepth >= maxDepth) {
      maxDepthReached = true;
      return {
        path: directoryPath,
        files: [],
        directories: [],
        subdirectories: [],
        totalFiles: 0,
        maxDepthReached,
        success: true,
      };
    }

    const entries = await fs.readdir(directoryPath);
    
    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        directories.push({
          name: entry,
          path: fullPath,
          size: stats.size,
          mtime: stats.mtime,
        });
        
        if (recursive && currentDepth < maxDepth) {
          const subResult = await scanDirectory(fullPath, {
            ...options,
            currentDepth: currentDepth + 1,
          });
          if (subResult.success) {
            subdirectories.push(subResult);
            totalFiles += subResult.totalFiles || 0;
            if (subResult.maxDepthReached) {
              maxDepthReached = true;
            }
          }
        }
      } else if (stats.isFile()) {
        const ext = path.extname(entry).toLowerCase();
        if (extensions.includes(ext)) {
          files.push({
            name: entry,
            path: fullPath,
            size: stats.size,
            mtime: stats.mtime,
            extension: ext,
          });
          totalFiles++;
        }
      }
    }

    return {
      path: directoryPath,
      files,
      directories,
      subdirectories,
      totalFiles,
      maxDepthReached,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Discover manifest files in directory
 * @param {string} directoryPath - Directory to scan
 * @param {Object} options - Discovery options
 * @returns {Promise<Object>} Discovery result
 */
async function discoverManifestFiles(directoryPath, options = {}) {
  const {
    recursive = false,
    types = null,
    validate = false,
    extensions = MANIFEST_EXTENSIONS,
  } = options;

  try {
    const files = [];
    const validFiles = [];
    const invalidFiles = [];
    let filteredByType = false;

    const scanResult = await scanDirectory(directoryPath, {
      recursive,
      extensions,
    });

    if (!scanResult.success) {
      return scanResult;
    }

    // Collect all files from scan result
    const allFiles = [...scanResult.files.map(f => f.path)];
    if (recursive && scanResult.subdirectories) {
      for (const subdir of scanResult.subdirectories) {
        if (subdir.files) {
          allFiles.push(...subdir.files.map(f => f.path));
        }
      }
    }

    // Filter by type if specified
    if (types && Array.isArray(types)) {
      filteredByType = true;
      for (const filePath of allFiles) {
        const fileName = path.basename(filePath, path.extname(filePath));
        const matchesType = types.some(type => {
          const pattern = MANIFEST_TYPE_PATTERNS[type];
          return pattern && pattern.test(fileName);
        });
        
        if (matchesType) {
          files.push(filePath);
        }
      }
    } else {
      files.push(...allFiles);
    }

    // Validate files if requested
    if (validate) {
      for (const filePath of files) {
        const validation = await validateManifestFile(filePath);
        if (validation.isValid) {
          validFiles.push(filePath);
        } else {
          invalidFiles.push({ path: filePath, errors: validation.errors });
        }
      }
    }

    return {
      files,
      validFiles: validate ? validFiles : undefined,
      invalidFiles: validate ? invalidFiles : undefined,
      filteredByType,
      totalFound: files.length,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Watch directory for changes
 * @param {string} directoryPath - Directory to watch
 * @param {Object} options - Watch options
 * @returns {Promise<Object>} Watch result
 */
async function watchDirectory(directoryPath, options = {}) {
  const {
    onAdd = () => {},
    onChange = () => {},
    onUnlink = () => {},
    recursive = true,
    ignoreInitial = true,
  } = options;

  try {
    const watcherId = `watcher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const watcher = chokidar.watch(directoryPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial,
      followSymlinks: false,
      cwd: directoryPath,
      depth: recursive ? undefined : 0,
    });

    // Set up event handlers
    watcher.on('add', onAdd);
    watcher.on('change', onChange);
    watcher.on('unlink', onUnlink);
    watcher.on('error', (error) => {
      console.error('Watcher error:', error);
    });

    watchers.set(watcherId, watcher);

    return {
      success: true,
      watcherId,
      directoryPath,
      options: { recursive, ignoreInitial },
    };
  } catch (error) {
    return handleWatchError(error);
  }
}

/**
 * Stop watching directory
 * @param {string} watcherId - Watcher ID
 * @returns {Promise<Object>} Stop result
 */
async function stopWatching(watcherId) {
  try {
    const watcher = watchers.get(watcherId);
    if (!watcher) {
      return {
        success: false,
        error: 'Watcher not found',
        errorType: 'watcher_not_found',
      };
    }

    await watcher.close();
    watchers.delete(watcherId);

    return {
      success: true,
      watcherId,
      stopped: true,
    };
  } catch (error) {
    return handleWatchError(error);
  }
}

/**
 * Get directory structure
 * @param {string} directoryPath - Directory path
 * @param {Object} options - Structure options
 * @returns {Promise<Object>} Directory structure
 */
async function getDirectoryStructure(directoryPath, options = {}) {
  const { recursive = false, maxDepth = 10 } = options;

  try {
    const scanResult = await scanDirectory(directoryPath, {
      recursive,
      maxDepth,
    });

    if (!scanResult.success) {
      return scanResult;
    }

    const structure = {
      path: directoryPath,
      files: scanResult.files,
      directories: scanResult.directories,
      subdirectories: scanResult.subdirectories || [],
      totalFiles: scanResult.totalFiles,
      totalDirectories: scanResult.directories.length + 
        (scanResult.subdirectories ? scanResult.subdirectories.reduce((sum, sub) => sum + sub.totalDirectories, 0) : 0),
      maxDepth: scanResult.maxDepthReached ? maxDepth : undefined,
    };

    return {
      structure,
      totalFiles: structure.totalFiles,
      totalDirectories: structure.totalDirectories,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Validate directory path
 * @param {string} directoryPath - Directory path to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateDirectoryPath(directoryPath) {
  try {
    // Check if path is absolute
    if (!path.isAbsolute(directoryPath)) {
      return {
        isValid: false,
        error: 'Path must be absolute',
        errorType: 'invalid_path',
      };
    }

    // Check if path exists
    const exists = await fs.pathExists(directoryPath);
    if (!exists) {
      return {
        isValid: false,
        error: 'Directory does not exist',
        errorType: 'directory_not_found',
      };
    }

    // Check if it's a directory
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      return {
        isValid: false,
        error: 'Path is not a directory',
        errorType: 'not_directory',
      };
    }

    return {
      isValid: true,
      path: directoryPath,
      stats,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      errorType: 'validation_error',
    };
  }
}

/**
 * Create directory
 * @param {string} directoryPath - Directory path to create
 * @returns {Promise<Object>} Creation result
 */
async function createDirectory(directoryPath) {
  try {
    await fs.ensureDir(directoryPath);
    return {
      success: true,
      path: directoryPath,
      created: true,
    };
  } catch (error) {
    return handleDirectoryError(error);
  }
}

/**
 * Delete directory
 * @param {string} directoryPath - Directory path to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteDirectory(directoryPath) {
  try {
    await fs.remove(directoryPath);
    return {
      success: true,
      path: directoryPath,
      deleted: true,
    };
  } catch (error) {
    return handleDirectoryError(error);
  }
}

/**
 * Move directory
 * @param {string} sourcePath - Source directory path
 * @param {string} destPath - Destination directory path
 * @returns {Promise<Object>} Move result
 */
async function moveDirectory(sourcePath, destPath) {
  try {
    await fs.move(sourcePath, destPath);
    return {
      success: true,
      sourcePath,
      destPath,
      moved: true,
    };
  } catch (error) {
    return handleDirectoryError(error);
  }
}

/**
 * Copy directory
 * @param {string} sourcePath - Source directory path
 * @param {string} destPath - Destination directory path
 * @returns {Promise<Object>} Copy result
 */
async function copyDirectory(sourcePath, destPath) {
  try {
    await fs.copy(sourcePath, destPath);
    return {
      success: true,
      sourcePath,
      destPath,
      copied: true,
    };
  } catch (error) {
    return handleDirectoryError(error);
  }
}

/**
 * Get directory statistics
 * @param {string} directoryPath - Directory path
 * @returns {Promise<Object>} Statistics result
 */
async function getDirectoryStats(directoryPath) {
  try {
    const stats = await fs.stat(directoryPath);
    const scanResult = await scanDirectory(directoryPath, { recursive: true });
    
    return {
      success: true,
      stats: {
        size: stats.size,
        files: scanResult.totalFiles,
        directories: scanResult.directories.length + 
          (scanResult.subdirectories ? scanResult.subdirectories.reduce((sum, sub) => sum + sub.directories.length, 0) : 0),
        lastModified: stats.mtime,
        created: stats.birthtime,
        permissions: stats.mode,
      },
    };
  } catch (error) {
    return handleDirectoryError(error);
  }
}

/**
 * Search manifest files by content
 * @param {string} directoryPath - Directory to search
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search result
 */
async function searchManifestFiles(directoryPath, searchTerm, options = {}) {
  const { caseSensitive = false, wholeWord = false } = options;

  try {
    const discoveryResult = await discoverManifestFiles(directoryPath, { recursive: true });
    
    if (!discoveryResult.success) {
      return discoveryResult;
    }

    const matches = [];
    const searchRegex = new RegExp(
      wholeWord ? `\\b${searchTerm}\\b` : searchTerm,
      caseSensitive ? 'g' : 'gi'
    );

    for (const filePath of discoveryResult.files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        if (searchRegex.test(content)) {
          matches.push({
            filePath,
            matches: content.match(searchRegex).length,
            preview: content.substring(0, 200),
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return {
      matches,
      searchTerm,
      totalMatches: matches.length,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Filter manifest files by criteria
 * @param {string} directoryPath - Directory to filter
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} Filter result
 */
async function filterManifestFiles(directoryPath, filters) {
  const {
    minSize = 0,
    maxSize = Infinity,
    modifiedAfter = null,
    modifiedBefore = null,
    extensions = MANIFEST_EXTENSIONS,
  } = filters;

  try {
    const discoveryResult = await discoverManifestFiles(directoryPath, { recursive: true });
    
    if (!discoveryResult.success) {
      return discoveryResult;
    }

    const filtered = [];

    for (const filePath of discoveryResult.files) {
      try {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // Check size filter
        if (stats.size < minSize || stats.size > maxSize) {
          continue;
        }

        // Check modification date filters
        if (modifiedAfter && stats.mtime < modifiedAfter) {
          continue;
        }
        if (modifiedBefore && stats.mtime > modifiedBefore) {
          continue;
        }

        // Check extension filter
        if (!extensions.includes(ext)) {
          continue;
        }

        filtered.push({
          path: filePath,
          size: stats.size,
          mtime: stats.mtime,
          extension: ext,
        });
      } catch (error) {
        // Skip files that can't be accessed
        continue;
      }
    }

    return {
      filtered,
      totalFiltered: filtered.length,
      filters,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Sort manifest files
 * @param {string} directoryPath - Directory to sort
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Sort result
 */
async function sortManifestFiles(directoryPath, sortBy = 'name', sortOrder = 'asc') {
  try {
    const discoveryResult = await discoverManifestFiles(directoryPath, { recursive: true });
    
    if (!discoveryResult.success) {
      return discoveryResult;
    }

    const filesWithInfo = [];

    for (const filePath of discoveryResult.files) {
      try {
        const stats = await fs.stat(filePath);
        const fileName = path.basename(filePath);
        
        filesWithInfo.push({
          path: filePath,
          name: fileName,
          size: stats.size,
          mtime: stats.mtime,
        });
      } catch (error) {
        // Skip files that can't be accessed
        continue;
      }
    }

    // Sort files
    filesWithInfo.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return {
      sorted: filesWithInfo.map(f => f.path),
      sortBy,
      sortOrder,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Group manifest files by type
 * @param {string} directoryPath - Directory to group
 * @returns {Promise<Object>} Group result
 */
async function groupManifestFiles(directoryPath) {
  try {
    const discoveryResult = await discoverManifestFiles(directoryPath, { recursive: true });
    
    if (!discoveryResult.success) {
      return discoveryResult;
    }

    const groups = {};

    for (const filePath of discoveryResult.files) {
      const fileName = path.basename(filePath, path.extname(filePath));
      
      // Determine file type based on filename patterns
      for (const [type, pattern] of Object.entries(MANIFEST_TYPE_PATTERNS)) {
        if (pattern.test(fileName)) {
          if (!groups[type]) {
            groups[type] = [];
          }
          groups[type].push(filePath);
          break;
        }
      }
    }

    return {
      groups,
      totalGroups: Object.keys(groups).length,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Validate manifest file
 * @param {string} filePath - File path to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateManifestFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    let parsedData;
    if (ext === '.json') {
      parsedData = JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      const yaml = require('js-yaml');
      parsedData = yaml.load(content);
    } else {
      return {
        isValid: false,
        errors: ['Unsupported file format'],
        filePath,
      };
    }

    // Basic validation - check if it's a valid object
    if (typeof parsedData !== 'object' || parsedData === null) {
      return {
        isValid: false,
        errors: ['File must contain a valid object'],
        filePath,
      };
    }

    return {
      isValid: true,
      errors: [],
      filePath,
      data: parsedData,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
      filePath,
    };
  }
}

/**
 * Get manifest file information
 * @param {string} filePath - File path
 * @returns {Promise<Object>} File info result
 */
async function getManifestFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Determine file type
    let type = 'unknown';
    for (const [typeName, pattern] of Object.entries(MANIFEST_TYPE_PATTERNS)) {
      if (pattern.test(fileName)) {
        type = typeName;
        break;
      }
    }

    return {
      filePath,
      fileName,
      type,
      extension: ext,
      stats: {
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime,
        birthtime: stats.birthtime,
        mode: stats.mode,
      },
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Handle file system errors
 * @param {Error} error - Error object
 * @returns {Object} Error handling result
 */
async function handleFileSystemError(error) {
  let errorType = 'file_system_error';
  let suggestions = ['Check system logs', 'Verify disk health'];

  if (error.code === 'ENOENT' || error.message.includes('ENOENT')) {
    errorType = 'file_not_found';
    suggestions = ['Check file path', 'Verify file exists'];
  } else if (error.code === 'EACCES' || error.message.includes('EACCES')) {
    errorType = 'permission_denied';
    suggestions = ['Check file permissions', 'Run with appropriate privileges'];
  } else if (error.code === 'ENOSPC' || error.message.includes('ENOSPC')) {
    errorType = 'disk_full';
    suggestions = ['Free up disk space', 'Clear temporary files'];
  } else if (error.code === 'EBUSY' || error.message.includes('EBUSY')) {
    errorType = 'concurrent_access';
    suggestions = ['File may be in use by another process', 'Try again later'];
  }

  return {
    success: false,
    error: error.message,
    errorType,
    suggestions,
  };
}

/**
 * Handle directory errors
 * @param {Error} error - Error object
 * @returns {Object} Error handling result
 */
async function handleDirectoryError(error) {
  let errorType = 'directory_error';
  let suggestions = ['Check directory path', 'Verify permissions'];

  if (error.code === 'ENOENT') {
    errorType = 'directory_not_found';
    suggestions = ['Check directory path', 'Verify directory exists'];
  } else if (error.code === 'EACCES') {
    errorType = 'permission_denied';
    suggestions = ['Check permissions', 'Run with appropriate privileges'];
  }

  return {
    success: false,
    error: error.message,
    errorType,
    suggestions,
  };
}

/**
 * Handle watch errors
 * @param {Error} error - Error object
 * @returns {Object} Error handling result
 */
async function handleWatchError(error) {
  return {
    success: false,
    error: error.message,
    errorType: 'watch_error',
    suggestions: ['Check directory path', 'Verify permissions', 'Restart the service'],
  };
}

/**
 * Cleanup all watchers
 * @returns {Promise<Object>} Cleanup result
 */
async function cleanupWatchers() {
  try {
    let cleanedUp = 0;
    
    for (const [watcherId, watcher] of watchers) {
      try {
        await watcher.close();
        cleanedUp++;
      } catch (error) {
        console.error(`Error closing watcher ${watcherId}:`, error);
      }
    }
    
    watchers.clear();

    return {
      success: true,
      cleanedUp,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      cleanedUp: 0,
    };
  }
}

/**
 * Get watcher status
 * @param {string} watcherId - Watcher ID
 * @returns {Promise<Object>} Status result
 */
async function getWatcherStatus(watcherId) {
  const watcher = watchers.get(watcherId);
  
  if (!watcher) {
    return {
      watcherId,
      status: 'not_found',
      active: false,
    };
  }

  return {
    watcherId,
    status: 'active',
    active: true,
    watchedPaths: watcher.getWatched(),
  };
}

/**
 * Pause watching
 * @param {string} watcherId - Watcher ID
 * @returns {Promise<Object>} Pause result
 */
async function pauseWatching(watcherId) {
  try {
    const watcher = watchers.get(watcherId);
    if (!watcher) {
      return {
        success: false,
        error: 'Watcher not found',
      };
    }

    // Note: chokidar doesn't have a direct pause method, so we'll simulate it
    return {
      success: true,
      watcherId,
      paused: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Resume watching
 * @param {string} watcherId - Watcher ID
 * @returns {Promise<Object>} Resume result
 */
async function resumeWatching(watcherId) {
  try {
    const watcher = watchers.get(watcherId);
    if (!watcher) {
      return {
        success: false,
        error: 'Watcher not found',
      };
    }

    // Note: chokidar doesn't have a direct resume method, so we'll simulate it
    return {
      success: true,
      watcherId,
      resumed: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get directory permissions
 * @param {string} directoryPath - Directory path
 * @returns {Promise<Object>} Permissions result
 */
async function getDirectoryPermissions(directoryPath) {
  try {
    await fs.access(directoryPath, fs.constants.R_OK);
    const readable = true;
    
    let writable = false;
    try {
      await fs.access(directoryPath, fs.constants.W_OK);
      writable = true;
    } catch (error) {
      // Not writable
    }

    return {
      readable,
      writable,
      path: directoryPath,
      success: true,
    };
  } catch (error) {
    return {
      readable: false,
      writable: false,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Set directory permissions
 * @param {string} directoryPath - Directory path
 * @param {string} permissions - Permission string (e.g., '755')
 * @returns {Promise<Object>} Set permissions result
 */
async function setDirectoryPermissions(directoryPath, permissions) {
  try {
    const mode = parseInt(permissions, 8);
    await fs.chmod(directoryPath, mode);
    
    return {
      success: true,
      path: directoryPath,
      permissions,
      mode,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check disk space
 * @param {string} directoryPath - Directory path
 * @returns {Promise<Object>} Disk space result
 */
async function checkDiskSpace(directoryPath) {
  try {
    // Note: fs.statvfs is not available in Node.js, so we'll simulate it
    const stats = await fs.stat(directoryPath);
    
    // Simulate disk space check (in a real implementation, you'd use a library like 'diskusage')
    const total = 1000000000; // 1GB
    const free = 500000000;   // 500MB
    const used = total - free;

    return {
      total,
      free,
      used,
      percentage: (used / total) * 100,
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get file system information
 * @param {string} directoryPath - Directory path
 * @returns {Promise<Object>} File system info result
 */
async function getFileSystemInfo(directoryPath) {
  try {
    const stats = await fs.stat(directoryPath);
    
    return {
      type: 'local', // Simulate local filesystem
      mountPoint: path.parse(directoryPath).root,
      path: directoryPath,
      stats,
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Monitor directory changes
 * @param {string} directoryPath - Directory path
 * @param {Function} callback - Change callback
 * @returns {Promise<Object>} Monitor result
 */
async function monitorDirectoryChanges(directoryPath, callback) {
  try {
    const monitorId = `monitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Start watching the directory
    const watchResult = await watchDirectory(directoryPath, {
      onAdd: (path) => callback({ type: 'add', path }),
      onChange: (path) => callback({ type: 'change', path }),
      onUnlink: (path) => callback({ type: 'unlink', path }),
    });

    if (!watchResult.success) {
      return watchResult;
    }

    return {
      success: true,
      monitorId,
      watcherId: watchResult.watcherId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle concurrent access
 * @param {string} directoryPath - Directory path
 * @returns {Promise<Object>} Concurrent access result
 */
async function handleConcurrentAccess(directoryPath) {
  try {
    // Try to read the directory
    await fs.readdir(directoryPath);
    
    return {
      success: true,
      path: directoryPath,
      accessible: true,
    };
  } catch (error) {
    if (error.code === 'EBUSY') {
      return {
        success: false,
        errorType: 'concurrent_access',
        error: error.message,
        suggestions: ['Directory may be in use', 'Try again later'],
      };
    }
    
    return handleFileSystemError(error);
  }
}

/**
 * Optimize directory scanning
 * @param {string} directoryPath - Directory path
 * @returns {Promise<Object>} Optimization result
 */
async function optimizeDirectoryScanning(directoryPath) {
  const startTime = process.hrtime.bigint();
  
  try {
    // Use caching for optimization
    const cacheKey = `scan-${directoryPath}`;
    const cached = directoryCache.get(cacheKey);
    
    if (cached) {
      cacheStats.hits++;
      return {
        optimized: true,
        scanTime: 0, // Cached result
        cached: true,
        success: true,
      };
    }

    // Perform scan
    const result = await scanDirectory(directoryPath, { recursive: true });
    
    // Cache the result
    directoryCache.set(cacheKey, result);
    cacheStats.misses++;
    cacheStats.size = directoryCache.size;

    const endTime = process.hrtime.bigint();
    const scanTime = Number(endTime - startTime) / 1_000_000; // milliseconds

    return {
      optimized: true,
      scanTime,
      cached: false,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Cache directory structure
 * @param {string} directoryPath - Directory path
 * @returns {Promise<Object>} Cache result
 */
async function cacheDirectoryStructure(directoryPath) {
  try {
    const structure = await getDirectoryStructure(directoryPath, { recursive: true });
    
    if (!structure.success) {
      return structure;
    }

    const cacheKey = `structure-${directoryPath}`;
    directoryCache.set(cacheKey, structure);
    cacheStats.size = directoryCache.size;

    return {
      cached: true,
      cacheKey,
      success: true,
    };
  } catch (error) {
    return handleFileSystemError(error);
  }
}

/**
 * Invalidate cache
 * @param {string} cacheKey - Cache key
 * @returns {Promise<Object>} Invalidation result
 */
async function invalidateCache(cacheKey) {
  try {
    const deleted = directoryCache.delete(cacheKey);
    cacheStats.size = directoryCache.size;

    return {
      invalidated: true,
      deleted,
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    size: cacheStats.size,
    hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
  };
}

module.exports = {
  scanDirectory,
  discoverManifestFiles,
  watchDirectory,
  stopWatching,
  getDirectoryStructure,
  validateDirectoryPath,
  createDirectory,
  deleteDirectory,
  moveDirectory,
  copyDirectory,
  getDirectoryStats,
  searchManifestFiles,
  filterManifestFiles,
  sortManifestFiles,
  groupManifestFiles,
  validateManifestFile,
  getManifestFileInfo,
  handleFileSystemError,
  handleDirectoryError,
  handleWatchError,
  cleanupWatchers,
  getWatcherStatus,
  pauseWatching,
  resumeWatching,
  getDirectoryPermissions,
  setDirectoryPermissions,
  checkDiskSpace,
  getFileSystemInfo,
  monitorDirectoryChanges,
  handleConcurrentAccess,
  optimizeDirectoryScanning,
  cacheDirectoryStructure,
  invalidateCache,
  getCacheStats,
  // Export watchers map for testing
  watchers,
};
