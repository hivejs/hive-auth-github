var url = require('url')

module.exports = setup
module.exports.consumes = ['ui', 'auth']

function setup(plugin, imports, register) {
  var auth = imports.auth
    , ui = imports.ui

  auth.registerAuthenticationProvider('github', {
    silent: function*() {
      return
    }
  , ask: function*() {
      var basePath = url.parse(ui.baseURL).pathname
      document.cookie = 'auth-github_referer='+window.location+';path='+basePath
      window.location = ui.baseURL+'/connect/github'
      yield function() { }
    }
  , description: "Login with your github account"
  })

  register()
}
