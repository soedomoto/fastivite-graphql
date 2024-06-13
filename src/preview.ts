import { PreviewServerParams, previewServer } from 'fastivite';

export type PreviewGraphqlServerParams = PreviewServerParams


export const previewGraphqlServer = (params: PreviewGraphqlServerParams) => {
  previewServer(params);
};
