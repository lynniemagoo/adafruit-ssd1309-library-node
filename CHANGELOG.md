# Changelog

## v1.1.0 2023-08-05

- Refactored to use base class of Adafruit_GrayOLED so that we can optimize data writes.
  For example, setting only 1 pixel on the screen will only require writing 1 byte of data whereas
  without these changes, we would write the whole buffer (either 512 bytes or 1024 bytes).

## v1.0.4 2023-06-04

- Minor non-functional code changes

## v1.0.3 2023-06-02 Unpublished

- Provide ability to override colStart, pageStart, display offset and display start line using options.

## v1.0.2 2023-06-02

- Bugfix for drawing horizontal lines with INVERSE color.  Fix examples to handle all rotations.

## v1.0.0 2022-09-13

- First official release