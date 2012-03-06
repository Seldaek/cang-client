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
      
      @app.on 'store:dirty:idle', @push_changes
      
    # ## Listen to Changes
    #
    listen_to_changes : ->
      
      # make a longpoll ajax requests and react on the changes
      # coming from remote
      
      
    # ## Push changes
    #
    # Gets changed objects from store and pushes it to couch
    # using the `_bulk_docs` API
    push_changes : (options) =>
      
      docs    = @app.store.changed_docs()
      return @_deferred().resolve([]) if docs.lenght is 0
        
      docs = @_parse_for_remote doc for doc in docs
      
      params =
        type:         'POST'
        dataType:     'json'
        url:          "/db/account/_bulk_docs"
        contentType:  'application/json'
        data:         JSON.stringify(docs: docs)
      
      promise = $.ajax(params)
      promise.done (response) =>
        # TODO: make app.store parse the passed objects correctly
        #       e.g. rename `_id` to `id` etc
        @app.store(object, remote: true) for object in response
      
  # ## Private
  
  _valid_special_attributes:
    '_id'      : 1
    '_rev'     : 1
    '_deleted' : 1
  
  #
  # parse object for remote storage. All attributes starting with an 
  # `underscore` do not get synchronized despite the special attributes
  # `_id`, `_rev` and `_deleted`
  # 
  # Also `id` attribute gets renamed to `_id`
  #
  _parse_for_remote: (obj) ->
    attributes = $.extend obj
    
    for attr of attributes
      next if @_valid_special_attributes[attr]
      next unless /^_/.test attr
      delete attributes[attr]
      
    attributes
  
  #
  _deferred: $.Deferred