#
# Connection / Socket to our couch
#
# Remote is using couchDB's `_changes` feed to listen to changes
# and `_bulk_docs` to push local changes
#

define 'remote', ['errors'], (ERROR) ->
  
  'use strict'
  
  class Remote
  
  
    # ## Constructor
    #
    constructor : (@app) ->
      
      
    # ## Listen to Changes
    #
    listen_to_changes : ->
      
      
    # ## Push changes
    #
    push_changes : ->