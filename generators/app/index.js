const Generator = require(`yeoman-generator`);
const changeCase = require(`change-case`);
const path = require(`path`);

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        // let the user supply the plugin name as an argument
        this.argument(`pluginName`, {
            desc: `The name of the rollup plugin you want to scaffold`,
            required: false,
            default: null,
            type: arg => changeCase.kebab(arg)
        });
    }

    async prompting() {
        let questions = [];

        // if the user didn't supply the plugin name as an argument, ask them for it
        if (!this.options.pluginName) {
            questions.push({
                type: `input`,
                name: `pluginName`,
                message: `Your plugin name`,
                default: this.appname,
                filter: answer => changeCase.kebab(answer)
            });
        }

        questions = [
            ...questions,
            {
                type: `confirm`,
                name: `configureLinting`,
                message: `Configure linting with ESLint?`,
                default: true
            },
            {
                type: `confirm`,
                name: `configureTesting`,
                message: `Configure testing with AVA, sinon, and nyc?`,
                default: true
            },
            {
                type: `confirm`,
                name: `configureAzurePipelines`,
                message: `Configure CI with Azure Pipelines?`,
                default: true
            }
        ];

        const answers = await this.prompt(questions);

        // Parse out the plugin name from the package name
        const pluginNamePrefix = `rollup-plugin-`;
        this.pluginName = this.options.pluginName || answers.pluginName;
        if (this.pluginName.startsWith(pluginNamePrefix)) {
            this.pluginName = this.pluginName.substring(pluginNamePrefix.length)
        }
        this.packageName = `${pluginNamePrefix}${this.pluginName}`;

        this.configureLinting = answers.configureLinting;
        this.configureTesting = answers.configureTesting;
        this.configureAzurePipelines = answers.configureAzurePipelines;
    }

    async _getGithubUsername() {
        if (this.githubUsername) {
            return this.githubUsername;
        }

        try {
            this.githubUsername = await this.user.github.username();
        } catch { }

        return this.githubUsername;
    }

    _copyTemplates(templatePaths) {
        templatePaths.forEach(async templatePath =>
            this.fs.copyTpl(
                this.templatePath(templatePath),
                this.destinationPath(path.join(path.dirname(templatePath), path.basename(templatePath, `.ejs`))),
                {
                    pluginName: this.pluginName,
                    packageName: this.packageName,
                    configureLinting: this.configureLinting,
                    configureTesting: this.configureTesting,
                    configureAzurePipelines: this.configureAzurePipelines,
                    user: this.user,
                    githubUsername: await this._getGithubUsername(),
                    changeCase
                }
            ));
    }

    writing() {
        // Base files
        this._copyTemplates([
            `src/index.js.ejs`,
            `index.d.ts.ejs`,
            `package.json.ejs`,
            `LICENSE.ejs`,
            `README.md.ejs`,
            `.gitignore.ejs`
        ]);

        // Build
        this._copyTemplates([
            `rollup.config.js.ejs`
        ]);

        // Linting
        if (this.configureLinting) {
            this._copyTemplates([
                `.eslintrc.yml.ejs`
            ]);

            this.fs.extendJSON(this.destinationPath(`package.json`), {
                scripts: {
                    lint: `eslint src tests`
                }
            });
        }

        // Testing
        if (this.configureTesting) {
            this._copyTemplates([
                `tests/index.test.js.ejs`,
                `ava.config.js.ejs`,
                `.nycrc.yml.ejs`
            ]);
        }

        // CI
        if (this.configureAzurePipelines) {
            this._copyTemplates([
                `azure-pipelines.yml.ejs`
            ]);
        }
    }

    install() {
        let devDependencies = [];

        // Build
        devDependencies = [
            ...devDependencies,
            `@babel/core`,
            `@babel/preset-env`,
            `rollup`,
            `rollup-plugin-auto-external`,
            `rollup-plugin-babel`
        ];

        // Linting
        if (this.configureLinting) {
            devDependencies = [
                ...devDependencies,
                `eslint`,
                `eslint-plugin-import`,
                `eslint-config-airbnb-base`
            ];
        }

        // Testing
        if (this.configureTesting) {
            devDependencies = [
                ...devDependencies,
                `ava`,
                `nyc`,
                `sinon`
            ];
        }

        // CI
        if (this.configureAzurePipelines) {
            devDependencies = [
                ...devDependencies,
                `tap-junit`
            ];
        }

        this.npmInstall(devDependencies, { 'save-dev': true });
    }
};
