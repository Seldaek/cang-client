#
# Cang
# --------
#
# the door to world domination (apps)
#
define 'cang', ['events', 'store', 'account', 'remote'], (Events, Store, Account, Remote) ->
  
  'use strict'

  class Cang extends Events
  
  
    # ## initialization
    #
    # Inits the Cang, a couchDB URL needs to be passed
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
        dataType    : 'json'

      $.ajax $.extend defaults, options
      
    
    # ## Promise
    #
    # returns a promise skeletton for custom promise handlings
    promise: $.Deferred