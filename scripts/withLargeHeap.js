const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withLargeHeap(config) {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults.manifest;
        const application = androidManifest.application[0];

        // Inject the largeHeap attribute into the first application tag
        application.$['android:largeHeap'] = 'true';
        application.$['android:requestLegacyExternalStorage'] = 'true'; // Often useful for ML Models 

        return config;
    });
};
