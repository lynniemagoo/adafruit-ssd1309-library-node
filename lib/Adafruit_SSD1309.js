/*!
 * @file Adafruit_SSD1309.js
 *
 * @mainpage NodeJS Port of Arduino library for monochrome OLEDs based on SSD1309 drivers.
 *
 * @section intro_sec Introduction
 *
 * This is documentation for Adafruit's SSD1309 library for monochrome
 * OLED displays: http://www.adafruit.com/category/63_98
 *
 * These displays use I2C or SPI to communicate. I2C requires 2 pins
 * (SCL+SDA) and optionally a RESET pin. SPI requires 4 pins (MOSI, SCK,
 * select, data/command) and optionally a reset pin. Hardware SPI or
 * 'bitbang' software SPI are both supported.
 *
 * Adafruit invests time and resources providing this open source code,
 * please support Adafruit and open-source hardware by purchasing
 * products from Adafruit!
 *
 * @section dependencies Dependencies
 *
 * This library depends on <a
 * href="https://github.com/adafruit/Adafruit-GFX-Library"> Adafruit_GFX</a>
 * being present on your system. Please make sure you have installed the latest
 * version before using this library.
 *
 * @section author Author
 *
 * Written by Limor Fried/Ladyada for Adafruit Industries, with
 * contributions from the open source community.
 *
 * Ported to NodeJs by Lyndel R. McGee.
 *
 * @section license License
 *
 * BSD license, all text above, and the splash screen included below,
 * must be included in any redistribution.
 *
 */

'use strict';
const Adafruit_GFX_Library = require("@lynniemagoo/adafruit-gfx-library");
const Display_Base = Adafruit_GFX_Library.Display.Display_Base;
const {sleepMs, extractOption} = Adafruit_GFX_Library.Utils;
const delay = sleepMs;

const splash1 = {width:0,height:0,data:null};
const splash2 = {width:0,height:0,data:null};
try {
    const splash = require("./splash1");
    splash1.width = splash.splash1_width;
    splash1.height = splash.splash1_height;
    splash1.data = splash.splash1_data;
}catch(ignore) {
}
try {
    const splash = require("./splash2");
    splash2.width = splash.splash2_width;
    splash2.height = splash.splash2_height;
    splash2.data = splash.splash2_data;
}catch(ignore) {
}


const toInt = Math.trunc;


//==========================================================================================================================================
//==========================================================================================================================================
// SSD1309 Display Instructions from Datasheet.
//==========================================================================================================================================
//==========================================================================================================================================
const SSD1309_SET_START_LINE                       = 0x00;
const SSD1309_MEMORY_MODE                          = 0x20; // 0x02 [reset] 0x00 - Horizontal addressing; 0x01 - Vertical addressing 0x02 - Page Addressing; 0x03 - Invalid
const SSD1309_COLUMN_ADDR                          = 0x21; // Used only when Memory Mode = 0x00 or 0x01 (start 0x00 end 0x7F [reset]);
const SSD1309_PAGE_ADDR                            = 0x22; // Used only when Memory Mode = 0x00 or 0x01 (start 0x00 end 0x07 [reset]);

const SSD1309_RIGHT_HORIZONTAL_SCROLL              = 0x26;
const SSD1309_LEFT_HORIZONTAL_SCROLL               = 0x27;
const SSD1309_VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL = 0x29;
const SSD1309_VERTICAL_AND_LEFT_HORIZONTAL_SCROLL  = 0x2A;
const SSD1309_DEACTIVATE_SCROLL                    = 0x2E;
const SSD1309_ACTIVATE_SCROLL                      = 0x2F;

const SSD1309_SET_CONTRAST                         = 0x81; // 0x7F [reset]
const SSD1309_CHARGE_PUMP                          = 0x8D;

const SSD1309_SET_VERTICAL_SCROLL_AREA             = 0xA3;
const SSD1309_DISPLAY_ALL_ON_RESUME                = 0xA4;
const SSD1309_DISPLAY_ALL_ON_IGNORE                = 0xA5;

const SSD1309_NORMAL_DISPLAY                       = 0xA6;
const SSD1309_INVERT_DISPLAY                       = 0xA7;

const SSD1309_SET_MULTIPLEX                        = 0xA8;

const SSD1309_DISPLAY_OFF                          = 0xAE;
const SSD1309_DISPLAY_ON                           = 0xAF;

const SSD1309_SEG_REMAP_NORMAL                     = 0xA0; // Used in conjunction with COM_SCAN_INC to rotate display such that Top of display is same side as the connection strip.
const SSD1309_SEG_REMAP_FLIP                       = 0xA1; // Used in conjunction with COM_SCAN_DEC to rotate display such that Top of display is opposite side of the connection strip.
const SSD1309_COM_SCAN_INC                         = 0xC0; // Normal Y axis.  (Top of display is same side as connection strip)
const SSD1309_COM_SCAN_DEC                         = 0xC8; // Inverted Y axis (Top of display is opposite side of connection strip.

const SSD1309_SET_DISPLAY_OFFSET                   = 0xD3; // sets the offset of the row data (wraps)
const SSD1309_SET_DISPLAY_CLOCK_DIV                = 0xD5;
const SSD1309_SET_PRECHARGE                        = 0xD9; // 0x02 [reset]
const SSD1309_SET_COM_PINS                         = 0xDA;
const SSD1309_SET_VCOM_DETECT                      = 0xDB;

//==========================================================================================================================================
//==========================================================================================================================================
const SSD1309_EXTERNALVCC = 0x01;  ///< External display voltage source
const SSD1309_SWITCHCAPVCC = 0x02; ///< Gen. display voltage from 3.3V
const ST_CMD_DELAY = 0x80 // special signifier for command lists

const SSD1309_INIT_SEQ_1 = [
    2,                                      // 2 commands
    SSD1309_DISPLAY_OFF,            0x80,   // Display Off - No Args, no delay.
    0xFF,
    SSD1309_SET_DISPLAY_CLOCK_DIV,  0x01,   // ClockDiv - 1 Arg, no delay.
        0x80,                               // Width
];

const SSD1309_INIT_SEQ_2 = [
    3,                                      // 3 commands
    SSD1309_MEMORY_MODE,            0x01,   // Memory Mode - 1 Arg, no delay.
    0x00,                                   // 0x0 act like ks0108 - 0x02 is 0 degree rotation.
    SSD1309_SEG_REMAP_FLIP,         0x00,   // Segment Remap Flip - No Args, no delay.
    SSD1309_COM_SCAN_DEC,           0x00    // Com Scan DEC - No Args, no delay.
];


const SSD1309_INIT_SEQ_3 = [
    4,                                      // 4 commands
    SSD1309_SET_VCOM_DETECT,        0x01,   // Vcom Detect = 1 Arg, no delay.
        0x40,
    SSD1309_DISPLAY_ALL_ON_RESUME,  0x00,   // DisplayAllOnResume - No Args, no delay.
    SSD1309_NORMAL_DISPLAY,         0x00,   // NormalDisplay - No Args, no delay.
    SSD1309_DEACTIVATE_SCROLL,      0x00    // DeactivateScroll - No Args, no delay.
];


/*
// Deprecated size stuff for backwards compatibility with old sketches
#if defined SSD1309_128_64
#define SSD1309_LCDWIDTH 128 ///< DEPRECATED: width w/SSD1309_128_64 defined
#define SSD1309_LCDHEIGHT 64 ///< DEPRECATED: height w/SSD1309_128_64 defined
#endif
#if defined SSD1309_128_32
#define SSD1309_LCDWIDTH 128 ///< DEPRECATED: width w/SSD1309_128_32 defined
#define SSD1309_LCDHEIGHT 32 ///< DEPRECATED: height w/SSD1309_128_32 defined
#endif
#if defined SSD1309_96_16
#define SSD1309_LCDWIDTH 96  ///< DEPRECATED: width w/SSD1309_96_16 defined
#define SSD1309_LCDHEIGHT 16 ///< DEPRECATED: height w/SSD1309_96_16 defined
#endif
*/

const SSD1309_BLACK = 0;
const SSD1309_WHITE = 1;
const SSD1309_INVERSE = 2;

const BLACK = SSD1309_BLACK;
const WHITE = SSD1309_WHITE;
const INVERSE = SSD1309_INVERSE;

// Used for VLine functions below.
const SSD1309_VLINE_PRE_MASK = [0x00, 0x80, 0xC0, 0xE0, 0xF0, 0xF8, 0xFC, 0xFE];
const SSD1309_VLINE_POST_MASK = [0x00, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F];


const _debug = false;


class Adafruit_SSD1309 extends Display_Base {
    /**************************************************************************/
    /*!
        @brief  Constructor for SSD1309 OLED displays.
                a series of LCD commands stored in PROGMEM byte array.
        @param  options  Object specifying options to use for the display

                options.vccSelection (default SSD1309_SWITCHCAPVCC(0x02)
                   VCC selection. Pass SSD1309_SWITCHCAPVCC (0x02) to generate the display
                   voltage (step up) from the 3.3V source, or SSD1309_EXTERNALVCC (x01)
                   otherwise. Most situations with Adafruit SSD1309 breakouts will
                   want SSD1309_SWITCHCAPVCC.
    */
    /**************************************************************************/
    constructor(options) {
        super(options);
        const self = this;

        // This is a bit of a hack for fine-grained control of SPI Mixin.
        // When using SPI Mixin, this display requires that DC GPIO be set low for command data writes.
        // In the original Adafruit implementation, all command data was sent 1 byte at a time using ssd1309_command1.
        // Here, we do this differently and send multiple bytes of data at a time so this flag is necessary.
        self._dcGpioLowForCommandData = true;


        // Extract option and ensure if not specified, we specify value of SSD1309_SWITCHCAPVCC (0x02).
        // Some Adafruit displays can use EXTERNALVCC to generate OLED power.  Most do not so we default the value to internal VCC Lift.
        self._vccSelection = extractOption(options, "vccSelection", SSD1309_SWITCHCAPVCC);

        // Extract option and ensure if not specified, we specify value false to force splash screen.
        self._noSplash = !!extractOption(options, "noSplash", false);

        // Initialize with default value for the 128x32 display with 0x8F.
        self._contrast = 0x8F;
        self._colOffset = extractOption(options, "colOffset", 0);
        self._pageOffset = extractOption(options, "pageOffset", 0);
        self._displayOffset = extractOption(options, "displayOffset", 0);
        self._startLine = extractOption(options, "startLine", 0);

        self._buffer = new Uint8Array(self.WIDTH * toInt((self.HEIGHT + 7) / 8));
    }


    //===============================================================
    // <BEGIN> NON - Adafruit implementations
    //               Startup/Shutdown Invocation Order - See Display_Base class
    //
    //               _preStartup
    //               begin()
    //               _postStartup (turn off display or other things)
    //
    //               _preShutdown
    //               // currently nothing defined for middle.
    //               _postShutdown
    //===============================================================
    _preStartup() {
        const self = this;
        self._hardwareStartup();   // (setup SPI, I2C)
        self._hardwareReset();     // (hardware reset for SPI)
        return self;
    }


    _postStartup() {
        return this;
    }


    _preShutdown() {
        const self = this;
        self._ssd1309_command1(SSD1309_DEACTIVATE_SCROLL); // DeactivateScroll
        self.setDisplayOnOff(false);  // Turn off screen
        return self;
    }


    _postShutdown() {
        const self = this;
        self._hardwareShutdown(); // (release SPI, I2C hardware)
        return self;
    }


    setDisplayOnOff(aValue) {
        return ((!!aValue) ? this._onDisplayOn() : this._onDisplayOff());
    }


    _onDisplayOn() {
        const self = this;
        self._ssd1309_command1(SSD1309_DISPLAY_ALL_ON_RESUME);
        self._ssd1309_command1(SSD1309_DISPLAY_ON);
        return self;
    }

    _onDisplayOff() {
        const self = this;
        self._ssd1309_command1(SSD1309_DISPLAY_OFF);
        return self;
    }
    //===============================================================
    // <END> NON - Adafruit implementations
    //===============================================================


    /**************************************************************************/
    /*!
        @brief  Companion code to the initiliazation tables. Reads and issues
                a series of LCD commands stored in PROGMEM byte array.
        @param  values  Flash memory array with commands and data to send
        @return  this
    */
    /**************************************************************************/
    _executeInitSequence(values) {
        const self = this;
        let numCommands, cmd, numArgs, delayRequired, ms, data;
        let index = 0;

        numCommands = values[index++];// Number of commands to follow
        while (numCommands--) {              // For each command...
            cmd = values[index++];       // Read command
            numArgs = values[index++];   // Number of args to follow
            delayRequired = numArgs & ST_CMD_DELAY;       // If hibit set, delay follows args
            numArgs &= ~ST_CMD_DELAY;          // Mask out delay bit
            data = numArgs ? values.slice(index, index + numArgs) : null;
            this._ssd1309_command1(cmd, data);
            index += numArgs;

            if (delayRequired) {
                ms = values[index++]; // Read post-command delay time (ms)
                if (ms == 0xFF)
                    ms = 500; // If 255, delay for 500 ms
                const doWork = async _ => {
                    await delay(ms);
                };
                self._chain(doWork);
            }
        }
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Modified Adafruit startup function - Options are passed in the
                constructor.
        @return  this
    */
    /**************************************************************************/
    begin() {
        const self = this, w = self.WIDTH, h = self.HEIGHT, rotation = self.rotation, vccSelection = self._vccSelection;

        self._executeInitSequence(SSD1309_INIT_SEQ_1);

        // Multiplex is based on screen height
        self._ssd1309_command1(SSD1309_SET_MULTIPLEX, [(self.HEIGHT - 1) & 0xFF]);

        let contrast = self._contrast,
            pageOffset = self._pageOffset,
            colOffset = self._colOffset,
            displayOffset = self._displayOffset,
            startLine = self._startLine,
            comPins = 0x02;

        // ComPins and Precharge settings vary based on display and/or EXTERNALVCC value in vccSelection
        if ((self.WIDTH == 128) && (self.HEIGHT == 32)) {
            comPins = 0x02;
            contrast = 0x8F;
        } else if ((self.WIDTH == 128) && (self.HEIGHT == 64)) {
            comPins = 0x12;
            // (if external VCC, then 0x9F, otherwise 0xCF)
            contrast = (SSD1309_EXTERNALVCC === vccSelection) ? 0x9F : 0xCF;
        } else if ((self.WIDTH == 96) && (self.HEIGHT == 16)) {
            comPins = 0x02;
            contrast = (SSD1309_EXTERNALVCC === vccSelection) ? 0x10 : 0xAF;
        } else {
            // TBD.
            comPins = 0x02;
            contrast = 0x8F;
        }

        // Update values for use by other functions.
        self._contrast = contrast;
        self._pageOffset = pageOffset;
        self._colOffset = colOffset;
        self._displayOffset = displayOffset;
        self._startLine = startLine;
        
        // Set charge pump val (if external VCC, then 0x10, otherwise 0x14)
        self._ssd1309_command1(SSD1309_CHARGE_PUMP,[(SSD1309_EXTERNALVCC === vccSelection) ? 0x10 : 0x14]);


        self._ssd1309_command1(SSD1309_SET_DISPLAY_OFFSET, [displayOffset & 0xFF]);
        self._ssd1309_command1(SSD1309_SET_START_LINE, [startLine & 0xFF]);


        self._ssd1309_command1(SSD1309_SET_COM_PINS,[comPins & 0xFF]);
        self._ssd1309_command1(SSD1309_SET_CONTRAST,[contrast & 0xFF]);
        self._ssd1309_command1(SSD1309_SET_PRECHARGE,[(SSD1309_EXTERNALVCC === vccSelection) ? 0x22 : 0xF1]);

        self._executeInitSequence(SSD1309_INIT_SEQ_2);
        self._executeInitSequence(SSD1309_INIT_SEQ_3);
        self.setRotation(rotation);

        if (self._noSplash) {
            self.clearDisplay();
        } else {
            const splash = (h > 32) ? splash1 : splash2;
            if (splash.data && splash.width && splash.height) {
                self.draw1BitBitmap(toInt((w  - splash.width ) / 2),
                                    toInt((h  - splash.height) / 2),
                                    splash.data, 
                                    splash.width, 
                                    splash.height, SSD1309_WHITE);
            }
        }
        self.display();


        self._ssd1309_command1(SSD1309_DISPLAY_ON);
        return self;
    }


    // REFRESH DISPLAY ---------------------------------------------------------

    /**************************************************************************/
    /*!
        @brief  Push data currently in RAM to SSD1309 display.
        @return this
        @note   Drawing operations are not visible until this function is
                called. Call after each graphics command, or after a whole set
                of graphics commands, as best needed by one's own application.
    */
    /**************************************************************************/
    display() {
        const self = this, 
              w = self.WIDTH, 
              h = self.HEIGHT, 
              colOffset = self._colOffset, 
              pageOffset = self._pageOffset,
              buffer = self._buffer;

        const pageEnd = (pageOffset + toInt((h + 7) / 8)) & 0xFF,
              pagesPerWrite = 1,
              bytesPerPage = w,
              col = 0x00 + colOffset;

        for (let page = pageOffset, index = 0x00; page < pageEnd; page++,index+=bytesPerPage) {
            self._ssd1309_command1(SSD1309_COLUMN_ADDR, [
                    col,                   // column start address
                    col + bytesPerPage - 1 // column end address
                ]);
            self._ssd1309_command1(SSD1309_PAGE_ADDR, [
                    page,                   // page start address
                    page + pagesPerWrite    // page end address
                ]);
            // write buffer data one page at a time.
            self._ssd1309_data(buffer.subarray(index, index + (bytesPerPage * pagesPerWrite)));
        }
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Clear the contents of display buffer. (set all pixels to off.)
                Follow up with a call to display(), or with other graphics
                commands as needed by one's own application.
        @return this
        @note   Changes buffer contents only, no immediate effect on display.
    */
    /**************************************************************************/
    clearDisplay() {
        return this.fillScreen(SSD1309_BLACK);
    }

    
    /**************************************************************************/
    /*!
        @brief  Fill the display and buffer completely with one color
        @param  color Color to fill with.
        @returns  this
    */  
    /**************************************************************************/
    // overrides fillScreen() in Adafruit_GFX base class.
    fillScreen(color) {
        const self = this,
            buffer = self._buffer;
        if (buffer) {
            // If we have either MONOOLED_WHITE fill with all 1 bits, otherwise all 0 bits.
            color = (color & 1) ? 0xFF : 0x00;
            buffer.fill(color);
        }
        return self;
    }


    // OTHER HARDWARE SETTINGS -------------------------------------------------

    /**************************************************************************/
    /*!
        @brief  Enable or disable display invert mode (white-on-black vs
                black-on-white).
        @param  i
                If true, switch to invert mode (black-on-white), else normal
                mode (white-on-black).
        @return 'this' object.
        @note   This has an immediate effect on the display, no need to call the
                display() function -- buffer contents are not changed, rather a
                different pixel mode of the display hardware is used. When
                enabled, drawing SSD1309_BLACK (value 0) pixels will actually draw
       white, SSD1309_WHITE (value 1) will draw black.
   */
    /**************************************************************************/
   invertDisplay(boolValue) {
        const self = this;
        //self.TRANSACTION_START
        self._ssd1309_command1(!!boolValue ? SSD1309_INVERT_DISPLAY : SSD1309_NORMAL_DISPLAY);
        //self.TRANSACTION_END
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Dim the display.
        @param  dim
                true to enable lower brightness mode, false for full brightness.
        @return this
        @note   This has an immediate effect on the display, no need to call the
                display() function -- buffer contents are not changed.
    */
    /**************************************************************************/
    dim(boolValue) {
        const self = this;
        //self.TRANSACTION_START
        self._ssd1309_command1(!!boolValue ? 0x00 : self._contrast);
        //self.TRANSACTION_END
        return self;
    }


    /***********************************************/
    /***********************************************/
    /***********************************************/
    /* GFX implementations */


    // DRAWING FUNCTIONS -------------------------------------------------------

    /**************************************************************************/
    /*!
        @brief  Set/clear/invert a single pixel. This is also invoked by the
                Adafruit_GFX library in generating many higher-level graphics
                primitives.
        @param  x
                Column of display -- 0 at left to (screen width - 1) at right.
        @param  y
                Row of display -- 0 at top to (screen height -1) at bottom.
        @param  color
                Pixel color, one of: SSD1309_BLACK, SSD1309_WHITE or
                SSD1309_INVERSE.
        @return this
        @note   Changes buffer contents only, no immediate effect on display.
                Follow up with a call to display(), or with other graphics
                commands as needed by one's own application.
    */
    /**************************************************************************/
    drawPixel(x, y, color) {
        //console.log("drawPixel(x:%d, y:%d, color:%d)", x, y, color);
        const self = this,
            rotation = self.rotation,
            WIDTH = self.WIDTH,
            HEIGHT = self.HEIGHT,
            w = self.width(),
            h = self.height(),
            buffer = self._buffer;

        if ((x >= 0) && (x < w) && (y >= 0) && (y < h)) {
            // Pixel is in-bounds. Rotate coordinates if needed.
            switch (rotation) {
                case 1:
                    //ssd1309_swap(x, y);
                    (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                    x = WIDTH - x - 1;
                    break;
                case 2:
                    x = WIDTH - x - 1;
                    y = HEIGHT - y - 1;
                    break;
                case 3:
                    //ssd1309_swap(x, y);
                    (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                    y = HEIGHT - y - 1;
                    break;
            }
            const index = x + toInt(y / 8) * WIDTH;
            const value = (1 << (y & 7));
            //console.log("x:%d y:%d color:%d index:%d, value:%d", x, y, color, index, value);
            switch (color) {
                case SSD1309_WHITE:
                    buffer[index] |= value;
                    break;
                case SSD1309_BLACK:
                    buffer[index] &= ~value;
                    break;
                case SSD1309_INVERSE:
                    buffer[index] ^= value;
                    break;
            }
        }
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Draw a horizontal line. This is also invoked by the Adafruit_GFX
                library in generating many higher-level graphics primitives.
        @param  x
                Leftmost column -- 0 at left to (screen width - 1) at right.
        @param  y
                Row of display -- 0 at top to (screen height -1) at bottom.
        @param  w
                Width of line, in pixels.
        @param  color
                Line color, one of: SSD1309_BLACK, SSD1309_WHITE or SSD1309_INVERSE.
        @return this
        @note   Changes buffer contents only, no immediate effect on display.
                Follow up with a call to display(), or with other graphics
                commands as needed by one's own application.
    */
    /**************************************************************************/
    drawFastHLine(x, y, w, color) {
        const self = this,
            rotation = self.rotation,
            WIDTH = self.WIDTH,
            HEIGHT = self.HEIGHT;
        //console.log("SSD1309::drawFastHLine(x:%d, y:%d, w:%d, color:%d)", x, y, w, color);
        //throw new Error("stop");
        let bSwap = false;
        switch (rotation) {
            case 1:
                // 90 degree rotation, swap x & y for rotation, then invert x
                bSwap = true;
                //ssd1309_swap(x, y);
                (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                x = WIDTH - x - 1;
                break;
            case 2:
                // 180 degree rotation, invert x and y, then shift y around for height.
                x = WIDTH - x - 1;
                y = HEIGHT - y - 1;
                x -= (w - 1);
                break;
            case 3:
                // 270 degree rotation, swap x & y for rotation,
                // then invert y and adjust y for w (not to become h)
                bSwap = true;
                //ssd1309_swap(x, y);
                (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                y = HEIGHT - y - 1;
                y -= (w - 1);
            break;
        }

        return (bSwap) ? self._drawFastVLineInternal(x, y, w, color) : self._drawFastHLineInternal(x, y, w, color);
    }


    /**************************************************************************/
    /*!
        @brief  Draw a vertical line. This is also invoked by the Adafruit_GFX
                library in generating many higher-level graphics primitives.
        @param  x
                Column of display -- 0 at left to (screen width -1) at right.
        @param  y
                Topmost row -- 0 at top to (screen height - 1) at bottom.
        @param  h
                Height of line, in pixels.
        @param  color
                Line color, one of: SSD1309_BLACK, SSD1309_WHITE or SSD1309_INVERSE.
        @return this
        @note   Changes buffer contents only, no immediate effect on display.
                Follow up with a call to display(), or with other graphics
                commands as needed by one's own application.
    */
    /**************************************************************************/
    drawFastVLine(x, y, h, color) {
        const self = this,
            rotation = self.rotation,
            WIDTH = self.WIDTH,
            HEIGHT = self.HEIGHT;
        //console.log("SSD1309::drawFastVLine(x:%d, y:%d, h:%d, color:%d)", x, y, h, color);
        let bSwap = false;
        switch (rotation) {
            case 1:
                // 90 degree rotation, swap x & y for rotation,
                // then invert x and adjust x for h (now to become w)
                bSwap = true;
                //ssd1309_swap(x, y);
                (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                x = WIDTH - x - 1;
                x -= (h - 1);
                break;
            case 2:
                // 180 degree rotation, invert x and y, then shift y around for height.
                x = WIDTH - x - 1;
                y = HEIGHT - y - 1;
                y -= (h - 1);
                break;
            case 3:
                // 270 degree rotation, swap x & y for rotation, then invert y
                bSwap = true;
                //ssd1309_swap(x, y);
                (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                y = HEIGHT - y - 1;
                break;
        }

        return (bSwap) ? self._drawFastHLineInternal(x, y, h, color) : self._drawFastVLineInternal(x, y, h, color);
    }


    // SCROLLING FUNCTIONS -----------------------------------------------------

    /**************************************************************************/
    /*!
        @brief  Activate a right-handed scroll for all or part of the display.
        @param  start
                First row.
        @param  stop
                Last row.
        @return this
    */
    /**************************************************************************/
    // To scroll the whole display, run: display.startscrollright(0x00, 0x0F)
    startscrollright(start, stop) {
        const self = this;
        self._startScrollInternal("right", start, stop);
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Activate a left-handed scroll for all or part of the display.
        @param  start
                First row.
        @param  stop
                Last row.
        @return this
    */
    /**************************************************************************/
    // To scroll the whole display, run: display.startscrollleft(0x00, 0x0F)
    startscrollleft(start, stop) {
        const self = this;
        self._startScrollInternal("left", start, stop);
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Activate a diagonal scroll for all or part of the display.
        @param  start
                First row.
        @param  stop
                Last row.
        @return this
    */
    /**************************************************************************/
    // display.startscrolldiagright(0x00, 0x0F)
    startscrolldiagright(start, stop) {
        const self = this;
        self._startScrollInternal("right diagonal", start, stop);
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Activate alternate diagonal scroll for all or part of the display.
        @param  start
                First row.
        @param  stop
                Last row.
        @return this
    */
    /**************************************************************************/
    // To scroll the whole display, run: display.startscrolldiagleft(0x00, 0x0F)
    startscrolldiagleft(start, stop) {
    //public
        const self = this;
        self._startScrollInternal("left diagonal", start, stop);
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Cease a previously-begun scrolling action.
        @return this
    */
    /**************************************************************************/
    stopscroll() {
        const self = this;
        //self.TRANSACTION_START
        self._ssd1309_command1(SSD1309_DEACTIVATE_SCROLL);
        //self.TRANSACTION_END
        return self;
    }


    // A public version of ssd1309_command1(), for existing user code that
    // might rely on that function. This encapsulates the command transfer
    // in a transaction start/end, similar to old library's handling of it.
    /**************************************************************************/
    /*!
        @brief  Issue a single low-level command directly to the SSD1309
                display with possible data, bypassing the library.
        @param  cmd
                Command to issue (0x00 to 0xFF, see datasheet).
        @param  data
                Array of data bytes to send.
        @return this
    */
    /**************************************************************************/
    ssd1309_command(cmd, data) {
        const self = this;
        self._ssd1309_command1(cmd, data);
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Return color of a single pixel in display buffer.
        @param  x
                Column of display -- 0 at left to (screen width - 1) at right.
        @param  y
                Row of display -- 0 at top to (screen height -1) at bottom.
        @return true if pixel is set (usually SSD1309_WHITE, unless display invert
       mode is enabled), false if clear (SSD1309_BLACK).
        @note   Reads from buffer contents; may not reflect current contents of
                screen if display() has not been called.
    */
    /**************************************************************************/
    getPixel(x,y) {
        const self = this,
            buffer = self._buffer,
            rotation = self.rotation,
            WIDTH = self.WIDTH,
            HEIGHT = self.HEIGHT,
            w = self.width(),
            h = self.height();
        if ((x >= 0) && (x < w) && (y >= 0) && (y < h)) {
            // Pixel is in-bounds. Rotate coordinates if needed.
            switch (getRotation()) {
                case 1:
                    //ssd1309_swap(x, y);
                    (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                    x = WIDTH - x - 1;
                    break;
                case 2:
                    x = WIDTH - x - 1;
                    y = HEIGHT - y - 1;
                    break;
                case 3:
                    //ssd1309_swap(x, y);
                    (((x) ^= (y)), ((y) ^= (x)), ((x) ^= (y))); // No-temp-var swap operation
                    y = HEIGHT - y - 1;
                    break;
            }
            return !!(buffer[x + toInt(y / 8) * WIDTH] & (1 << (y & 7)));
        }
        return false; // Pixel out of bounds
    }


    /**************************************************************************/
    /*!
        @brief  Get base address of display buffer for direct reading or writing.
        @returns  A reference to the allocated Uint8Array buffer
                  column-major, columns padded to full byte boundary if needed.
    */
    /**************************************************************************/
    getBuffer() {
        return this._buffer;
    }


    /**************************************************************************/
    /*!
        @brief Issue single command to SSD1309 with possible data, using I2C or hard/soft SPI as
               needed. Because command calls are often grouped, SPI transaction and
               selection must be started/ended in calling function for efficiency. This is a
               protected function, not exposed (see ssd1309_command() instead).

        @param  cmd
                Command to issue (0x00 to 0xFF, see datasheet).
        @param  data
                Array of data bytes to send.
        @return this
        @note - this is identical to legacy adafruit ssd
    */
    /**************************************************************************/
    _ssd1309_command1(cmd, data) {
        const self = this;
        self.startWrite();
        // use hardware abstraction to write command/data.
        self._hardwareWriteCommand(cmd, data);
        self.endWrite();
        return self;
    }


    // non-adafruit implementation - provided for hardware abstraction using mixin.
    _ssd1309_data(data) {
        const self = this;
        self.startWrite();
        // use hardware abstraction to write data.
        self._hardwareWriteData(data);
        self.endWrite();
        return self;
    }


    /*!
        @brief  Draw a horizontal line with a width and color. Used by public
       methods drawFastHLine,drawFastVLine
            @param x
                       Leftmost column -- 0 at left to (screen width - 1) at right.
            @param y
                       Row of display -- 0 at top to (screen height -1) at bottom.
            @param w
                       Width of line, in pixels.
            @param color
                   Line color, one of: SSD1309_BLACK, SSD1309_WHITE or
       SSD1309_INVERSE.
        @return this
        @note   Changes buffer contents only, no immediate effect on display.
                Follow up with a call to display(), or with other graphics
                commands as needed by one's own application.
    */
    _drawFastHLineInternal(x, y, w, color) {
        const self = this,
            WIDTH = self.WIDTH,
            HEIGHT = self.HEIGHT,
            buffer = self._buffer;
        //console.log("SSD1309::_drawFastHLineInternal(x:%d, y:%d, w:%d, color:%d)", x, y, w, color);

        if ((y >= 0) && (y < HEIGHT)) { // Y coord in bounds?
            if (x < 0) {                  // Clip left
                w += x;
                x = 0;
            }
            if ((x + w) > WIDTH) { // Clip right
                w = (WIDTH - x);
            }
            if (w > 0) { // Proceed only if width is positive
                let index = x + toInt(y / 8) * WIDTH;
                const value = (1 << (y & 7));
                //console.log("x:%d y:%d color:%d index:%d, value:%d", x, y, color, index, value);
                switch (color) {
                    case SSD1309_WHITE:
                        while(w--)
                            buffer[index++] |= value;
                        break;
                    case SSD1309_BLACK:
                        while(w--)
                            buffer[index++] &= ~value;
                        break;
                    case SSD1309_INVERSE:
                        while(w--)
                            buffer[index++] ^= value;
                        break;
                }
            }
        }
        return self;
    }


    /**************************************************************************/
    /*!
        @brief  Draw a vertical line with a width and color. Used by public method
                drawFastHLine,drawFastVLine
        @param x
                   Leftmost column -- 0 at left to (screen width - 1) at right.
        @param y
                   Row of display -- 0 at top to (screen height -1) at bottom.
        @param h height of the line in pixels
        @param color
                   Line color, one of: SSD1309_BLACK, SSD1309_WHITE or
                   SSD1309_INVERSE.
        @return this
        @note   Changes buffer contents only, no immediate effect on display.
                Follow up with a call to display(), or with other graphics
                commands as needed by one's own application.
    */
    /**************************************************************************/
    _drawFastVLineInternal(x, y, h, color) {
        const self = this,
            WIDTH = self.WIDTH,
            HEIGHT = self.HEIGHT,
            buffer = self._buffer;
        //console.log("SSD1309::drawFastVLineInternal(x:%d, y:%d, h:%d, color:%d)", x, y, h, color);
        if ((x >= 0) && (x < WIDTH)) { // X coord in bounds?
            if (y < 0) { // Clip top
                h += y;
                y = 0;
            }
            if ((y + h) > HEIGHT) { // Clip bottom
                h = (HEIGHT - y);
            }
            if (h > 0) { // Proceed only if height is now positive
                // this display doesn't need ints for coordinates,
                // use local byte registers for faster juggling
                let yTemp = y, hTemp = h;
                let index = x + toInt(yTemp / 8) * WIDTH;
                let mod = yTemp & 7;
                const value = (1 << (yTemp & 7));

                // do the first partial byte, if necessary - this requires some masking
                if (mod) {
                    // mask off the high n bits we want to set
                    mod = 8 - mod;
                    // note - lookup table results in a nearly 10% performance
                    // improvement in fill* functions
                    // uint8_t mask = ~(0xFF >>> mod);
                    let mask = SSD1309_VLINE_PRE_MASK[mod];
                    // adjust the mask if we're not going to reach the end of this byte
                    if (hTemp < mod)
                        mask &= (0XFF >>> (mod - hTemp));

                    switch (color) {
                        case SSD1309_WHITE:
                            buffer[index] |= mask;
                            break;
                    case SSD1309_BLACK:
                            buffer[index] &= ~mask;
                            break;
                    case SSD1309_INVERSE:
                          buffer[index] ^= mask;
                          break;
                    }
                    index += WIDTH;
                }

                if (hTemp >= mod) { // More to go?
                    hTemp -= mod;
                    // Write solid bytes while we can - effectively 8 rows at a time
                    if (hTemp >= 8) {
                        if (color == SSD1309_INVERSE) {
                            // separate copy of the code so we don't impact performance of
                            // black/white write version with an extra comparison per loop
                            do {
                                buffer[index] ^= 0xFF; // Invert byte
                                index += WIDTH; // Advance index 8 rows
                                hTemp -= 8;      // Subtract 8 rows from height
                            } while (hTemp >= 8);
                        } else {
                            // store a local value to work with
                            let val = (color != SSD1309_BLACK) ? 0xFF : 0x00;
                            do {
                              buffer[index] = val;   // Set byte
                              index += WIDTH; // Advance index 8 rows
                              hTemp -= 8;      // Subtract 8 rows from height
                            } while (hTemp >= 8);
                        }
                    }

                    if (hTemp) { // Do the final partial byte, if necessary
                        mod = hTemp & 7;
                        // this time we want to mask the low bits of the byte,
                        // vs the high bits we did above
                        // uint8_t mask = (1 << mod) - 1;
                        // note - lookup table results in a nearly 10% performance
                        // improvement in fill* functions
                        let mask = SSD1309_VLINE_POST_MASK[mod];
                        switch (color) {
                            case SSD1309_WHITE:
                                buffer[index] |= mask;
                                break;
                            case SSD1309_BLACK:
                                buffer[index]  &= ~mask;
                                break;
                            case SSD1309_INVERSE:
                                buffer[index]  ^= mask;
                                break;
                        }
                    }
                }
            } // endif positive height
        } // endif x in bounds
        return self;
    }


    // This function is a combination of various adafruit functions all rolled up into 1
    // Turns out if you specify diagonal scrolling, if the vertical increment is set to 0,
    // diagonal scrolling behaves same as horizontal scrolling.
    // activate scrolling for rows start through stop
    // TODO - URGENT - WORK IN PROGRESS. - if rotation == 2 must flip start and stop page.

    // private
    _startScrollInternal(dir, startPage, stopPage) {
        const self = this,
            WIDTH = self.WIDTH & 0xFF,
            HEIGHT = self.HEIGHT & 0xFF;

        //000b – 5 frames - choppier than 4 frames
        //001b – 64 frames - slower than 25
        //010b – 128 frames -
        //011b – 256 frames
        //100b – 3 frames - very smooth
        //101b – 4 frames - a little choppy.
        //110b – 25 frame - teensie bit choppy but not bad.
        //111b – 2 frame - very smooth and fast
        let frames = 0x07;
        let verticalIncrement = 0x01;
        let horizontalIncrement = 0x01;
        verticalIncrement = Math.min(verticalIncrement, HEIGHT);

        self._ssd1309_command1(SSD1309_DEACTIVATE_SCROLL);
        self._ssd1309_command1(SSD1309_SET_VERTICAL_SCROLL_AREA, [0x00, HEIGHT]);
        let scrollCommand = SSD1309_VERTICAL_AND_LEFT_HORIZONTAL_SCROLL;

        const cmdSeq = [];


        // Per the datasheet, if the vertical increment is set to 0,  
        // VERTICAL_AND_LEFT_HORIZONTAL_SCROLL is same as LEFT_HORIZONTAL_SCROLL
        // VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL is same as RIGHT_HORIZONTAL_SCROLL
        // Based on this, we can simplify the code to only send the VERTICAL_AND_LEFT_HORIZONTAL_SCROLL or VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL commands along with a vertical offset of 0x00.
        // Note that SSD1309 expects a Horizontal Increment of 1.  Otherwise, it only scrolls up vertically.        
        switch (dir) {
            case 'left':
                verticalIncrement = 0x00;
                scrollCommand = SSD1309_VERTICAL_AND_LEFT_HORIZONTAL_SCROLL;
                break;
            case 'right':
                verticalIncrement = 0x00;
                scrollCommand = SSD1309_VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL;
                break;
            case 'left diagonal':
                scrollCommand = SSD1309_VERTICAL_AND_LEFT_HORIZONTAL_SCROLL;
                break;
            case 'right diagonal':
                scrollCommand = SSD1309_VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL;
                break;
        }
        self._ssd1309_command1(SSD1309_SET_VERTICAL_SCROLL_AREA, [0x00, HEIGHT]);
        let scData = [
            horizontalIncrement,
            startPage & 0x07,
            frames & 0x07,
            stopPage & 0x07,
            verticalIncrement,
            0x00,
            (WIDTH - 1) & 0xFF
        ];
        self._ssd1309_command1(scrollCommand, scData);
        /*
        self._ssd1309_command1(scrollCommand, [
                0x00,
                startPage & 0x07,
                frames & 0x07,
                stopPage & 0x07,
                verticalIncrement & 0x7F
            ]);
        */
        self._ssd1309_command1(SSD1309_ACTIVATE_SCROLL);
        return self;
    }
}

const Adafruit_SSD1309_Colors = Object.freeze({
    SSD1309_BLACK, SSD1309_WHITE, SSD1309_INVERSE,
            BLACK,         WHITE,         INVERSE
});

module.exports = {Adafruit_SSD1309, Adafruit_SSD1309_Colors};
