/**
 * @author Elenterius
 * @link https://github.com/Elenterius
 * @copyright Elenterius 2023
 * @license MIT
 */
"use strict";

(function () {
    'use strict';
    const PLUGIN_ID = "template";

    BBPlugin.register(PLUGIN_ID, {
        title: 'Template',
        creation_date: "2023-07-10",
        author: 'Elenterius',
        description: 'Template',
        about: "outdated, use about.md instead"
        icon: 'extension',
        tags: ["Minecraft"],
        version: '0.1.0',
        min_version: "4.8.0",
        max_version: "5.0.0",
        variant: 'both',

        onload() {},
        onunload() {},
        oninstall() {},
		onuninstall() {}
    });

})();