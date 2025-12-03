module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@flows': './src/flows/index.ts',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};