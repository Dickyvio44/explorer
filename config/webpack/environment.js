const { environment } = require('@rails/webpacker')

if (environment.config.optimization) {
    environment.config.optimization.minimizer[0].options.terserOptions.keep_classnames = true
    environment.config.optimization.minimizer[0].options.terserOptions.keep_fnames = true
    environment.config.optimization.minimizer[0].options.exclude = /.*[a-zA-Z]+Component[.]js$/gm
}

const webpack = require('webpack')
environment.plugins.append(
    'Provide',
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        Popper: ['popper.js', 'default']
    })
)

module.exports = environment
