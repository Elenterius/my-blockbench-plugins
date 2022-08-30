(function() {
    // https://www.npmjs.com/package/fscreen ///////////////////////////////////////////////////
    /*
    The MIT License (MIT)

    Copyright (c) 2017 Rafael Pedicini

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */
    const key = {
        fullscreenEnabled: 0,
        fullscreenElement: 1,
        requestFullscreen: 2,
        exitFullscreen: 3,
        fullscreenchange: 4,
        fullscreenerror: 5,
        fullscreen: 6
    };
    const webkit = [
        'webkitFullscreenEnabled',
        'webkitFullscreenElement',
        'webkitRequestFullscreen',
        'webkitExitFullscreen',
        'webkitfullscreenchange',
        'webkitfullscreenerror',
        '-webkit-full-screen',
    ];
    const moz = [
        'mozFullScreenEnabled',
        'mozFullScreenElement',
        'mozRequestFullScreen',
        'mozCancelFullScreen',
        'mozfullscreenchange',
        'mozfullscreenerror',
        '-moz-full-screen',
    ];
    const ms = [
        'msFullscreenEnabled',
        'msFullscreenElement',
        'msRequestFullscreen',
        'msExitFullscreen',
        'MSFullscreenChange',
        'MSFullscreenError',
        '-ms-fullscreen',
    ];
    // so it doesn't throw if no window or document
    const _document = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
    const vendor = (('fullscreenEnabled' in _document && Object.keys(key)) ||
        (webkit[0] in _document && webkit) ||
        (moz[0] in _document && moz) ||
        (ms[0] in _document && ms) ||
        []);
    const fscreen = {
        requestFullscreen: element => element[vendor[key.requestFullscreen]](),
        requestFullscreenFunction: element => element[vendor[key.requestFullscreen]],
        get exitFullscreen() { return _document[vendor[key.exitFullscreen]].bind(_document); },
        get fullscreenPseudoClass() { return `:${vendor[key.fullscreen]}`; },
        addEventListener: (type, handler, options) => _document.addEventListener(vendor[key[type]], handler, options),
        removeEventListener: (type, handler, options) => _document.removeEventListener(vendor[key[type]], handler, options),
        get fullscreenEnabled() { return Boolean(_document[vendor[key.fullscreenEnabled]]); },
        set fullscreenEnabled(val) {},
        get fullscreenElement() { return _document[vendor[key.fullscreenElement]]; },
        set fullscreenElement(val) {},
        get onfullscreenchange() { return _document[`on${vendor[key.fullscreenchange]}`.toLowerCase()]; },
        set onfullscreenchange(handler) { return _document[`on${vendor[key.fullscreenchange]}`.toLowerCase()] = handler; },
        get onfullscreenerror() { return _document[`on${vendor[key.fullscreenerror]}`.toLowerCase()]; },
        set onfullscreenerror(handler) { return _document[`on${vendor[key.fullscreenerror]}`.toLowerCase()] = handler; }
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var button;
    Plugin.register('web_fullscreen', {
        title: 'Fullscreen For (Mobile) Web Browser',
        author: 'Elenterius',
        description: 'Adds a button to the View Menu that allows you to toggle fullscreen display mode in web browsers.\nThis is an alternative for tablets where the PWA App doesn\'t allow landscape display mode.',
        icon: 'fa-expand',
        version: '1.0.0',
		tags: ["Web",],
        variant: 'web',
        onload() {
            button = new Action('fullscreen_toggle', {
                name: 'Web Fullscreen',
                description: 'Toggle Fullscreen of Web Browser.',
                icon: 'fa-expand',
                click: function() {
                    if (!fscreen.fullscreenEnabled) {
                        Blockbench.showQuickMessage("Fullscreen not Supported!", 1500);
                        return;
                    }

                    if (fscreen.fullscreenElement !== null) {
                        fscreen.exitFullscreen();
                    }
                    else {
                        fscreen.requestFullscreen(document.documentElement);
                    }
                }
            });
            MenuBar.addAction(button, 'view');
        },
        onunload() {
            button.delete();
        }
    });

})();