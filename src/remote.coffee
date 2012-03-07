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
      
    # ## Connect
    #
    # start pulling changes from the userDB
    connect : ->
      
      return if @_connected
      do @pull_changes
      
    # ## Disconnect
    #
    # stop pulling changes from the userDB
    disconnect : ->
      @_connected = false
      @_changes_request.abort() if @_changes_request
    
    # ## pull changes
    #
    # a.k.a. make a longpoll AJAX request to CouchDB's `_changes` feed.
    #
    pull_changes: ->
      @_connected = true
      
      @_changes_request = @app.request 'GET', @_changes_path(),
        success:      @_changes_success
        error:        @_changes_error
      
      window.clearTimeout @_changes_request_timeout
      @_changes_request_timeout = window.setTimeout @_restart_changes_request, 59000 # 59 sec
      
      
    # ## Push changes
    #
    # Push locally changed objects to userDB using the
    # using the `_bulk_docs` API
    push_changes : (options) =>
      
      docs    = @app.store.changed_docs()
      return @_deferred().resolve([]) if docs.lenght is 0
        
      docs = @_parse_for_remote doc for doc in docs
      
      @app.request 'POST', '/db/account/_bulk_docs', 
        data        : JSON.stringify(docs: docs)
        success     : @_handle_changes
      
      $.ajax(params)
      
      
    # ## Get / Set seq
    #
    # the `seq` number gets passed to couchDB's `_changes` feed.
    # 
    get_seq :       -> @_seq ||= @store.db.getItem('_couch.remote.seq') or 0
    set_seq : (seq) -> @_seq   = @store.db.setItem '_couch.remote.seq', seq
    
    
    # ## Private
    
    #
    # changes url
    #
    # long poll url with heartbeat = 10 seconds
    #
    _changes_path : ->
      since = @get_seq()
      db    = 'joe_example_com' # TODO

      "/#{db}/_changes?heartbeat=10000&feed=longpoll&since=#{since}"
    
    # request gets restarted automaticcally in @_changes_error
    _restart_changes_request: => @_changes_request?.abort()
      
    #
    # changes success handler 
    #
    # handle the incoming changes, then send the next request
    #
    _changes_success : (response) ->
      
      return unless @_connected
      @_handle_changes(response)
      do @pull_changes
      
    # 
    # changes error handler 
    #
    # when there is a change, trigger event, 
    # then check for another change
    #
    _changes_error : (xhr, error, resp) ->
      return unless @is_active()
      return if @is_offline()
    
      switch xhr.status
    
        # This happens when users session got invalidated on server
        when 403
          @trigger 'error:unauthorized'
          @stop()
        
        # the 404 comes, when the requested DB of the User has been removed. 
        # Should really not happen. 
        # 
        # BUT: it might also happen that the profileDB is not ready yet. 
        #      Therefore, we try it again in 3 seconds
        #
        # TODO: review / rethink that.
        when 404
          # @trigger 'error:unknown'
          # @stop()
          window.setTimeout (=> @_getChanges()), @_changes_timeout(3000)
        
        # Please server, don't give us these
        when 500
          @trigger 'error:server'
          @stop()
        
        # usually a 0, which stands for timeout or server not reachable.
        else
          if xhr.statusText is 'abort'
            # manual abort after 59sec. reload changes directly.
            @_getChanges()
          else        
            # oops. This might be caused by an unreachable server.
            # let's trigger cache update to double check
            App.AutoUpdate.check() unless App.AutoUpdate.status() is 'checking'
            window.setTimeout (=> @_getChanges()), @_changes_timeout()
            @_double_changes_timeout()
  
    # map of valid couchDB doc attributes starting with an underscore
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
    # handle changes from remote
    #
    _handle_changes: (response) =>
      # TODO: make app.store parse the passed objects correctly
      #       e.g. rename `_id` to `id` etc
      @app.store(object, remote: true) for object in response
    
  
    #
    _deferred: $.Deferred