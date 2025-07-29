module.exports = {
  CachesDirectoryPath: '/cache',
  DocumentDirectoryPath: '/documents',
  writeFile: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue(''),
  exists: jest.fn().mockResolvedValue(true),
  mkdir: jest.fn().mockResolvedValue(true),
  readDir: jest.fn().mockResolvedValue([]),
  unlink: jest.fn().mockResolvedValue(true),
  stat: jest.fn().mockResolvedValue({ size: 0, isFile: () => true })
};