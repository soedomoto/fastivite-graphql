import { previewServer } from 'fastivite';

/** @type {import('..').PreviewGraphqlServer} */
const _previewGraphqlServer = (params) => {
  previewServer(params);
};

export const previewGraphqlServer = _previewGraphqlServer;
export default { previewGraphqlServer: _previewGraphqlServer };
