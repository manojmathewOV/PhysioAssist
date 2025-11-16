module.exports = {
  CachesDirectoryPath: '/cache',
  DocumentDirectoryPath: '/documents',
  TemporaryDirectoryPath: '/tmp',
  writeFile: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue(''),
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(true),
  readDir: jest.fn().mockResolvedValue([]),
  unlink: jest.fn().mockResolvedValue(true),
  stat: jest.fn().mockResolvedValue({ size: 0, isFile: () => true }),
  hash: jest.fn().mockResolvedValue('abc123hash'),
  moveFile: jest.fn().mockResolvedValue(true),
  copyFile: jest.fn().mockResolvedValue(true),
  downloadFile: jest.fn(() => ({
    jobId: 1,
    promise: Promise.resolve({ statusCode: 200, bytesWritten: 1024 }),
  })),
};
