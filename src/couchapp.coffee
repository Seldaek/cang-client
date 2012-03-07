#
# couchApp
# --------
#
# the door to world domination (apps)
#
define 'couchapp', ['events', 'store', 'account', 'remote'], (Events, Store, Account, Remote) ->
  
  'use strict'

  class couchApp extends Events
  
  
    # ## initialization
    #
    # Inits the couchApp, a couchDB URL needs to be passed
    constructor : (@couchDB_url) ->
    
      # remove trailing slash(es)
      @couchDB_url = @couchDB_url.replace /\/+$/, ''
    
      @store   = new Store   this
      @account = new Account this
      @remote  = new Remote  this
      
    
    # ## Request
    #
    # use this method to send AJAX request to the Couch.
    request: (type, path, options = {}) ->
      defaults =
        type        : type
        url         : "#{@couchDB_url}#{path}"
        xhrFields   : withCredentials: true
        crossDomain : true

      options = $.extend defaults, options

      if type is 'PUT' or type is 'POST'
        options.contentType = "application/json"

      $.ajax options