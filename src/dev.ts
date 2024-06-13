import { runCli } from '@graphql-codegen/cli';
import { build as esbuild } from 'esbuild';
import { createDevServer, CreateDevServerParams } from 'fastivite';
import { globSync } from 'glob';
import { buildSchema } from 'graphql';
import _ from 'lodash';
import mercurius, { MercuriusLoaders } from 'mercurius';
import { codegenMercurius, loadSchemaFiles } from 'mercurius-codegen';
import { join } from 'path';

export type CreateGraphqlDevServerParams = CreateDevServerParams & {
  graphqlSchemaCwd: string
  graphqlSchemaPattern: string | string[]
  graphqlResolverCwd: string
  graphqlResolverPattern: string[] | undefined
  graphqlCodegen: boolean
  graphqlOperationCodegen: boolean
  graphqlOperationCodegenConfigFile: string | undefined
  graphqlCodegenOut: string
}


export const createGraphqlDevServer = async ({
  host,
  port,
  base,
  index,
  entryServer,
  configFile,
  apiCwd,
  apiFilePattern,
  graphqlSchemaCwd,
  graphqlSchemaPattern = [],
  graphqlResolverCwd,
  graphqlResolverPattern = [],
  graphqlCodegen = true,
  graphqlOperationCodegen = true,
  graphqlOperationCodegenConfigFile,
  graphqlCodegenOut,
  middleware = false,
}: CreateGraphqlDevServerParams) => {
  let server = await createDevServer({
    host,
    port,
    base,
    index,
    entryServer,
    configFile,
    apiEnabled: false,
    apiCwd,
    apiFilePattern,
    middleware: true,
  });

  let codegenMercuriusOptions = {
    targetPath: graphqlCodegenOut,
    watchOptions: { enabled: graphqlCodegen },
  };

  /** @type {import('mercurius').IResolvers} */
  let resolvers = {};

  let tmpBuildDir = join(process.cwd(), 'dist', '.resolvers');
  let resolverPaths = globSync(graphqlResolverPattern, {
    cwd: graphqlResolverCwd,
  });
  for (let resolverPath of resolverPaths) {
    let resolverFile = join(graphqlResolverCwd, resolverPath);
    let resolverJsPath = resolverPath;
    let resolverJsFile = join(process.cwd(), resolverFile);

    if (resolverFile.endsWith('.ts')) {
      resolverJsPath = resolverPath.replace('.ts', '.js');
      resolverJsFile = join(tmpBuildDir, resolverJsPath);

      await esbuild({
        format: 'esm',
        platform: 'node',
        entryPoints: [resolverFile],
        outfile: resolverJsFile,
      });
    }

    let resolver = await import(resolverJsFile);
    resolvers = _.defaultsDeep(resolvers, resolver?.default || {});
  }

  let loaders: MercuriusLoaders = {};

  // let context: MercuriusContext = (req: FastifyRequest, rep: FastifyReply) => {
  //   return {};
  // };

  let graphqlSchemaPattern2: string[] = [];
  if (typeof graphqlSchemaPattern == 'string') graphqlSchemaPattern2 = [...graphqlSchemaPattern2, graphqlSchemaPattern];
  else graphqlSchemaPattern2 = [...graphqlSchemaPattern2, ...graphqlSchemaPattern];

  let { schema } = loadSchemaFiles(
    graphqlSchemaPattern2.map((p) => join(graphqlSchemaCwd, p)),
    {
      watchOptions: {
        enabled: true,
        onChange: (schema) => {
          server.graphql.replaceSchema(buildSchema(schema.join('\n')));
          server.graphql.defineResolvers(resolvers);

          codegenMercurius(server, codegenMercuriusOptions).catch(
            console.error
          );
        },
      },
    }
  );

  await server.register(mercurius, {
    schema,
    resolvers: resolvers,
    loaders: loaders,
    // context: context,
    subscription: true,
    graphiql: true,
  });

  if (!middleware) {
    let address = await server.listen({ host: host, port: port });
    console.log('Fastivite dev server is listening at', address);
  }

  if (graphqlCodegen) {
    codegenMercurius(server, codegenMercuriusOptions).catch(console.error);
  }

  if (graphqlOperationCodegen) {
    try {
      await runCli(
        `--watch --verbose --debug ${graphqlOperationCodegenConfigFile ? `--config ${graphqlOperationCodegenConfigFile}` : ``}`
      );
    } catch (err) { }
  }

  return server;
};
