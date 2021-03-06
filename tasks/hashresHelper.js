/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

var fs    = require('fs'),
  path  = require('path'),
  utils = require('./hashresUtils');

exports.hashAndSub = function(grunt, options) {

  var src              = options.src,
    dest             = options.dest,
    encoding         = options.encoding,
    fileNameFormat   = options.fileNameFormat,
    renameFiles      = options.renameFiles,
    patternMaker     = options.patternMaker,
    replacementMaker = options.replacementMaker,
    nameToHashedName = {},
    formatter        = null;

  grunt.log.debug('files: ' + options.files);
  grunt.log.debug('Using encoding ' + encoding);
  grunt.log.debug('Using fileNameFormat ' + fileNameFormat);
  grunt.log.debug(renameFiles ? 'Renaming files' : 'Not renaming files');

  formatter = utils.compileFormat(fileNameFormat);

  if (options.files) {
    options.files.forEach(function(f) {
      f.src.forEach(function(src) {
        var md5       = utils.md5(src).slice(0, 8),
          fileName  = path.basename(src),
          lastIndex = fileName.lastIndexOf('.'),
          renamed   = formatter({
            hash: md5,
            name: fileName.slice(0, lastIndex),
            ext : fileName.slice(lastIndex + 1, fileName.length)
          });

        // Mapping the original name with hashed one for later use.
        nameToHashedName[fileName] = {
          renamed: renamed,
          pattern: patternMaker(fileName, renamed, src),
          replacement: replacementMaker(fileName, renamed, src)
        };

        // Renaming the file
        if (renameFiles) {
          fs.renameSync(src, path.resolve(path.dirname(src), renamed));
        }
        grunt.log.write(nameToHashedName[fileName].pattern + ' ').ok(nameToHashedName[fileName].replacement);
      });

      // Substituting references to the given files with the hashed ones.
      grunt.file.expand(f.dest).forEach(function(f) {
        var destContents = fs.readFileSync(f, encoding);
        for (var name in nameToHashedName) {
          grunt.log.debug('Substituting ' + nameToHashedName[name].pattern + ' by ' + nameToHashedName[name].replacement);
          destContents = destContents.split(nameToHashedName[name].pattern).join(nameToHashedName[name].replacement);
        }
        grunt.log.debug('Rewrite file: ' + f);
        fs.writeFileSync(f, destContents, encoding);
      });
    });
  }
};
