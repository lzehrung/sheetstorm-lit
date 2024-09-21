import type { StorybookConfig } from '@storybook/web-components-vite';
import path from 'path';

const config: StorybookConfig = {
  logLevel: 'debug',
  stories: ['../.storybook/stories/**/*.stories.@(js|ts|mdx)'],

  addons: ['@storybook/addon-links', // Add other addons as needed
  '@storybook/addon-essentials', '@chromatic-com/storybook'],

  framework: {
    name: '@storybook/web-components-vite',
    options: {}
  },

  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          '@components': path.resolve(__dirname, '../src/components'),
        },
      },
    };
  },

  docs: {}
};

export default config;
