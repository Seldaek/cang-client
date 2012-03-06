#
# window.localStrage wrapper and more
#

define 'store', ['events', 'errors'], (Events, ERROR) ->
  
  'use strict'
  
  class Store
  
  
    # ## Constructor
    #
    constructor : (@app) ->
    
      # if browser does not support local storage persistence,
      # e.g. Safari in private mode, overite the respective methods. 
      unless @is_persistent()
        @_getItem    = -> null
        @_setItem    = -> null
        @_removeItem = -> null
        @_key        = -> null
        @_length     = -> 0
        @_clear      = -> null
    

    # ## Save
    #
    # updates or creates object in Store and adds `created_at` and `updated_at` 
    # timestamps along the way.
    #
    # example usage:
    #
    #     # create
    #     store.save('car', {color: 'red'})                
    #     store.save({type: 'car', color: 'red'})
    #
    #     # update
    #     store.save('car', 'abc4567', {color: 'red'})
    #     store.save('car', {id: 'abc4567', color: 'red'}) 
    #     store.save({type: 'car', id: 'abc4567', color: 'red'}) 
    #
    #     # alias
    #     store.create(car)
    #     store.update(car)
    save: (type, id, object) ->
      promise = @_deferred()
    
      switch arguments.length
        when 2
          object  = id
          id      = object.id
        when 1
          object  = type
          type    = object.type
          id      = object.id
    
      unless typeof object is 'object'
        promise.reject ERROR.INVALID_ARGUMENTS "object is #{typeof object}"
        return promise
      
      # generate an id when object is new
      id ||= @uuid()
    
      # validations
      unless @_is_valid_key id
        promise.reject ERROR.INVALID_KEY id: id
        return promise
      unless @_is_valid_key type
        promise.reject ERROR.INVALID_KEY type: type
        return promise
    
      # add timestamps.
      object.created_at ||= object.updated_at = @_now()
    
      # remove `id` and `type` attributes before saving,
      # as the Store key contains this information
      delete object.id
      delete object.type
    
      try 
        object = @cache type, id, object
        promise.resolve object
      catch error
        promise.reject error
    
      return promise
    
    # aliases
    create : @::save
    update : @::save
    
    
    # ## load
    #
    # loads one object from Store, specified by `type` and `id`
    #
    # example usage:
    #
    #     store.load('car', 'abc4567')
    #     store.load({type: 'car', id: 'abc4567') 
    #
    #     # alias
    #     store.get(car)
    load : (type, id) ->
      promise = @_deferred()
      
      if arguments.length = 1 and typeof type is 'object'
        [type, id] = [type.type, type.id]
    
      unless typeof type is 'string' and typeof id is 'string'
        return promise.reject ERROR.INVALID_ARGUMENTS "type & id are required"
    
      try
        object = @cache type, id
      
        unless object
          promise.reject ERROR.NOT_FOUND type, id
          return promise

        promise.resolve object
      catch error
        promise.reject error
      
      return promise
      
    # aliases
    get : @::load
  
  
    # ## loadAll
    #
    # when `type` passed, return all documents from Store of that type,
    # otherwise return all objects from Store.
    #
    # example usage:
    #
    #     store.loadAll()
    #     store.loadAll('car')
    #
    #     # alias
    #     store.getAll()
    loadAll: (type) ->
      promise = @_deferred()
      keys = @_index()
    
      try
      
        results = for key in keys when (type is undefined or key.indexOf(type) is 0) and @_is_semantic_id key
          [_type, id] = key.split '/'
          @cache _type, id

        promise.resolve(results)
      catch error
        promise.reject error
    
      return promise
    
    # alias
    getAll : @::loadAll
    
    
    # ## Destroy
    #
    # destroys one object specified by `type` and `id`. 
    # 
    # when object has been synced before, mark it as deleted. 
    # Otherwise remove it from Store.
    destroy: (type, id) ->
      promise = @_deferred()
      object = @cache type, id
      
      unless object
        return promise.reject ERROR.NOT_FOUND type, id
      
      if object._rev
        object._deleted = true
        @cache type, id, object
      
      else
        key = "#{type}/#{id}"
        @_removeItem key
    
        delete @_cached[key]
        @clear_changed type, id
    
      promise.resolve object
    
    # alias
    delete: @::destroy
    
    
    # ## Cache
    #
    # loads an object specified by `type` and `id` only once from localStorage 
    # and caches it for faster future access. Updates cache when `value` is passed.
    #
    # Also checks if object needs to be synched (dirty) or not 
    #
    # Pass `options.remote = true` when object comes from remote
    cache : (type, id, object = false, options = {}) ->
      key = "#{type}/#{id}"
    
      if object
        @_cached[key] = $.extend object, type: type, id: id
        @_setObject type, id, object
        
        if options.remote
          @clear_changed type, id 
          return true
      
      else
        return @_cached[key] if @_cached[key]?
        @_cached[key] = @_getObject type, id
    
      if @is_dirty(type, id) or @is_marked_as_deleted(type, id)
        @changed type, id, @_cached[key]
      else
        @clear_changed type, id
      
      @_cached[key]
  
  
    # ## Clear changed 
    #
    # removes an object from the list of objects that are flagged to by synched (dirty)
    # and triggers a `store:dirty` event
    clear_changed: (type, id) ->
    
      if type and id
        key = "#{type}/#{id}"
        delete @_dirty[key]
      else
        @_dirty = {}
    
      @app.trigger 'store:dirty'
    
    
    # ## Marked as deleted?
    #
    # when an object gets deleted that has been synched before (`_rev` attribute),
    # it cannot be removed from store but gets a `_deleted: true` attribute
    is_marked_as_deleted : (type, id) ->
      @cache(type, id)._deleted is true
      
      
    # ## Changed
    #
    # When `object` passed, marks it as changed (dirty), triggers a `store:dirty` event
    # and starts the dirty timeout, which triggers a `store:dirty:idle` event after two seconds
    # unless another object gets marked as deleted within this timeout.
    #
    # When no `object` passed, but a type & id, it returns the respective object if it
    # is currently marked as changed.
    #
    # When no arguments passed, it returns all dirty objects.
    changed: (type, id, object) ->
      key = "#{type}/#{id}"
    
      if object
        @_dirty[key] = object
        @app.trigger 'store:dirty'
        
        timeout = 2000 # 2 seconds timout before triggering the `store:dirty:idle` event
        window.clearTimeout @_dirty_timeout
        @_dirty_timeout = window.setTimeout ( => @app.trigger 'store:dirty:idle' ), timeout
        
      else
        if arguments.length
          @_dirty[key]
        else
          @_dirty
         
         
    # ## Is dirty?
    #
    # When no arguments passed, returns `true` or `false` depending on if there are
    # dirty objects in the store.
    #
    # Otherwise it returns `true` or `false` for the passed object. An object is dirty
    # if it has no `synced_at` attribute or if `updated_at` is more recent than `synced_at`
    is_dirty: (type = null, id = null) ->
      unless type
        return $.isEmptyObject @_dirty
    
      key = "#{type}/#{id}"
      
      return true  unless @cache(type, id).synced_at  # no synced_at? uuhh, that's dirty.
      return false unless @cache(type, id).updated_at # no updated_at? no dirt then
    
      @cache(type, id).synced_at  = Date.parse @cache(type, id).synced_at  unless @cache(type, id).synced_at  instanceof Date
      @cache(type, id).updated_at = Date.parse @cache(type, id).updated_at unless @cache(type, id).updated_at instanceof Date
    
      @cache(type, id).synced_at.getTime() < @cache(type, id).updated_at.getTime()
  
  
    # ## Clear
    #
    # clears localStorage and cache
    clear: ()->
      promise = @_deferred()
    
      try
        @_clear()
        @_cached = {}
        @clear_changed()
      
        promise.resolve()
      catch error
        promise.reject(error)
      
      return promise
    
  
    # ## Is persistant?
    #
    # returns `true` or `false` depending on whether localStorage is supported or not.
    # Beware that some browsers like Safari do not support localStorage in private mode.
    #
    # inspired by this cappuccino commit
    # https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
    #
    is_persistent : ->
    
      try 
        # pussies ... we've to put this in here. I've seen Firefox throwing `Security error: 1000`
        # when cookies have been disabled
        return false unless window.localStorage
      
        # Just because localStorage exists does not mean it works. In particular it might be disabled
        # as it is when Safari's private browsing mode is active.
        localStorage.setItem('Storage-Test', "1");
      
        # hmm ... ?
        return false unless localStorage.getItem('Storage-Test') is "1"
      
        # okay, let's clean up if we got here.
        localStorage.removeItem('Storage-Test');
    
      catch e
      
        # in case of an error, like Safari's Private Pussy, return false
        return false
      
      # good, good
      return true
    
    
    # ## UUID
    #
    # helper to generate uuids.
    uuid: (len = 7) ->
      chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
      radix = chars.length
      (
        chars[ 0 | Math.random()*radix ] for i in [0...len]
      ).join('')
  
  
    # --------------------------------------------------------------------------  
    
    # ## Private
    
    # localStorage proxy methods
    _getItem    : (key)         -> window.localStorage.getItem(key)
    _setItem    : (key, value)  -> window.localStorage.setItem key, value
    _removeItem : (key)         -> window.localStorage.removeItem(key)
    _key        : (nr)          -> window.localStorage.key(nr)
    _length     : ()            -> window.localStorage.length
    _clear      : ()            -> window.localStorage.clear()
    
    # more advanced localStorage wrappers to load/store objects
    _setObject  : (type, id, object) ->
      key = "#{type}/#{id}"
      store = $.extend {}, object
      delete store.type
      delete store.id
      @_setItem key, JSON.stringify store
    _getObject  : (type, id) ->
      key = "#{type}/#{id}"
      json = @_getItem(key)
      if json
        obj = JSON.parse(json)
        obj.type  = type
        obj.id    = id
        obj
      else
        false
  
    #
    _now: -> new Date
  
    # only lowercase letters and numbers are allowed for keys
    _is_valid_key: (key) ->
      /^[a-z0-9]+$/.test key
      
    _is_semantic_id: (key) ->
      /^[a-z0-9]+\/[a-z0-9]+$/.test key
    
    #
    _deferred: $.Deferred

    # cache of localStorage for quicker access
    _cached: {}
  
    # map of dirty objects by their ids
    _dirty: {}
  

    # document key index
    #
    # TODO: make this cachy
    _index: ->
      @_key(i) for i in [0...@_length()]