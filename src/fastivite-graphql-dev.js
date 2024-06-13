import { runCli } from '@graphql-codegen/cli';
import { build as esbuild } from 'esbuild';
import { createDevServer } from 'fastivite';
import { globSync } from 'glob';
import { buildSchema } from 'graphql';
import _ from 'lodash';
import mercurius from 'mercurius';
import { codegenMercurius, loadSchemaFiles } from 'mercurius-codegen';
import { join } from 'path';

/** @type {import('..').GreateGraphqlDevServer} */
const _createGraphqlDevServer = async ({
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
}) => {
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

  /** @type {import('mercurius').MercuriusLoaders} */
  let loaders = {};

  /** @type {import('mercurius').MercuriusContext} */
  let context = (req, rep) => {
    return {};
  };

  let { schema } = loadSchemaFiles(
    graphqlSchemaPattern.map((p) => join(graphqlSchemaCwd, p)),
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
    context: context,
    subscription: true,
    graphiql: true,
  });

  if (!middleware) {
    let address = await server.listen({ host: host, port: parseInt(port) });
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
    } catch (err) {}
  }

  return server;
};

export const createGraphqlDevServer = _createGraphqlDevServer;
export default { createGraphqlDevServer: _createGraphqlDevServer };
