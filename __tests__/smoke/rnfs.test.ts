/**
 * Smoke tests for react-native-fs
 * Validates that RNFS can be imported and has required paths/methods
 */

import RNFS from 'react-native-fs';

describe('React Native FS Smoke Tests', () => {
  it('should import RNFS successfully', () => {
    expect(RNFS).toBeDefined();
  });

  it('should have required directory paths', () => {
    expect(RNFS.CachesDirectoryPath).toBeDefined();
    expect(typeof RNFS.CachesDirectoryPath).toBe('string');

    expect(RNFS.DocumentDirectoryPath).toBeDefined();
    expect(typeof RNFS.DocumentDirectoryPath).toBe('string');

    expect(RNFS.TemporaryDirectoryPath).toBeDefined();
    expect(typeof RNFS.TemporaryDirectoryPath).toBe('string');
  });

  it('should have core file operations defined', () => {
    expect(RNFS.writeFile).toBeDefined();
    expect(typeof RNFS.writeFile).toBe('function');

    expect(RNFS.readFile).toBeDefined();
    expect(typeof RNFS.readFile).toBe('function');

    expect(RNFS.unlink).toBeDefined();
    expect(typeof RNFS.unlink).toBe('function');

    expect(RNFS.exists).toBeDefined();
    expect(typeof RNFS.exists).toBe('function');
  });

  it('should have directory operations defined', () => {
    expect(RNFS.mkdir).toBeDefined();
    expect(typeof RNFS.mkdir).toBe('function');

    expect(RNFS.readDir).toBeDefined();
    expect(typeof RNFS.readDir).toBe('function');
  });

  it('should have file info operations defined', () => {
    expect(RNFS.stat).toBeDefined();
    expect(typeof RNFS.stat).toBe('function');

    expect(RNFS.hash).toBeDefined();
    expect(typeof RNFS.hash).toBe('function');
  });

  it('should have move and copy operations defined', () => {
    expect(RNFS.moveFile).toBeDefined();
    expect(typeof RNFS.moveFile).toBe('function');

    expect(RNFS.copyFile).toBeDefined();
    expect(typeof RNFS.copyFile).toBe('function');
  });

  it('should have download capabilities defined', () => {
    expect(RNFS.downloadFile).toBeDefined();
    expect(typeof RNFS.downloadFile).toBe('function');
  });
});
