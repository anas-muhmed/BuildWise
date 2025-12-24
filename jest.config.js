module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 20000,
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
