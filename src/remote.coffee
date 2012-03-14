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
      
      @connect()
      @app.on 'account:sign_in',  @connect
      @app.on 'account:sign_out', @disconnect
      
      
      
    # ## Connect
    #
    # start pulling changes from the userDB
    connect : =>
      
      return if @_connected
      @app.account.authenticate().done @pull_changes
      
      
    # ## Disconnect
    #
    # stop pulling changes from the userDB
    disconnect : =>
      @_connected = false
      @_changes_request.abort() if @_changes_request
    
    
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
      @_changes_request_timeout = window.setTimeout @_restart_changes_request, 59000 # 59 sec
      
      
    # ## Push changes
    #
    # Push locally changed objects to userDB using the
    # using the `_bulk_docs` API
    push_changes : (options) =>

      console.log "@app.store.changed_docs()", @app.store.changed_docs()
      $.ajax({type: 'POST', url: 'http://cors.io/funtime.g3th.net:5984/cang/_bulk_docs', data:'{"docs": []}', contentType: 'application/json'})
      
      # docs    = @app.store.changed_docs()
      # return @_promise().resolve([]) if docs.lenght is 0
      #   
      # docs = @_parse_for_remote doc for doc in docs
      
      # @app.request 'POST', "/#{encodeURIComponent @app.account.email}/_bulk_docs", 
      #   dataType:     'json'
      #   processData:  false
      #   contentType:  'application/json'
      # 
      #   data        : JSON.stringify(docs: docs)
      #   success     : @_handle_changes
      
      
    # ## Get / Set seq
    #
    # the `seq` number gets passed to couchDB's `_changes` feed.
    # 
    get_seq :       -> @_seq ||= @app.store.db.getItem('_couch.remote.seq') or 0
    set_seq : (seq) -> @_seq   = @app.store.db.setItem '_couch.remote.seq', seq
    
    
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
      @_handle_changes(response)
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
          window.setTimeout @pull_changes, @_changes_timeout(3000)
        
        # Please server, don't give us these
        when 500
          @trigger 'error:server'
          @stop()
        
        # usually a 0, which stands for timeout or server not reachable.
        else
          if xhr.statusText is 'abort'
            # manual abort after 59sec. reload changes directly.
            @pull_changes()
          else        
            # oops. This might be caused by an unreachable server.
            # let's trigger cache update to double check
            window.setTimeout @pull_changes, @_changes_timeout()
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
        continue if @_valid_special_attributes[attr]
        continue unless /^_/.test attr
        delete attributes[attr]
      
      attributes
  
    #
    # handle changes from remote
    #
    _handle_changes: (response) =>
      @set_seq response.last_seq
      
      # TODO: make app.store parse the passed objects correctly
      #       e.g. rename `_id` to `id` etc
      console.log 'saving', result.id, result.doc for result in response.results
      @app.store.save(result.doc, remote: true) for result in response.results
        
        
    
    #
    # changes timeout (setter & getter)
    #
    # if there is an error, we use a timeout to try it again.
    # we double it each time an error occurs and reset it back
    # to 100 on success
    #
    _changes_timeout_default : 100
    _changes_timeout_current : 100
    _changes_timeout : (set) ->
      if set
        @_changes_timeout_current = set
      else
        @_changes_timeout_current
    _reset_changes_timeout  : -> @_changes_timeout_current = @_changes_timeout_default
    _double_changes_timeout : -> @_changes_timeout_current = @_changes_timeout_current * 2
    
    #
    _promise: $.Deferred