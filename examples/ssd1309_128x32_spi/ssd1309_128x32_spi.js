/**************************************************************************
 This is an example Monochrome OLEDs based on SSD1309 driver adapted from 
 SSD1306 Adafruit Driver.

 SSD1306 examples Written by Limor Fried/Ladyada for Adafruit Industries,
 with contributions from the open source community.

 Adopted to NodeJS by Lyndel R. McGee

 BSD license, check license.txt for more information
 All text above, and the splash screen below must be
 included in any redistribution.
 **************************************************************************/
'use strict';
const Adafruit_GFX_Library = require("@lynniemagoo/adafruit-gfx-library");
const delay = Adafruit_GFX_Library.Utils.sleepMs;

const BASE_PATH = "../../";
const {Adafruit_SSD1309} = require(BASE_PATH + "index");


const {
    testDrawLine,
    testDrawRect,
    testFillRect,
    testDrawCircle,
    testFillCircle,
    testDrawRoundRect,
    testFillRoundRect,
    testDrawTriangle,
    testFillTriangle,
    testDrawChar,
    testDrawStyles,
    testScrollText,
    testDrawBitmap,
    testAnimate,
    LOGO_BMP,
    LOGO_HEIGHT,
    LOGO_WIDTH
} = require("../common/ssd1309_common");


const Adafruit_SPITFT = Adafruit_GFX_Library.Display.Adafruit_SPITFT;
const {Mixin_SPI_Display, SPI_MODES, SPI_DEFAULTS} = Adafruit_GFX_Library.Mixins;


// Use mixin to bind SPI implementation to SSD1309 class.
class Adafruit_SSD1309_SPI extends Mixin_SPI_Display(Adafruit_SSD1309) {};


async function main() {
    //Constants to use for vccSelection - default(SSD1309_SWITCHCAPVCC).
    //
    //const SSD1309_EXTERNALVCC = 0x01;  ///< External display voltage source
    //const SSD1309_SWITCHCAPVCC = 0x02; ///< Gen. display voltage from 3.3V
    const displayOptions = {
        width:128,
        height:32,
        rotation:0,
        /*noSplash:true,*/
        vccSelection:0x02,
        dcGpioNb:24,  // If module requires Data/Clock GPIO, specify it (-1 is default)
        rstGpioNb:12, // If desire is to have hardware reset controlled by this module, 
                      // by this module, set this value. (-1 is default)
                      // if set to -1 then will not be used.
        spiDeviceNumber:1,
        spiMaxSpeedHz:6000000
    }

    const display = new Adafruit_SSD1309_SPI(displayOptions);
    // Startup display - same as original adafruit begin() but options specified in the constructor.
    await display.startup();
    await delay(3000);


    let count = 4, rotation = 0;

    while (count--) {
        await display.setRotation(rotation);

        await testDrawLine(display);

        await testDrawRect(display);
        await testFillRect(display);

        await testDrawCircle(display);
        await testFillCircle(display);

        await testDrawRoundRect(display);
        await testFillRoundRect(display);

        await testDrawTriangle(display);
        await testFillTriangle(display);

        await testDrawChar(display);
        await testDrawStyles(display);
        await testScrollText(display);
        await testDrawBitmap(display);

        // Invert and restore display, pausing in-between
        await display.invertDisplay(true);
        await delay(1000);
        await display.invertDisplay(false);
        await delay(3000);

        // Do 10 seconds of animation.
        await testAnimate(display, LOGO_BMP, LOGO_WIDTH, LOGO_HEIGHT, 10000);
        rotation +=1;
    }
    await delay(3000);
    await display.setRotation(0);
    await display.shutdown();
}
main();