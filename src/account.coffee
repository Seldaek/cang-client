#
# window.localStrage wrapper and more
#

define 'account', ->
  
  'use strict'
  
  class Account
  
    # ## Constructor
    #
    constructor : (@app) ->

    #
    # sign up with email & password
    #
    # uses standard couchDB API to create a new document in _users db.
    # The backend will automatically create a userDB based on the email
    # address. (joe@example.com => joe_example_com, tbd)
    #
    # TODO:
    #
    # * start synchronization with userDB
    # * return a custom promise
    #
    sign_up : (email, password) ->
      prefix  = 'org.couchdb.user'
      key     = "#{prefix}:#{email}"

      user = 
        _id           : key
        name          : email
        type          : 'user'
        roles         : []
        password      : password

      @_request 'PUT', "/_users/#{encodeURIComponent key}", user


    #
    # sign in with email & password
    #
    # uses standard couchDB API to create a new user session (POST /_session)
    #
    # TODO: 
    #
    # * make sessions persistant, as of now, cooky won't be sent on successive requests
    # * start synchronization with userDB
    # * return a custom promise
    #
    sign_in : (email, password) ->

      @_request 'POST', '/_session',
        name      : email
        password  : password

    # alias
    login: @::sign_in

    #
    # change password
    #
    # to be done.
    #
    change_password : (current_password, new_password) ->
      alert('change password is not yet implementd')


    #
    # sign out 
    #
    # uses standard couchDB API to destroy a user session (DELETE /_session)
    #
    # TODO:
    #
    # * stop synchronization
    # * return a custom promise
    #
    sign_out: ->
      @_request 'DELETE', '/_session'

    # alias
    logout: @::sign_out
    
    
    # --------------------------------------------------------------------------  
    
    # ## Private
    
    _request: (type, path, data) ->
      options =
        type        : type
        url         : "#{@app.couchDB_url}#{path}"
        xhrFields   : withCredentials: true
        crossDomain : true
        
      if data
        options.data = JSON.stringify data
      
      if type is 'PUT' or type is 'POST'
        options.contentType = "application/json"
      
      $.ajax options