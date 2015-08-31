/**
 * hive.js
 * Copyright (C) 2013-2015 Marcel Klehr <mklehr@gmx.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Grant = require('grant-koa')
  , session = require('koa-session')
  , mount = require('koa-mount')
  , path = require('path')
  , request = require('superagent')
  , url = require('url')


module.exports = setup
module.exports.consumes = ["auth", "hooks", "http", "assets", 'config', 'authToken']
module.exports.provides = []

function setup(plugin, imports, register) {
  var auth = imports.auth
    , authToken = imports.authToken
    , assets = imports.assets
    , hooks = imports.hooks
    , http = imports.http
    , config = imports.config

  assets.registerModule(path.join(__dirname, 'client.js'))

  var baseURL = url.parse(config.get('ui:baseURL'))

  http.keys = ['grant']
  http.use(session(http))
  http.use(mount(Grant({
    server: {
      protocol: 'http'
    , host: baseURL.host+(
        baseURL.pathname[baseURL.pathname.length-1]=='/'?
          baseURL.pathname.substr(0, baseURL.pathname.length-1)
        : baseURL.pathname
      )
    }
  , github: {
      key: config.get('authGithub:key')
    , secret: config.get('authGithub:secret')
    , scope: []
    , callback: '/login_github_callback'
    }
  })))

  http.router.get('/login_github_callback', function*(next) {
    if(this.query.access_token) {
      try {
        var user = yield auth.authenticate('github', this.query.access_token)
      }catch(e) {
        this.body = 'Error while authentication with github: '+e.message
        return
      }
      this.cookies.set('token', authToken.sign({user: user.id}))
      this.redirect(this.query.raw.state)
    }else{
      this.body = this.query
    }
  })

  hooks.on('orm:initialized', function*(models) {
    auth.registerAuthenticationProvider('github', function*(credentials) {
      var githubUser = yield function(cb) {
        request.get('https://api.github.com/v3/users/')
        .set('User-Agent', 'hive.js')
        .set('Authorization', 'token '+credentials)
        .end(function(er, res) {
          if(er || res.status!==200) return cb(er || res.toError())
          cb(null, res.body)
        })
      }
      // we need to copy everything we need from github in this fn,
      // since we don't store the access_token
      var user = yield models.users.findOneOrCreate({type: 'github', foreignId: githubUser.id}, {type: 'github', foreignId: githubUser.id, name: githubUser.name})
      return user
    })
  })

  register()
}
