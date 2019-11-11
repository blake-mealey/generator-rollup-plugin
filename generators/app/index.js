const Generator = require(`yeoman-generator`);
const changeCase = require(`change-case`);

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
        let pluginName = this.options.pluginName || answers.pluginName;
        if (pluginName.startsWith(pluginNamePrefix)) {
            pluginName = pluginName.substring(pluginNamePrefix.length)
        } else {
            pluginName = pluginName;
        }
        const packageName = `${pluginNamePrefix}${pluginName}`;

        this.log(`Your plugin's name will be:`, pluginName);
        this.log(`Your package's name will be:`, packageName);
    }
};
