var {CompositeDisposable, BufferedProcess} = require('atom');
var path = require('path');
module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable()
    var paths = atom.project.getPaths();
    var curPath = '';
    var pkg = {scripts: {}};
    var commands = {};
    paths.forEach(function (v) {
      try {
        pkg = require(path.join(v, 'package.json'));
        curPath = v;
      } catch (e) {}
    });
    function makeCommand(name) {
      return function() {
        var err = '';
        var out = '';
        function stderr(data) {
          err += data;
        }
        function stdout(data) {
          out += data;
        }
        function exit(code) {
          var detail = out + '\n' + err;
          if (code === 0) {
            atom.notifications.addSuccess("Command " + name + " succeeded.", {dismissable: true, detail});
          } else {
            atom.notifications.addError("Command " + name + " failed.", {dismissable: true, detail});
          }
        }
        var process = new BufferedProcess({command: 'npm', args: ['run', name], stdout, stderr, exit, options: {cwd: curPath}});
      }
    }
    Object.keys(pkg.scripts).forEach(function (v) {
      commands['run-npm-script:run-' + v] = makeCommand(v);
    });
    commands['run-script:reload'] = () => {
      this.deactivate();
      this.activate();
    };
    this.subscriptions.add(atom.commands.add('atom-workspace', commands));
    this.subscriptions.add(atom.menu.add([{
      'label': 'Packages',
      'submenu': [{
        'label': 'Run npm script',
        'submenu': Object.keys(pkg.scripts).map(function (v) {
          return {
            label: 'Run ' + v,
            command: 'run-npm-script:run-' + v
          }
        }
        )
      }]
    }]));
  },

  deactivate() {
    this.subscriptions.dispose();
  }
};
