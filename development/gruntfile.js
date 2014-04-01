module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    vars : {
      releaseFolder : '../release/v<%= pkg.version %>/',
      fileName : '<%= pkg.name %>-<%= pkg.version %>',
      fileAndFolder : '<%= vars.releaseFolder %><%= vars.fileName %>',
      lessPublishPath : '<%= vars.fileAndFolder %>.less',
      cssPublishPath : '<%= vars.fileAndFolder %>.min.css'
    },
    concat : {
      options : {
        separator: ';\n\n',
      },
      default : {
        files: {
          '<%= vars.fileAndFolder %>.js' : [
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
          '<%= vars.releaseFolder %>readme.md' : ['src/readme.md'],
          '<%= vars.releaseFolder %>gpl-3.0.txt' : ['src/gpl-3.0.txt'],
          // copy over the raw css file as well
          '<%= vars.lessPublishPath %>' : ['src/styles.less' ],
        }
      },
      demo : {
        // once everything is compiled, take the latest pub and push it to the web demo folder
        files : {
          'web/styles/kogrid.css' : ['<%= vars.cssPublishPath %>'],
          'web/scripts/kogrid.js' : ['<%= vars.fileAndFolder %>.js']
        }
      }
    },
    uglify: {
      my_target : {
        files : {
          '<%= vars.fileAndFolder %>.min.js' : ['<%= vars.fileAndFolder %>.js' ]
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
          '<%= vars.fileAndFolder %>.min.css' : ['src/styles.less' ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['concat','uglify','less','concat:demo']);
};