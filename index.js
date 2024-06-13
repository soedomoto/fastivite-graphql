import build from './src/fastivite-graphql-build.js';
import dev from './src/fastivite-graphql-dev.js';
import preview from './src/fastivite-graphql-preview.js';

export const createGraphqlDevServer = dev.createGraphqlDevServer;
export const buildGraphqlServer = build.buildGraphqlServer;
export const previewGraphqlServer = preview.previewGraphqlServer;

export default {
  createGraphqlDevServer: dev.createGraphqlDevServer,
  buildGraphqlServer: build.buildGraphqlServer,
  previewGraphqlServer: preview.previewGraphqlServer,
};
