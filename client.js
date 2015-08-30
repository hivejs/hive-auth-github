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
      window.location = ui.baseURL+'/connect/github?state='+window.location
    }
  , description: "Login with your github account"
  })

  register()
}
