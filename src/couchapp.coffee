#
# couchApp
# --------
#
# the door to world domination (apps)
#
define 'couchapp', ['events', 'store', 'account'], (Events, Store, Account) ->
  
  'use strict'

  class couchApp extends Events
  
    # ## initialization
    #
    # Inits the couchApp, a couchDB URL needs to be passed
    constructor : (@couchDB_url) ->
    
      # remove trailing slash(es)
      @couchDB_url = @couchDB_url.replace /\/+$/, ''
    
      @store   = new Store this
      @account = new Account this