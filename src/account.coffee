#
# window.localStrage wrapper and more
#

define 'account', ->
  
  'use strict'
  
  class Account
    
    # ## Properties
    email: undefined
    
    # ## Constructor
    #
    constructor : (@app) ->
      
      # handle evtl session
      @email = @app.store.db.getItem '_couch.account.email'
      @authenticate()
      
      @app.on 'account:sign_in',  @_handle_sign_in
      @app.on 'account:sign_out', @_handle_sign_out
    
    ##
    #
    authenticate : ->
      promise = @app.promise()
      
      unless @email
        return promise.reject()
        
      if @_authenticated is true
        return promise.resolve @email
        
      if @_authenticated is false
        return promise.reject()
      
      # @_authenticated is undefined
      @app.request 'GET', "/_session"
        success: (response) =>
          if response.userCtx.name
            @_authenticated = true
            @email = response.userCtx.name
            promise.resolve @email
          else
            @_authenticated = false
            @app.trigger 'account:error:not_authenticated'
            promise.reject()
            
        error: promise.reject
          
      promise
      
      
        
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
        
        data: JSON.stringify
          _id       : key
          name      : email
          type      : 'user'
          roles     : []
          password  : password
          
        contentType:  'application/json'
        
        success   : => 
          @app.trigger 'account:sign_up', arguments...
          @app.trigger 'account:sign_in', arguments...


    # ## sign in with email & password
    #
    # uses standard couchDB API to create a new user session (POST /_session)
    #
    sign_in : (email, password) ->

      @app.request 'POST', '/_session', 
        data: 
          name      : email
          password  : password
          
        success : => @app.trigger 'account:sign_in', arguments...

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
    # TODO: handle errors
    sign_out: ->
      @app.request 'DELETE', '/_session', 
        success : => @app.trigger 'account:sign_out', arguments...

    # alias
    logout: @::sign_out
    
    

    # ## PRIVATE
    #
    
    #
    _handle_sign_in: (response) =>
      @email = response.name
      @app.store.db.setItem '_couch.account.email', @email
      @_authenticated = true
    
    #
    _handle_sign_out: (response) =>
      delete @email
      @app.store.db.removeItem '_couch.account.email'
      @_authenticated = false