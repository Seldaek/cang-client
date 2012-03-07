#
# window.localStrage wrapper and more
#

define 'account', ->
  
  'use strict'
  
  class Account
  
  
    # ## Constructor
    #
    constructor : (@app) ->
      

    # ## sign up with email & password
    #
    # uses standard couchDB API to create a new document in _users db.
    # The backend will automatically create a userDB based on the email
    # address.
    #
    sign_up : (email, password) ->
      prefix  = 'org.couchdb.user'
      key     = "#{prefix}:#{email}"

      @app.request 'PUT', "/_users/#{encodeURIComponent key}",
        
        data:
          _id       : key
          name      : email
          type      : 'user'
          roles     : []
          password  : password
        
        success   : => 
          @app.trigger 'account:sign_up'
          @app.trigger 'account:sign_in'


    # ## sign in with email & password
    #
    # uses standard couchDB API to create a new user session (POST /_session)
    #
    sign_in : (email, password) ->

      @app.request 'POST', '/_session', 
        data:
          name      : email
          password  : password
        success : => @app.trigger 'account:sign_in'

    # alias
    login: @::sign_in


    # ## change password
    #
    # to be done.
    #
    change_password : (current_password, new_password) ->
      alert('change password is not yet implementd')


    # ## sign out 
    #
    # uses standard couchDB API to destroy a user session (DELETE /_session)
    #
    sign_out: ->
      @app.request 'DELETE', '/_session', 
        success : => @app.trigger 'account:sign_out'

    # alias
    logout: @::sign_out