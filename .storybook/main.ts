import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['./stories/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@chromatic-com/storybook'],
  core: {
    builder: '@storybook/builder-vite',
  },
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
};
export default config;
