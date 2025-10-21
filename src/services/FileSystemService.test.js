const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

// Import the FileSystemService functions (these will be created in the next task)
const {
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
} = require('./FileSystemService');

// Mock fs-extra and chokidar for testing
jest.mock('fs-extra');
jest.mock('chokidar');

describe('FileSystemService', () => {
  let mockDirectoryStructure;
  let mockManifestFiles;

  beforeEach(() => {
    // Simplified mock data to reduce memory usage
    mockDirectoryStructure = {
      '/test/projects': {
        'project1.json': { type: 'file', size: 1024 },
        'strategy1.yaml': { type: 'file', size: 2048 },
        'subdir': { type: 'directory' },
      },
    };

    mockManifestFiles = [
      '/test/projects/project1.json',
      '/test/projects/strategy1.yaml',
    ];
  });

  afterEach(() => {
    // Clear mocks to free memory
    jest.clearAllMocks();
  });

  describe('Directory Scanning', () => {
    it('should scan directory and return file structure', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json', 'strategy1.yaml', 'subdir']);
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('subdir')) {
          return Promise.resolve({ isDirectory: () => true, isFile: () => false });
        }
        return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
      });

      const result = await scanDirectory(directoryPath);

      expect(result.path).toBe(directoryPath);
      expect(result.files).toBeDefined();
      expect(result.directories).toBeDefined();
      expect(result.totalFiles).toBeGreaterThan(0);
    });

    it('should scan directory recursively', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir
        .mockResolvedValueOnce(['project1.json', 'subdir'])
        .mockResolvedValueOnce(['plan1.yml']);
      
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('subdir') && !filePath.includes('plan1.yml')) {
          return Promise.resolve({ isDirectory: () => true, isFile: () => false });
        }
        // Handle files in subdirectories
        if (filePath.includes('plan1.yml')) {
          return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
        }
        return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
      });

      const result = await scanDirectory(directoryPath, { recursive: true });

      expect(result.path).toBe(directoryPath);
      expect(result.totalFiles).toBe(2); // Should find project1.json and plan1.yml
      expect(result.subdirectories).toBeDefined();
      expect(result.subdirectories.length).toBe(1);
    });

    it('should handle empty directory', async () => {
      const directoryPath = '/test/empty';
      
      fs.readdir.mockResolvedValue([]);

      const result = await scanDirectory(directoryPath);

      expect(result.path).toBe(directoryPath);
      expect(result.totalFiles).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.directories).toEqual([]);
    });

    it('should handle directory scanning errors', async () => {
      const directoryPath = '/test/nonexistent';
      
      fs.readdir.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const result = await scanDirectory(directoryPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorType).toBe('file_not_found');
    });

    it('should handle permission errors during scanning', async () => {
      const directoryPath = '/test/restricted';
      
      fs.readdir.mockRejectedValue(new Error('EACCES: permission denied'));

      const result = await scanDirectory(directoryPath);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('permission_denied');
    });

    it('should filter files by extension during scanning', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json', 'readme.txt', 'strategy1.yaml']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });

      const result = await scanDirectory(directoryPath, { 
        extensions: ['.json', '.yaml', '.yml'] 
      });

      expect(result.files.length).toBe(2); // Only JSON and YAML files
      expect(result.files.some(f => f.name === 'readme.txt')).toBe(false);
    });

    it('should limit scan depth', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir
        .mockResolvedValueOnce(['subdir1'])
        .mockResolvedValueOnce(['subdir2'])
        .mockResolvedValueOnce(['file.json']);
      
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('subdir')) {
          return Promise.resolve({ isDirectory: () => true, isFile: () => false });
        }
        return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
      });

      const result = await scanDirectory(directoryPath, { 
        recursive: true, 
        maxDepth: 2 
      });

      expect(result.maxDepthReached).toBe(true);
    });
  });

  describe('Manifest Discovery', () => {
    it('should discover manifest files in directory', async () => {
      const directoryPath = '/test/projects';
      
      // Reset any existing mocks to ensure clean state
      jest.resetAllMocks();
      
      fs.readdir.mockResolvedValue(['project1.json', 'strategy1.yaml', 'readme.txt']);
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('project1.json') || filePath.includes('strategy1.yaml')) {
          return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
        }
        return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
      });

      const result = await discoverManifestFiles(directoryPath);

      expect(result.files).toHaveLength(2);
      expect(result.files.some(f => f.endsWith('.json'))).toBe(true);
      expect(result.files.some(f => f.endsWith('.yaml'))).toBe(true);
      expect(result.files.some(f => f.includes('readme.txt'))).toBe(false);
    });

    it('should discover manifest files recursively', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir
        .mockResolvedValueOnce(['project1.json', 'subdir'])
        .mockResolvedValueOnce(['plan1.yml']);
      
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('subdir') && !filePath.includes('plan1.yml')) {
          return Promise.resolve({ isDirectory: () => true, isFile: () => false });
        }
        // Handle files in subdirectories
        if (filePath.includes('plan1.yml')) {
          return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
        }
        return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
      });

      const result = await discoverManifestFiles(directoryPath, { recursive: true });

      expect(result.files.length).toBeGreaterThan(1);
      expect(result.files.some(f => f.includes('subdir'))).toBe(true);
    });

    it('should filter manifest files by type', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json', 'strategy1.yaml', 'plan1.yml']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });

      const result = await discoverManifestFiles(directoryPath, { 
        types: ['project', 'strategy'] 
      });

      expect(result.files).toBeDefined();
      expect(result.filteredByType).toBe(true);
    });

    it('should handle discovery errors gracefully', async () => {
      const directoryPath = '/test/nonexistent';
      
      fs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await discoverManifestFiles(directoryPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate discovered manifest files', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json', 'invalid.json']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('invalid')) {
          return Promise.resolve('{"invalid": json}');
        }
        return Promise.resolve('{"id": "proj-001", "name": "Test Project"}');
      });

      const result = await discoverManifestFiles(directoryPath, { validate: true });

      expect(result.validFiles).toBeDefined();
      expect(result.invalidFiles).toBeDefined();
    });
  });

  describe('Directory Watching', () => {
    let mockWatcher;

    beforeEach(() => {
      mockWatcher = {
        on: jest.fn(),
        close: jest.fn(),
        add: jest.fn(),
        unwatch: jest.fn(),
        getWatched: jest.fn().mockReturnValue({}),
      };
      chokidar.watch.mockReturnValue(mockWatcher);
    });

    it('should start watching directory', async () => {
      const directoryPath = '/test/projects';
      const onAdd = jest.fn();
      const onChange = jest.fn();
      const onUnlink = jest.fn();

      const result = await watchDirectory(directoryPath, {
        onAdd,
        onChange,
        onUnlink,
      });

      expect(result.success).toBe(true);
      expect(result.watcherId).toBeDefined();
      expect(chokidar.watch).toHaveBeenCalledWith(directoryPath, expect.any(Object));
    });

    it('should handle watch errors', async () => {
      const directoryPath = '/test/nonexistent';
      
      chokidar.watch.mockImplementation(() => {
        throw new Error('Watch failed');
      });

      const result = await watchDirectory(directoryPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should stop watching directory', async () => {
      const watcherId = 'watcher-123';
      
      // Add the watcher to the watchers map first
      const { watchers } = require('./FileSystemService');
      watchers.set(watcherId, mockWatcher);
      
      const result = await stopWatching(watcherId);

      expect(result.success).toBe(true);
      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('should pause and resume watching', async () => {
      const watcherId = 'watcher-123';

      // Add the watcher to the watchers map first
      const { watchers } = require('./FileSystemService');
      watchers.set(watcherId, mockWatcher);

      const pauseResult = await pauseWatching(watcherId);
      expect(pauseResult.success).toBe(true);

      const resumeResult = await resumeWatching(watcherId);
      expect(resumeResult.success).toBe(true);
    });

    it('should get watcher status', async () => {
      const watcherId = 'watcher-123';

      const result = await getWatcherStatus(watcherId);

      expect(result.watcherId).toBe(watcherId);
      expect(result.status).toBeDefined();
    });

    it('should cleanup all watchers', async () => {
      const result = await cleanupWatchers();

      expect(result.success).toBe(true);
      expect(result.cleanedUp).toBeGreaterThan(0);
    });
  });

  describe('Directory Operations', () => {
    it('should create directory', async () => {
      const directoryPath = '/test/new-directory';
      
      fs.ensureDir.mockResolvedValue(undefined);

      const result = await createDirectory(directoryPath);

      expect(result.success).toBe(true);
      expect(fs.ensureDir).toHaveBeenCalledWith(directoryPath);
    });

    it('should delete directory', async () => {
      const directoryPath = '/test/old-directory';
      
      fs.remove.mockResolvedValue(undefined);

      const result = await deleteDirectory(directoryPath);

      expect(result.success).toBe(true);
      expect(fs.remove).toHaveBeenCalledWith(directoryPath);
    });

    it('should move directory', async () => {
      const sourcePath = '/test/source';
      const destPath = '/test/destination';
      
      fs.move.mockResolvedValue(undefined);

      const result = await moveDirectory(sourcePath, destPath);

      expect(result.success).toBe(true);
      expect(fs.move).toHaveBeenCalledWith(sourcePath, destPath);
    });

    it('should copy directory', async () => {
      const sourcePath = '/test/source';
      const destPath = '/test/destination';
      
      fs.copy.mockResolvedValue(undefined);

      const result = await copyDirectory(sourcePath, destPath);

      expect(result.success).toBe(true);
      expect(fs.copy).toHaveBeenCalledWith(sourcePath, destPath);
    });

    it('should get directory statistics', async () => {
      const directoryPath = '/test/projects';
      const mockStats = {
        size: 4096,
        files: 10,
        directories: 2,
        lastModified: new Date(),
      };
      
      fs.stat.mockResolvedValue(mockStats);
      fs.readdir.mockResolvedValue(['file1.json', 'file2.yaml']);
      // Mock fs.stat for the files in the directory
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('file1.json') || filePath.includes('file2.yaml')) {
          return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
        }
        return Promise.resolve(mockStats);
      });

      const result = await getDirectoryStats(directoryPath);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.size).toBe(mockStats.size);
    });

    it('should validate directory path', async () => {
      const validPath = '/test/projects';
      const invalidPath = 'invalid-path';

      // Mock fs.pathExists for valid path
      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue({ isDirectory: () => true });

      const validResult = await validateDirectoryPath(validPath);
      expect(validResult.isValid).toBe(true);

      // Mock fs.pathExists for invalid path
      fs.pathExists.mockResolvedValue(false);

      const invalidResult = await validateDirectoryPath(invalidPath);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('File Search and Filtering', () => {
    it('should search manifest files by content', async () => {
      const directoryPath = '/test/projects';
      const searchTerm = 'test project';
      
      fs.readdir.mockResolvedValue(['project1.json']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });
      fs.readFile.mockResolvedValue('{"id": "proj-001", "name": "Test Project"}');

      const result = await searchManifestFiles(directoryPath, searchTerm);

      expect(result.matches).toBeDefined();
      expect(result.matches.length).toBeGreaterThan(0);
    });

    it('should filter manifest files by criteria', async () => {
      const directoryPath = '/test/projects';
      const filters = {
        minSize: 1000,
        maxSize: 5000,
        modifiedAfter: new Date('2025-01-01'),
      };
      
      fs.readdir.mockResolvedValue(['project1.json', 'small.json']);
      fs.stat.mockImplementation((filePath) => {
        const size = filePath.includes('small') ? 500 : 2000;
        return Promise.resolve({ 
          isDirectory: () => false, 
          isFile: () => true, 
          size,
          mtime: new Date('2025-01-15'),
        });
      });

      const result = await filterManifestFiles(directoryPath, filters);

      expect(result.filtered).toBeDefined();
      expect(result.filtered.length).toBe(1);
    });

    it('should sort manifest files', async () => {
      const directoryPath = '/test/projects';
      const sortBy = 'name';
      const sortOrder = 'asc';
      
      fs.readdir.mockResolvedValue(['z-project.json', 'a-project.json']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });

      const result = await sortManifestFiles(directoryPath, sortBy, sortOrder);

      expect(result.sorted).toBeDefined();
      expect(result.sorted[0]).toContain('a-project');
    });

    it('should group manifest files by type', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json', 'strategy1.yaml', 'plan1.yml']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });

      const result = await groupManifestFiles(directoryPath);

      expect(result.groups).toBeDefined();
      expect(result.groups.project).toBeDefined();
      expect(result.groups.strategy).toBeDefined();
    });
  });

  describe('Manifest File Operations', () => {
    it('should validate manifest file', async () => {
      const filePath = '/test/projects/project1.json';
      
      fs.readFile.mockResolvedValue('{"id": "proj-001", "name": "Test Project"}');

      const result = await validateManifestFile(filePath);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should get manifest file information', async () => {
      const filePath = '/test/projects/project1.json';
      const mockStats = {
        size: 1024,
        mtime: new Date(),
        ctime: new Date(),
      };
      
      fs.stat.mockResolvedValue(mockStats);
      fs.readFile.mockResolvedValue('{"id": "proj-001", "name": "Test Project"}');

      const result = await getManifestFileInfo(filePath);

      expect(result.filePath).toBe(filePath);
      expect(result.stats).toEqual(mockStats);
      expect(result.type).toBeDefined();
    });

    it('should handle invalid manifest files', async () => {
      const filePath = '/test/projects/invalid.json';
      
      fs.readFile.mockResolvedValue('{"invalid": json}');

      const result = await validateManifestFile(filePath);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors', async () => {
      const error = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';

      const result = await handleFileSystemError(error);

      expect(result.errorType).toBe('file_not_found');
      expect(result.suggestions).toContain('Check file path');
    });

    it('should handle directory errors', async () => {
      const error = new Error('EACCES: permission denied');
      error.code = 'EACCES';

      const result = await handleDirectoryError(error);

      expect(result.errorType).toBe('permission_denied');
      expect(result.suggestions).toContain('Check permissions');
    });

    it('should handle watch errors', async () => {
      const error = new Error('Watch failed');

      const result = await handleWatchError(error);

      expect(result.errorType).toBe('watch_error');
      expect(result.suggestions).toBeDefined();
    });

    it('should handle concurrent access errors', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockRejectedValue(new Error('EBUSY: resource busy'));

      const result = await handleConcurrentAccess(directoryPath);

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('concurrent_access');
    });
  });

  describe('Performance and Optimization', () => {
    it('should optimize directory scanning', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });

      const result = await optimizeDirectoryScanning(directoryPath);

      expect(result.optimized).toBe(true);
      expect(result.scanTime).toBeDefined();
    });

    it('should cache directory structure', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json']);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });

      const result = await cacheDirectoryStructure(directoryPath);

      expect(result.cached).toBe(true);
      expect(result.cacheKey).toBeDefined();
    });

    it('should invalidate cache', async () => {
      const cacheKey = 'test-cache-key';

      const result = await invalidateCache(cacheKey);

      expect(result.invalidated).toBe(true);
    });

    it('should get cache statistics', async () => {
      const result = await getCacheStats();

      expect(result.hits).toBeDefined();
      expect(result.misses).toBeDefined();
      expect(result.size).toBeDefined();
    });
  });

  describe('System Information', () => {
    it('should get directory permissions', async () => {
      const directoryPath = '/test/projects';
      
      fs.access.mockResolvedValue(undefined);

      const result = await getDirectoryPermissions(directoryPath);

      expect(result.readable).toBe(true);
      expect(result.writable).toBe(true);
    });

    it('should set directory permissions', async () => {
      const directoryPath = '/test/projects';
      const permissions = '755';

      const result = await setDirectoryPermissions(directoryPath, permissions);

      expect(result.success).toBe(true);
    });

    it('should check disk space', async () => {
      const directoryPath = '/test/projects';
      
      fs.statvfs = jest.fn().mockResolvedValue({
        bsize: 4096,
        blocks: 1000000,
        bfree: 500000,
      });

      const result = await checkDiskSpace(directoryPath);

      expect(result.total).toBeDefined();
      expect(result.free).toBeDefined();
      expect(result.used).toBeDefined();
    });

    it('should get file system information', async () => {
      const directoryPath = '/test/projects';

      const result = await getFileSystemInfo(directoryPath);

      expect(result.type).toBeDefined();
      expect(result.mountPoint).toBeDefined();
    });

    it('should monitor directory changes', async () => {
      const directoryPath = '/test/projects';
      const callback = jest.fn();

      // Set up chokidar mock
      const mockWatcher = {
        on: jest.fn(),
        close: jest.fn(),
        add: jest.fn(),
        unwatch: jest.fn(),
        getWatched: jest.fn().mockReturnValue({}),
      };
      chokidar.watch.mockReturnValue(mockWatcher);

      const result = await monitorDirectoryChanges(directoryPath, callback);

      expect(result.success).toBe(true);
      expect(result.monitorId).toBeDefined();
    });
  });

  describe('Directory Structure Management', () => {
    it('should get directory structure', async () => {
      const directoryPath = '/test/projects';
      
      fs.readdir.mockResolvedValue(['project1.json', 'subdir']);
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('subdir')) {
          return Promise.resolve({ isDirectory: () => true, isFile: () => false });
        }
        return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
      });

      const result = await getDirectoryStructure(directoryPath);

      expect(result.structure).toBeDefined();
      expect(result.totalFiles).toBeDefined();
      expect(result.totalDirectories).toBeDefined();
    });

    it('should handle large directory structures', async () => {
      const directoryPath = '/test/large-projects';
      const largeFileList = Array(1000).fill(0).map((_, i) => `file${i}.json`);
      
      fs.readdir.mockResolvedValue(largeFileList);
      fs.stat.mockResolvedValue({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });

      const result = await getDirectoryStructure(directoryPath);

      expect(result.structure).toBeDefined();
      expect(result.totalFiles).toBe(1000);
    });

    it('should handle nested directory structures', async () => {
      const directoryPath = '/test/nested-projects';
      
      fs.readdir
        .mockResolvedValueOnce(['level1'])
        .mockResolvedValueOnce(['level2'])
        .mockResolvedValueOnce(['level3'])
        .mockResolvedValueOnce(['file.json']);
      
      fs.stat.mockImplementation((filePath) => {
        if (filePath.includes('level')) {
          return Promise.resolve({ isDirectory: () => true, isFile: () => false });
        }
        return Promise.resolve({ isDirectory: () => false, isFile: () => true, size: 1024, mtime: new Date() });
      });

      const result = await getDirectoryStructure(directoryPath, { recursive: true });

      expect(result.structure).toBeDefined();
      expect(result.structure.subdirectories).toBeDefined();
      expect(result.structure.subdirectories.length).toBeGreaterThan(0);
    });
  });
});
