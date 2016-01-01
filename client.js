var url = require('url')

module.exports = setup
module.exports.consumes = ['ui', 'session']

function setup(plugin, imports, register) {
  var session = imports.session
    , ui = imports.ui

  session.registerAuthenticationProvider('github', {
    silent: function() {
      return
    }
  , ask: function(children) {
      var basePath = url.parse(ui.baseURL).pathname
      document.cookie = 'auth-github_referer='+window.location+';path='+basePath
      window.location = ui.baseURL+'/connect/github'
      children.push('Redirecting to github...')
    }
  , description: "Login with your github account"
  })

  register()
}
