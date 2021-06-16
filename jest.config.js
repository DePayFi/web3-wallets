module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '.git'],
  setupFiles: ['./tests/setup.js'],
  automock: false,
  modulePaths: ['<rootDir>']
};
