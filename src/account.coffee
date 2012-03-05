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

      $.ajax
        type        : 'PUT'
        url         : "#{@app.couchDB_url}/_users/#{encodeURIComponent key}"
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
        url         : "#{@app.couchDB_url}/_session"
        data        : creds
        contentType : "application/json"

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
      $.ajax
        type        : 'DELETE'
        url         : "#{@app.couchDB_url}/_session"
        contentType : "application/json"

    # alias
    logout: @::sign_out