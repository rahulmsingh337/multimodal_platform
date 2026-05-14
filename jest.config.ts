import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/frontend/**/*.test.ts', '**/tests/frontend/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/frontend/__mocks__/styleMock.js',
  },
  setupFilesAfterFramework: ['<rootDir>/tests/frontend/setup.ts'],
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/frontend/tsconfig.json' },
  },
}

export default config
