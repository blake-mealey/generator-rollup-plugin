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
        const questions = [];

        // if the user didn't supply the plugin name as an argument, ask them for it
        if (!this.options.pluginName) {
            questions.push({
                type: `input`,
                name: `pluginName`,
                message: `Your plugin name`,
                default: this.appname,
                filter: answer => changeCase.kebab(answer)
            })
        }

        const answers = await this.prompt(questions);

        // Parse out the plugin name from the package name
        const pluginNamePrefix = `rollup-plugin-`;
        this.pluginName = this.options.pluginName || answers.pluginName;
        if (this.pluginName.startsWith(pluginNamePrefix)) {
            this.pluginName = this.pluginName.substring(pluginNamePrefix.length)
        }
        this.packageName = `${pluginNamePrefix}${this.pluginName}`;

        this.log(`Your plugin's name will be:`, this.pluginName);
        this.log(`Your package's name will be:`, this.packageName);
    }

    _copyTemplates(templatePaths) {
        templatePaths.forEach(async templatePath =>
            this.fs.copyTpl(
                this.templatePath(templatePath),
                this.destinationPath(path.join(path.dirname(templatePath), path.basename(templatePath, `.ejs`))),
                {
                    pluginName: this.pluginName,
                    packageName: this.packageName,
                    user: this.user,
                    githubUsername: await this.user.github.username(),
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
        ]);
    }
};
