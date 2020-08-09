#!/bin/sh

echo -e "Building Salvia ... \c"
uglifyjs ./src/commonmark.min.js ./src/prism-styles.js ./src/prism.js ./src/TagCloud.min.js ./src/Valine.min.js ./src/salvia.js -o ./dist/salvia.min.js -c -m
echo "Done."
