import { build as esbuild } from 'esbuild';
import { buildVite } from 'fastivite';
import { readFileSync, rmSync, writeFileSync } from 'fs';
import { loadSchemaFiles } from 'mercurius-codegen';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

let _filename = '';
try {
  _filename = fileURLToPath(import.meta.url);
} catch (err) {
  _filename = __filename;
}

/** @type {import('..').BuildGraphqlServer} */
const _buildGraphqlServer = async (params) => {
  // Build vite
  await buildVite(params);

  // Build graphql server
  let { schema } = loadSchemaFiles(
    params?.graphqlSchemaPattern.map((p) => join(params?.graphqlSchemaCwd, p))
  );

  writeFileSync(`${params?.outDir}/schema.gql`, schema.join('\n\n'));

  // Build fastify server
  let tmpJs = `${params?.outDir}/server.js`;
  writeFileSync(tmpJs, readFileSync(join(dirname(_filename), 'server.js')));
  await esbuild({
    bundle: true,
    minify: true,
    external: ['vite', 'fsevents'],
    format: 'cjs',
    platform: 'node',
    entryPoints: [tmpJs],
    outfile: `${params?.outDir}/server.cjs`,
  });

  rmSync(tmpJs, { recursive: true, force: true });
  rmSync(`${params?.outDir}/server`, { recursive: true, force: true });
};

export const buildGraphqlServer = _buildGraphqlServer;
export default { buildGraphqlServer: _buildGraphqlServer };
