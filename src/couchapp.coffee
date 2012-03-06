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