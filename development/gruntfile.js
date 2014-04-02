module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    vars : {
      buildFolder : 'build/',
      buildFileName : '<%= pkg.name %>',
      buildFileAndFolder : '<%= vars.buildFolder %><%= vars.buildFileName %>',
      buildLessPath : '<%= vars.buildFileAndFolder %>.less',
      buildCssPath : '<%= vars.buildFileAndFolder %>.min.css',
      releaseFolder : '../release/v<%= pkg.version %>/',
      releaseFileAndFolder : '../release/v<%= pkg.version %>/<%= pkg.name %>-<%= pkg.version %>'
    },
    concat : {
      options : {
        separator: ';\n\n',
      },
      default : {
        files: {
          '<%= vars.buildFileAndFolder %>.js' : [
            'src/header.fragment',
            'src/alias.js',
            'src/viewModel.js',
            'src/defaultOptions.js',
            'src/templates.js',
            'src/bindingHandler.kogrid$cell.js',
            'src/bindingHandler.kogrid.js',
            'src/window.resize.js',
            'src/footer.fragment',
          ],
          // copy over the read me and the license as well
          '<%= vars.buildFolder %>readme.md' : ['src/readme.md'],
          '<%= vars.buildFolder %>gpl-3.0.txt' : ['src/gpl-3.0.txt'],
          // copy over the raw css file as well
          '<%= vars.buildLessPath %>' : ['src/styles.less' ],
        }
      },
      demo : {
        // once everything is compiled, take the latest pub and push it to the web demo folder
        files : {
          'web/styles/kogrid.css' : ['<%= vars.buildCssPath %>'],
          'web/scripts/kogrid.js' : ['<%= vars.buildFileAndFolder %>.js']
        }
      },
      release : {
        files : {
          // copy all files over to the release folder
          '<%= vars.releaseFolder %>gpl-3.0.txt' : ['<%= vars.buildFolder %>gpl-3.0.txt'],
          '<%= vars.releaseFolder %>readme.md' : ['<%= vars.buildFolder %>readme.md'],
          '<%= vars.releaseFileAndFolder %>.less' : ['<%= vars.buildFileAndFolder %>.less'],
          '<%= vars.releaseFileAndFolder %>.min.css' : ['<%= vars.buildFileAndFolder %>.min.css'],
          '<%= vars.releaseFileAndFolder %>.js' : ['<%= vars.buildFileAndFolder %>.js'],
          '<%= vars.releaseFileAndFolder %>.min.js' : ['<%= vars.buildFileAndFolder %>.min.js'],
        }
      }
    },
    uglify: {
      default : {
        files : {
          '<%= vars.buildFileAndFolder %>.min.js' : ['<%= vars.buildFileAndFolder %>.js' ]
        }
      },
      options: {
        banner: 
        '/*\n<%= pkg.name %> <%= pkg.version %> - created by Miguel Ludert\n' + 
        'https://github.com/thinkingsites/kogrid\n\n' + 
        'This program is free software: you can redistribute it and/or modify\n' + 
        'it under the terms of the GNU General Public License as published by\n' + 
        'the Free Software Foundation, either version 3 of the License, or\n' + 
        '(at your option) any later version.\n\n' + 
        'This program is distributed in the hope that it will be useful,\n' + 
        'but WITHOUT ANY WARRANTY; without even the implied warranty of\n' + 
        'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n' + 
        'GNU General Public License for more details.\n\n' + 
        'You should have received a copy of the GNU General Public License\n' + 
        'along with this program.  If not, see <http://www.gnu.org/licenses/>.\n*/\n\n' 
      }
    },
    less :{
      default : 
      {
        options : {
          compress : true
        },
        files : {
          '<%= vars.buildFileAndFolder %>.min.css' : ['src/styles.less' ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['concat:default','uglify:default','less:default']);
  grunt.registerTask('demo', ['concat:default','uglify:default','less:default','concat:demo']);
  grunt.registerTask('release', ['concat:default','uglify:default','less:default','concat:demo','concat:release']);
};