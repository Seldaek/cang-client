#
# couchApp
# --------
#
# the door to world domination (apps)
#
define 'couchapp', ['events', 'store'], (Events, Store) ->
  
  'use strict'

  class couchApp extends Events
  
    #
    # initialization
    #
    constructor : (@couchDB_url) ->
    
      # remove trailing slash(es)
      # TODO: SPEC me
      @couchDB_url = @couchDB_url.replace /\/+$/, ''
    
      @store = new Store this
  
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
    
      salt          = hex_sha1 @store.uuid()
      password_sha  = hex_sha1 password + salt
    
      user = 
        _id           : key
        name          : email
        type          : 'user'
        roles         : []
        salt          : salt
        password_sha  : password_sha
    
      $.ajax
        type        : 'PUT'
        url         : "#{@couchDB_url}/_users/#{encodeURIComponent key}"
        data        : JSON.stringify user
        contentType : "application/json"
     
  
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
    
      creds = JSON.stringify
                name      : email
                password  : password
    
      $.ajax
        type        : 'POST'
        url         : "#{@couchDB_url}/_session"
        data        : creds
        contentType : "application/json"
      
    # alias
    login: @::sign_in
  
    #
    # change password
    #
    # to be done.
    #
    change_password : (email) ->
      alert('change password is not yet implementd')
    
      # 1. GET user doc
      # 2. update salt + password_sha
      # 3. PUT user doc
    
  
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
      $.ajax
        type        : 'DELETE'
        url         : "#{@couchDB_url}/_session"
        contentType : "application/json"
  
    # alias
    logout: @::sign_out