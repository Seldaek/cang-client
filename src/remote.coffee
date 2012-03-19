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
      
      @app.on 'account:signed_in',  @connect
      @app.on 'account:signed_out', @disconnect
      @connect()
      
      
    # ## Connect
    #
    # start pulling changes from the userDB
    connect : =>
      
      return if @_connected
      @app.account.authenticate().done =>
        @app.on 'store:dirty:idle', @push_changes
        @pull_changes()
        @push_changes()
      
      
    # ## Disconnect
    #
    # stop pulling changes from the userDB
    disconnect : =>
      @_connected = false
      @_changes_request.abort() if @_changes_request
      
      @app.store.db.removeItem '_couch.remote.seq'
      
      @app.unbind 'store:dirty:idle', @push_changes
      delete @_seq


    # ## pull changes
    #
    # a.k.a. make a longpoll AJAX request to CouchDB's `_changes` feed.
    #
    pull_changes: =>
      @_connected = true
      
      @_changes_request = @app.request 'GET', @_changes_path(),
        success:      @_changes_success
        error:        @_changes_error
      
      window.clearTimeout @_changes_request_timeout
      @_changes_request_timeout = window.setTimeout @_restart_changes_request, 25000 # 25 sec
      
      
    # ## Push changes
    #
    # Push locally changed objects to userDB using the
    # using the `_bulk_docs` API
    push_changes : (options) =>

      docs    = @app.store.changed_docs()
      return @_promise().resolve([]) if docs.length is 0
        
      docs = for doc in docs
        @_parse_for_remote doc 
      
      @app.request 'POST', "/#{encodeURIComponent @app.account.email}/_bulk_docs", 
        dataType:     'json'
        processData:  false
        contentType:  'application/json'
      
        data        : JSON.stringify(docs: docs)
        success     : @_handle_push_changes
      
      
    # ## Get / Set seq
    #
    # the `seq` number gets passed to couchDB's `_changes` feed.
    # 
    get_seq :       -> @_seq ||= @app.store.db.getItem('_couch.remote.seq') or 0
    set_seq : (seq) -> @_seq   = @app.store.db.setItem '_couch.remote.seq', seq
    
    
    # ## On
    #
    # alias for `app.on`
    on : (event, cb) -> @app.on "remote:#{event}", cb
    
    
    # ## Private
    
    #
    # changes url
    #
    # long poll url with heartbeat = 10 seconds
    #
    _changes_path : ->
      since = @get_seq()
      db    = 'joe_example_com' # TODO

      "/#{encodeURIComponent @app.account.email}/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=#{since}"
    
    # request gets restarted automaticcally in @_changes_error
    _restart_changes_request: => @_changes_request?.abort()
      
    #
    # changes success handler 
    #
    # handle the incoming changes, then send the next request
    #
    _changes_success : (response) =>
      
      return unless @_connected
      @set_seq response.last_seq
      @_handle_pull_changes(response.results)
      do @pull_changes
      
    # 
    # changes error handler 
    #
    # when there is a change, trigger event, 
    # then check for another change
    #
    _changes_error : (xhr, error, resp) =>
      return unless @_connected
    
      switch xhr.status
    
        # This happens when users session got invalidated on server
        when 403
          @trigger 'error:unauthorized'
          do @disconnect
        
        # the 404 comes, when the requested DB of the User has been removed. 
        # Should really not happen. 
        # 
        # BUT: it might also happen that the profileDB is not ready yet. 
        #      Therefore, we try it again in 3 seconds
        #
        # TODO: review / rethink that.
        when 404
          window.setTimeout @pull_changes, 3000
        
        # Please server, don't give us these
        when 500
          @trigger 'error:server'
          do @disconnect
        
        # usually a 0, which stands for timeout or server not reachable.
        else
          if xhr.statusText is 'abort'
            # manual abort after 25sec. reload changes directly.
            do @pull_changes
          else    
              
            # oops. This might be caused by an unreachable server.
            # Or the server canceld it for what ever reason, e.g.
            # heroku kills the request after ~30s.
            # we'll try again after a 3s timeout
            window.setTimeout @pull_changes, 3000
  
    # map of valid couchDB doc attributes starting with an underscore
    _valid_special_attributes:
      '_id'      : 1
      '_rev'     : 1
      '_deleted' : 1
  
  
    # parse object for remote storage. All attributes starting with an 
    # `underscore` do not get synchronized despite the special attributes
    # `_id`, `_rev` and `_deleted`
    # 
    # Also `id` attribute gets renamed to `_id`
    #
    _parse_for_remote: (obj) ->
      attributes = $.extend {}, obj
    
      for attr of attributes
        continue if @_valid_special_attributes[attr]
        continue unless /^_/.test attr
        delete attributes[attr]
     
      attributes._id = "#{attributes.type}/#{attributes.id}"
      delete attributes.id
      
      attributes
      
      
    # parse object for local storage. 
    # 
    # renames `_id` attribute to `id` and removes the type from the id,
    # e.g. `document/123` -> `123`
    _parse_from_remote: (obj) ->
      id = obj._id or obj.id
      delete obj._id
      [obj.type, obj.id] = id.split(/\//)
      
      obj.created_at = new Date(Date.parse obj.created_at) if obj.created_at
      obj.updated_at = new Date(Date.parse obj.updated_at) if obj.updated_at
      
      obj
  
    #
    # handle changes from remote
    #
    _handle_pull_changes: (changes) =>
      for {doc} in changes
        _doc = @_parse_from_remote(doc)
        if _doc._deleted
          @app.store.destroy(_doc.type, _doc.id, remote: true)
          .done (object) => 
            @app.trigger 'remote:destroyed', _doc.type, _doc.id, object
            @app.trigger "remote:destroyed:#{_doc.type}", _doc.id, object
            @app.trigger 'remote:changed', _doc.type, _doc.id, object
            @app.trigger "remote:changed:#{_doc.type}", _doc.id, object
        else
          @app.store.save(_doc.type, _doc.id, _doc, remote: true)
          .done (object, object_was_created) => 
            @app.trigger 'remote:changed', _doc.type, _doc.id, object
            @app.trigger "remote:changed:#{_doc.type}", _doc.id, object
            if object_was_created
              @app.trigger 'remote:created', _doc.type, _doc.id, object
              @app.trigger "remote:created:#{_doc.type}", _doc.id, object
            else
              @app.trigger 'remote:updated', _doc.type, _doc.id, object
              @app.trigger "remote:updated:#{_doc.type}", _doc.id, object
        
    _handle_push_changes: (changes) =>
      # TODO: handle conflicts
    
    #
    _promise: $.Deferred