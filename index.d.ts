import { CreateDevServerParams, BuildServerParams, PreviewServerParams } from 'fastivite';

export type CreateGraphqlDevServerParams = CreateDevServerParams & {
    graphqlSchemaCwd: string | undefined
    graphqlSchemaPattern: string[] | undefined
    graphqlResolverCwd: string | undefined
    graphqlResolverPattern: string[] | undefined
    graphqlCodegen: boolean
    graphqlOperationCodegen: boolean
    graphqlOperationCodegenConfigFile: string | undefined
    graphqlCodegenOut: string
}
export function createGraphqlDevServer(params: CreateGraphqlDevServerParams): Promise<import('fastify').FastifyInstance>

export type GreateGraphqlDevServer = typeof createGraphqlDevServer;

export type BuildGraphqlServerParams = BuildServerParams & {
    graphqlSchemaCwd: string | undefined
    graphqlSchemaPattern: string[] | undefined
    graphqlCodegenOut: string
}
export function buildGraphqlServer(params: BuildGraphqlServerParams): Promise<void>

export type BuildGraphqlServer = typeof buildGraphqlServer;

export type PreviewGraphqlServerParams = PreviewServerParams
export function previewGraphqlServer(params: PreviewGraphqlServerParams): Promise<void>
export type PreviewGraphqlServer = typeof previewGraphqlServer;