#
# window.localStrage wrapper and more
#

define 'store', ['errors'], (ERROR) ->
  
  'use strict'
  
  class Store
  
    # ## Constructor
    #
    constructor : () ->
    
      # if browser does not support local storage persistence,
      # e.g. Safari in private mode, overite the respective methods. 
      unless @supports_local_storage()
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
    
      key = "#{type}/#{id}"
    
      # add timestamps.
      object.created_at ||= object.updated_at = @_now()
    
      # remove `id` and `type` attributes before saving,
      # as the Store key contains this information
      delete object.id
      delete object.type
    
      try
        @_setItem key, JSON.stringify object
      
        # assure returned object has id & type attributes
        object.id   = id
        object.type = type
      
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
    load : (type, id) ->
      promise = @_deferred()
    
      # catch invalid arguments
      unless typeof type is 'string' and typeof id is 'string'
        promise.reject ERROR.INVALID_ARGUMENTS "type & id are required"
        return promise
    
      #
      # try to read from localStorage. 
      #
      try
        object = @cache type, id
      
        #
        # if object cannot be found, call the error callback
        #
        unless object
          promise.reject ERROR.NOT_FOUND type, id
          return promise

        #
        # add id & type to returned object
        #
        object.id   = id
        object.type = type

        promise.resolve object
      catch error
        promise.reject error
      
      return promise
      
    # aliases
    get : @::load
    read: @::load
  
    # ## loadAll
    #
    # loads all objects of `type`
    loadAll: (type) ->
      promise = @_deferred()
      keys = @_index()
    
      try
      
        #
        # when type is set, return results filtered by type
        # otherwise return them all
        #
        results = for key in keys when (type is undefined or key.indexOf(type) is 0) and @_is_semantic_id key
          [_type, id] = key.split '/'
        
          object = @cache _type, id
          object.id   = id
          object.type = _type
        
          object

        promise.resolve(results)
      catch error
        promise.reject error
    
      return promise
    
    # alias
    getAll : @::loadAll
    readAll: @::loadAll
    
    # ## Destroy
    #
    # destroys one object specified by `type` and `id`
    destroy: (type, id) ->
      promise = @_deferred()

      #
      # does object exist at aill?
      #
      object = @cache type, id
      if object
      
        #
        # if object has been synched before, only mark it as deleted
        #
        if object._rev
          object._deleted = true
          @cache type, id, object
        
        #
        # otherwise: kick it
        #
        else
          key = "#{type}/#{id}"
          @_removeItem key
      
          delete @_cached[key]
          @clear_changed type, id
      
        promise.resolve object
      else
        promise.reject ERROR.NOT_FOUND type, id
    
      return promise
    
    # alias
    delete: @::destroy
    
    # ## Cache
    #
    # loads an object specified by `type` and `id` only once from localStorage 
    # and caches it for faster future access. Updates cache when `value` is passed.
    #
    # Also check if object needs to be synched (dirty) or not 
    #
    # Pass `options.remote = true` when update comes from remote
    cache : (type, id, value = false, options = {}) ->
      key = "#{type}/#{id}"
    
      if value
        @_cached[key] = value
        @_setItem key, JSON.stringify value
        
        if options.remote
          @clear_changed type, id 
          return value
      
      else
        return @_cached[key] if @_cached[key]?
    
        json_string = @_getItem key
        if json_string
          @_cached[key] = JSON.parse json_string
        else
          @_cached[key] = false # cache a "not found" as well
    
      if @is_dirty(type, id) or @is_marked_as_deleted(type, id)
        @changed type, id, @_cached[key]
      else
        @clear_changed type, id
        
      @_cached[key]
  
    #
    # 
    clear_changed: (type, id) ->
      key = "#{type}/#{id}"
    
      if key
        delete @_dirty[key]
      else
        @_dirty = {}
    
      # @trigger 'dirty_change'
    
    #
    # marked as deleted
    #
    # an object is marked as deleted, when it has a `_deleted:true` attribute
    #
    # 
    is_marked_as_deleted : (type, id) ->
      @cache(type, id)._deleted is true
      
    #
    # Store.changed(id, value)
    #
    # returns a map of dirty object id's
    _dirty_timeout = null
    changed: (type, id, value) ->
      key = "#{type}/#{id}"
    
      if value
        
        @_dirty[key] = value
      
        # @trigger 'dirty_change'
        window.clearTimeout @_dirty_timeout
        @_dirty_timeout = window.setTimeout ( => 
          # @trigger 'dirty_idle'
        ), 2000 # 2 seconds timout for `dirty_idle` event
      else
        if arguments.length
          @_dirty[key]
        else
          @_dirty
         
    #
    # is dirty
    #
    is_dirty: (type = null, id = null) ->
      unless type
        return _(@_dirty).keys().length > 0
    
      key = "#{type}/#{id}"
        
      # no synced_at? uuhh, that's dirty.
      return true unless @cache(type, id).synced_at
    
      # no updated_at? no dirt then
      return false unless @cache(type, id).updated_at
    
      @cache(type, id).synced_at  = Date.parse @cache(type, id).synced_at unless @cache(type, id).synced_at instanceof Date
      @cache(type, id).updated_at = Date.parse @cache(type, id).updated_at unless @cache(type, id).updated_at instanceof Date
    
      # we compare last sync with last updated and give sync an aditional .1 second
      @cache(type, id).synced_at.getTime() + 100 < @cache(type, id).updated_at.getTime()
  
    #
    # Store.clear()
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
        promise.reject()
      
      return promise
    
  
    #
    #
    # inspired by this cappuccino commit
    # https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
    #
    supports_local_storage : ->
    
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
    
    
    # helper to generate uuids
    #
    # chars define all possible characters a uuid may exist of
    uuid: (len = 7) ->
      chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
      radix = chars.length
      (
        chars[ 0 | Math.random()*radix ] for i in [0...len]
      ).join('')
  
    #
    # localStorage proxy methods
    #
    _getItem    : (key)         -> window.localStorage.getItem(key)
    _setItem    : (key, value)  -> window.localStorage.setItem(key, value)
    _removeItem : (key)         -> window.localStorage.removeItem(key)
    _key        : (nr)          -> window.localStorage.key(nr)
    _length     : ()            -> window.localStorage.length
    _clear      : ()            -> window.localStorage.clear()
  
    #
    #
    _now: -> new Date
  
    #
    # only lowercase letters and numbers are allowed for keys
    _is_valid_key: (key) ->
      /^[a-z0-9]+$/.test key

    _is_semantic_id: (key) ->
      /^[a-z0-9]+\/[a-z0-9]+$/.test key
    
    #
    #
    _deferred: $.Deferred

    #
    # cache of localStorage for quicker access
    #
    _cached: {}
  
    #
    # map of dirty objects by their ids
    #
    _dirty: {}
  
    #
    # document key index
    #
    # TODO: make this cachy
    _index: ->
      @_key(i) for i in [0...@_length()]