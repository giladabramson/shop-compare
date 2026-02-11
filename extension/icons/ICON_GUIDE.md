# Creating Extension Icons

The extension needs three PNG icons. Here are the simplest methods:

## Method 1: Using an Online Converter

1. Open [CloudConvert](https://cloudconvert.com/svg-to-png) or similar
2. Upload `icon-template.svg`
3. Set output size to:
   - First conversion: 16x16 → save as `icon16.png`
   - Second conversion: 48x48 → save as `icon48.png`
   - Third conversion: 128x128 → save as `icon128.png`
4. Place all three files in the `icons/` folder

## Method 2: Using Paint (Windows)

1. Open `icon-template.svg` in a browser
2. Take a screenshot (Win + Shift + S)
3. Open Paint and paste
4. Resize to 128x128 (Resize → Pixels → 128 x 128)
5. Save as `icon128.png`
6. Repeat for 48x48 and 16x16

## Method 3: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
magick convert icon-template.svg -resize 16x16 icon16.png
magick convert icon-template.svg -resize 48x48 icon48.png
magick convert icon-template.svg -resize 128x128 icon128.png
```

## Method 4: Simple Colored Squares (Fastest)

Don't have time? Use solid color squares as placeholders:

1. Open Paint or any image editor
2. Create a new image 128x128
3. Fill with blue (#2563eb)
4. Save as `icon128.png`, `icon48.png`, and `icon16.png`

Chrome will accept any PNG file for development purposes.

## Verification

After creating the icons, your `icons/` folder should have:
```
icons/
  ├── icon16.png
  ├── icon48.png
  └── icon128.png
```

The extension will load with any PNG files in these locations.
