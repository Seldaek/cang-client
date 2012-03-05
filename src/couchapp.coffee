#
# couchApp
# --------
#
# the door to world domination (apps)
#
define 'couchapp', ['events', 'store', 'account'], (Events, Store, Account) ->
  
  'use strict'

  class couchApp extends Events
  
    #
    # initialization
    #
    constructor : (@couchDB_url) ->
    
      # remove trailing slash(es)
      # TODO: SPEC me
      @couchDB_url = @couchDB_url.replace /\/+$/, ''
    
      @store   = new Store this
      @account = new Account this