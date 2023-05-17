/**************************************************************************
 These are common utilities for testing the SSD1309 displays adapted from 
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

const {SSD1309_WHITE, SSD1309_BLACK, SSD1309_INVERSE,
       WHITE, BLACK, INVERSE} = require("../../index").Adafruit_SSD1309_Colors;


const toInt = Math.trunc,
      fMax = Math.max,
      fMin = Math.min,
      fFloor = Math.floor,
      fRandom = Math.random;

// End of test delay. ie. Time in milliseconds before proceeding to next test.
const EOT_DELAY = 1500;

// Random Number Helper method
// See https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
function randomInteger(min, max) {
    return fFloor(fRandom() * (max - min + 1)) + min;
}


async function testDrawLine(display) {
    const loop_delay = 35, w = display.width(), h = display.height();
    let i, doWork;

    await display.clearDisplay(); // Clear display buffer
    for(i=0; i<w; i+=4) {
        // the JS version of this display is chainable so we can chain methods
        // that modify the buffer or display.
        await display.drawLine(0, 0, i, h-1, SSD1309_WHITE)
                     .display(); // Update screen with each newly-drawn line
        await delay(loop_delay);
    }
    for(i=0; i<h; i+=4) {
        await display.drawLine(0, 0, w-1, i, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);

    await display.clearDisplay();
    for(i=0; i<w; i+=4) {
        await display.drawLine(0, h-1, i, 0, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    for(i=h-1; i>=0; i-=4) {
        await display.drawLine(0, h-1, w-1, i, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);

    await display.clearDisplay();
    for(i=w-1; i>=0; i-=4) {
        await display.drawLine(w-1, h-1, i, 0, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    for(i=h-1; i>=0; i-=4) {
        await display.drawLine(w-1, h-1, 0, i, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);

    await display.clearDisplay();
    for(i=0; i<h; i+=4) {
        await display.drawLine(w-1, 0, 0, i, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    for(i=w-1; i>0; i-=4) {
        await display.drawLine(w-1, 0, i, h-1, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}

async function testDrawRect(display, loop_delay = 35) {
    const w = display.width(), h = display.height();

    await display.clearDisplay();
    for(let i=0; i<h/2; i+=2) {
        await display.drawRect(i, i, w-2*i, h-2*i, SSD1309_WHITE)
                     .display(); // Update screen with each newly-drawn rectangle
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testFillRect(display, loop_delay = 35) {
    const w = display.width(), h = display.height();
    
    await display.clearDisplay();
    for(let i=0; i<h/2; i+=3) {
        // The INVERSE color is used so rectangles alternate white/black
        await display.fillRect(i, i, w-i*2, h-i*2, SSD1309_INVERSE)
                     .display(); // Update screen with each newly-drawn rectangle
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testDrawCircle(display, loop_delay = 35) {
    const w = display.width(), h = display.height();

    await display.clearDisplay();
    for(let i=0; i<fMax(w,h)/2; i+=2) {
        await display.drawCircle(w/2, w/2, i, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testFillCircle(display, loop_delay = 35) {
    const w = display.width(), h = display.height();

    await display.clearDisplay();
    for(let i=fMax(w,h)/2; i>0; i-=3) {
        // The INVERSE color is used so circles alternate white/black
        await display.fillCircle(w/2, h/2, i, SSD1309_INVERSE)
                     .display(); // Update screen with each newly-drawn circle
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testDrawRoundRect(display, loop_delay = 35) {
    const w = display.width(), h = display.height();

    await display.clearDisplay();
    for(let i=0; i<h/2-2; i+=2) {
        await display.drawRoundRect(i, i, w-2*i, h-2*i, h/4, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testFillRoundRect(display, loop_delay = 35) {
    const w = display.width(), h = display.height();

    await display.clearDisplay();
    for(let i=0; i<h/2-2; i+=2) {
        // The INVERSE color is used so round-rects alternate white/black
        await display.fillRoundRect(i, i, w-2*i, h-2*i, h/4, SSD1309_INVERSE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testDrawTriangle(display, loop_delay = 35) {
    const w = display.width(), h = display.height();

    await display.clearDisplay();
    for(let i=0; i<fMax(w,h)/2; i+=5) {
        await display.drawTriangle(w/2, h/2-i, w/2-i, h/2+i,  w/2+i, h/2+i, SSD1309_WHITE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testFillTriangle(display, loop_delay = 35) {
    const w = display.width(), h = display.height();

    await display.clearDisplay();
    for(let i=fMax(w,h)/2; i>0; i-=5) {
        // The INVERSE color is used so triangles alternate white/black
        await display.drawTriangle(w/2, h/2-i, w/2-i, h/2+i,  w/2+i, h/2+i, SSD1309_INVERSE)
                     .display();
        await delay(loop_delay);
    }
    await delay(EOT_DELAY);
}


async function testDrawChar(display, loop_delay = 35) {

    await display.clearDisplay()
                 .setTextSize(1)                // Normal 1:1 pixel scale
                 .setTextColor(SSD1309_WHITE)   // Draw white text
                 .setCursor(0, 0)               // Start at top-left corner
                 .cp437(true);                  // Use full 256 char 'Code Page 437' font

    // Not all the characters will fit on the display. This is normal.
    // Library will draw what it can and the rest will be clipped.
    for(let i=0; i<256; i++) {
        // display.write will simply chain work onto the queue.
        // Don't have to await each step as this is done below with final
        // display.wait.
        display.write((i == '\n') ? " " : i);
    }

    await display.display();
    await delay(EOT_DELAY);
}


async function testDrawStyles(display, loop_delay = 35) {

    // Display supports chaining and operations are added to a queue.
    // Therefore, one can do multiple operations as needed using 'dot' chaining.
    // At the end of one's work, one can simply await the display to complete all operations.

    display.clearDisplay()
           .setTextSize(1)                  // Normal 1:1 pixel scale
           .setTextColor(SSD1309_WHITE)     // Draw white text
           .setCursor(0,0)                  // Start at top-left corner
           .println("Hello, world!");

    display.setTextColor(SSD1309_BLACK, SSD1309_WHITE) // Draw 'inverse' text
           // TODO support numeric format in println
           .println(3.141592);

    display.setTextSize(2)             // Draw 2X-scale text
           .setTextColor(SSD1309_WHITE)
           .print("0x")
           .println(0xDEADBEEF.toString(16).padStart(8,"0").toUpperCase())
           // TODO support hex format in println
           //display.print(F("0x")); display.println(0xDEADBEEF, HEX);
           .display();

    // Wait for display to complete all work.
    await display;
    await delay(EOT_DELAY);
}


async function testScrollText(display, loop_delay = 35) {

    await display.clearDisplay()
                 .setTextSize(2) // Draw 2X-scale text
                 .setTextColor(SSD1309_WHITE)
                 .setCursor(10, 0)
                 //.println(F("scroll"));
                 .println("scroll")
                 .display();      // Show initial text

    await delay(100);

    // Scroll in various directions, pausing in-between:
    await display.startscrollright(0x00, 0x0F);
    await delay(2000);
    await display.stopscroll();
    await delay(1000);
    await display.startscrollleft(0x00, 0x0F);
    await delay(2000);
    await display.stopscroll();
    await delay(1000);
    await display.startscrolldiagright(0x00, 0x07);
    await delay(2000);
    await display.startscrolldiagleft(0x00, 0x07);
    await delay(2000);
    await display.stopscroll();
    await delay(1000);
};

const LOGO_HEIGHT  = 16;
const LOGO_WIDTH   = 16;

const LOGO_BMP = [
  0b00000000, 0b11000000,
  0b00000001, 0b11000000,
  0b00000001, 0b11000000,
  0b00000011, 0b11100000,
  0b11110011, 0b11100000,
  0b11111110, 0b11111000,
  0b01111110, 0b11111111,
  0b00110011, 0b10011111,
  0b00011111, 0b11111100,
  0b00001101, 0b01110000,
  0b00011011, 0b10100000,
  0b00111111, 0b11100000,
  0b00111111, 0b11110000,
  0b01111100, 0b11110000,
  0b01110000, 0b01110000,
  0b00000000, 0b00110000
];


async function testDrawBitmap(display) {
    const w = display.width(), h = display.height();
    await display.clearDisplay()
                 .draw1BitBitmap((w  - LOGO_WIDTH ) / 2,
                                 (h - LOGO_HEIGHT) / 2,
                                 LOGO_BMP,
                                 LOGO_WIDTH,
                                 LOGO_HEIGHT, SSD1309_WHITE)
                 .display();
    await delay(EOT_DELAY);
};


async function testAnimate(display, bitmap, bitmapWidth, bitmapHeight, animateTimeMs = 30000) {
    const NUMFLAKES=10,
          // Indexes into the 'icons' array
          XPOS   = 0,
          YPOS   = 1,
          DELTAY = 2;

    const w = display.width(), h = display.height();


    let f, icons = [];

    // Initialize 'snowflake' positions
    for(f=0; f< NUMFLAKES; f++) {
        const icon = [];
        // Create a random integer between 1 - LOGO_WIDTH and w.
        icon[XPOS]   = randomInteger(1 - LOGO_WIDTH, w);
        icon[YPOS]   = -LOGO_HEIGHT;
        // Create a random between 1 and 6.
        icon[DELTAY] = randomInteger(1, 6);
        //console.log(" x:%o", icon[XPOS]);
        //console.log(" y:%o", icon[YPOS]);
        //console.log("dy:%o", icon[DELTAY]);
        icons.push(icon);
    }
    const startTimeMs = new Date().valueOf();

    while ((new Date().valueOf() - startTimeMs) <= animateTimeMs) {
        display.clearDisplay(); // Clear the display buffer

        // Draw each snowflake:
        for(f=0; f< NUMFLAKES; f++) {
            //display.drawBitmap(
            display.draw1BitBitmap(icons[f][XPOS], icons[f][YPOS], bitmap, bitmapWidth, bitmapHeight, SSD1309_WHITE);
        }

        await display.display(); // Show the display buffer on the screen
        await delay(200);        // Pause for 2/10 second

        // Then update coordinates of each flake...
        for(f=0; f< NUMFLAKES; f++) {
            icons[f][YPOS] += icons[f][DELTAY];
            // If snowflake is off the bottom of the screen...
            if (icons[f][YPOS] >= h) {
                // Reinitialize to a random position, just off the top
                icons[f][XPOS]   = randomInteger(1 - LOGO_WIDTH, w);
                icons[f][YPOS]   = -LOGO_HEIGHT;
                icons[f][DELTAY] = randomInteger(1, 6);
            }
        }
    }
}

module.exports = {
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
};