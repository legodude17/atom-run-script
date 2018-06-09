var {CompositeDisposable, BufferedProcess} = require('atom');
var path = require('path');
const execa = require('execa');
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
        var proc = execa.shell(`npm run ${name}`, { cwd: curPath });
        proc.then(result => {
          var detail = `${result.stdout}\n${result.stderr}`;
          atom.notifications.addSuccess(`Command ${name} succeeded`, { dismissable: true, detail });
          noti.dismiss();
        }).catch(error => {
          var detail = `${error.stdout}\n${error.stderr}`;
          atom.notifications.addError(`Command ${name} failed with code ${error.code}`, { dismissable: true, detail });
          noti.dismiss();
        });
        var noti = atom.notifications.addInfo(`Running command ${name}...`/*, { buttons: [
          {
            text: 'Kill',
            onDidClick() {
              proc.kill('SIGINT');
            }
          }
        ]}*/)
      }
    }
    if (!pkg.scripts) {
      atom.notifications.addError('No scripts found', { dismissable: true });
      return;
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
