const path = require('path');
const mkdirp = require('mkdirp');

module.exports = class EmitAllPlugin {
    constructor(opts = {}) {
        this.ignorePattern = opts.ignorePattern || /node_modules/;
        this.ignoreExternals = !!opts.ignoreExternals;
        this.path = opts.path;
    }

    shouldIgnore(path) {
        return this.ignorePattern.test(path);
    }

    apply(compiler) {
        compiler.hooks.afterCompile.tapAsync(
            'EmitAllPlugin',
            (compilation, cb) => {
                const { modules } = compilation;
                modules.forEach(mod => {
                    const absolutePath = mod.resource;

                    if (this.ignoreExternals && mod.external) return;
                    if (this.shouldIgnore(absolutePath)) return;

                    // Used for vendor chunk
                    // Excludes MultiModules as well as ContextModules
                    if (!mod._source) return;

                    const source = mod._source._valueAsString;
                    const projectRoot = compiler.context;
                    const out = this.path || compiler.options.output.path;

                    const dest = path.join(
                        out,
                        absolutePath.replace(projectRoot, '')
                    );

                    mkdirp.sync(path.dirname(dest), {
                        fs: compiler.outputFileSystem
                    });

                    compiler.outputFileSystem.writeFile(
                        dest,
                        source || '',
                        err => {
                            if (err) throw err;
                        }
                    );
                });
                cb();
            }
        );
    }
};
