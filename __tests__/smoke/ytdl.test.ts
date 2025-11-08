/**
 * Smoke tests for react-native-ytdl
 * Validates that ytdl can be imported and has required methods
 */

import ytdl from 'react-native-ytdl';

describe('React Native YTDL Smoke Tests', () => {
  it('should import ytdl successfully', () => {
    expect(ytdl).toBeDefined();
  });

  it('should have getInfo method defined', () => {
    expect(ytdl.getInfo).toBeDefined();
    expect(typeof ytdl.getInfo).toBe('function');
  });

  it('should have validateURL method defined', () => {
    expect(ytdl.validateURL).toBeDefined();
    expect(typeof ytdl.validateURL).toBe('function');
  });

  it('should have validateID method defined', () => {
    expect(ytdl.validateID).toBeDefined();
    expect(typeof ytdl.validateID).toBe('function');
  });

  it('should have getVideoID method defined', () => {
    expect(ytdl.getVideoID).toBeDefined();
    expect(typeof ytdl.getVideoID).toBe('function');
  });

  it('should be callable as a function', () => {
    expect(typeof ytdl).toBe('function');
  });
});
