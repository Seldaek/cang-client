#
# borrowed from http://spinejs.com/
#
Events =
  bind: (ev, callback) ->
    evs   = ev.split(' ')
    calls = @hasOwnProperty('_callbacks') and @_callbacks or= {}

    for name in evs
      calls[name] or= []
      calls[name].push(callback)
    this

  one: (ev, callback) ->
    @bind ev, ->
      @unbind(ev, arguments.callee)
      callback.apply(@, arguments)

  trigger: (args...) ->
    ev = args.shift()

    list = @hasOwnProperty('_callbacks') and @_callbacks?[ev]
    return unless list

    for callback in list
      if callback.apply(@, args) is false
        break
    true

  unbind: (ev, callback) ->
    unless ev
      @_callbacks = {}
      return this

    list = @_callbacks?[ev]
    return this unless list

    unless callback
      delete @_callbacks[ev]
      return this

    for cb, i in list when cb is callback
      list = list.slice()
      list.splice(i, 1)
      @_callbacks[ev] = list
      break
    this
    

#
# Store
#
# window.localStrage wrapper and more
#
class Store
  
  constructor : (@couch) ->
    
    # if browser does not support local storage,
    # e.g. Safari in private mode, overite the 
    # respective methods
    unless @supports_local_storage()
      @_getItem    = -> null
      @_setItem    = -> null
      @_removeItem = -> null
      @_key        = -> null
      @_length     = -> 0
      @_clear      = -> null
    
  ##
  # save an object
  #
  # extends object with `_id`, `type`, `updated_at`, `created_at`
  # and stores it in localStorage
  save: (type, id, object) ->
    def = @_deferred()
    
    #
    # if called without an id, get it from object.
    # if called without id and type, get both from object
    #
    switch arguments.length
      when 2
        object  = id
        id      = object.id
      when 1
        object  = type
        type    = object.type
        id      = object.id
    
    #
    # catch invalid object error
    #
    unless typeof object is 'object'
      def.reject INVALID_ARGUMENTS_ERROR "object is #{typeof object}"
      return def
      
    #
    # if object has no id, generate one
    #
    id ||= @couch.uuid()
    
    #
    # validate id & type
    #
    unless @_is_valid_key id
      def.reject INVALID_KEY_ERROR id: id
      return def
    unless @_is_valid_key type
      def.reject INVALID_KEY_ERROR type: type
      return def
    
    #
    # use semantic Ids
    # e.g. "document/123"
    #
    key = "#{type}/#{id}"
    
    #
    # add timestamps.
    #
    object.created_at ||= object.updated_at = @_now()
    
    #
    # remove `id` and `type` attributes.
    # document key contains this information
    #
    delete object.id
    delete object.type
    
    #
    # try to write to localStorage. 
    #
    try
      @_setItem key, JSON.stringify object
      
      #
      # add id & type to returned object
      #
      object.id   = id
      object.type = type
      
      def.resolve object
    catch error
      def.reject error
    
    return def
    
  ##
  #
  get : (type, id) ->
    def = @_deferred()
    
    # catch invalid arguments
    unless typeof type is 'string' and typeof id is 'string'
      def.reject INVALID_ARGUMENTS_ERROR "type & id are required"
      return def
    
    #
    # try to read from localStorage. 
    #
    try
      object = @cache type, id
      
      #
      # if object cannot be found, call the error callback
      #
      unless object
        def.reject NOT_FOUND_ERROR type, id
        return def

      #
      # add id & type to returned object
      #
      object.id   = id
      object.type = type

      def.resolve object
    catch error
      def.reject error
      
    return def
  
  ##
  #
  getAll: (type) ->
    def = @_deferred()
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

      def.resolve(results)
    catch error
      def.reject error
    
    return def
    
  ##
  #
  destroy: (type, id) ->
    def = @_deferred()

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
      
      def.resolve object
    else
      def.reject NOT_FOUND_ERROR type, id
    
    return def
    
  # alias
  delete: destroy
    
  ##
  # cache(key, value, options = {})
  #
  # loads a key only once from localStorage and caches it for
  # faster future access. When value is passed, update cache.
  #
  # unless options.remote is true, check if object is dirty
  cache : (type, id, value = false, options = {}) ->
    key = "#{type}/#{id}"
    
    #
    #
    #
    if value
      @_cached[key] = value
      @_setItem key, JSON.stringify value
        
    else
      return @_cached[key] if @_cached[key]?
      
      json_string = @_getItem key

      if json_string
        
        # cache the object
        @_cached[key] = JSON.parse json_string
        
      else
        # cache a "not found" as well
        @_cached[key] = false
    
    
    if options.remote
      @clear_changed type, id
    else
      if @is_dirty(type, id) or @is_marked_as_deleted(type, id)
        @changed type, id, @_cached[key]
      else
        @clear_changed type, id
        
    @_cached[key]
  
  ##
  # 
  clear_changed: (type, id) ->
    key = "#{type}/#{id}"
    
    if key
      delete @_dirty[key]
    else
      @_dirty = {}
    
    # @trigger 'dirty_change'
    
  ##
  # marked as deleted
  #
  # an object is marked as deleted, when it has a `_deleted:true` attribute
  #
  # 
  is_marked_as_deleted : (type, id) ->
    @cache(type, id)._deleted is true
      
  ##
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
         
  ##
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
  
  ##
  # Store.clear()
  #
  # clears localStorage and cache
  clear: ()->
    def = @_deferred()
    
    try
      @_clear()
      @_cached = {}
      @clear_changed()
      
      def.resolve()
    catch error
      def.reject()
      
    return def
    
  
  ##
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
    
  
  ##
  # localStorage proxy methods
  #
  _getItem    : (key)         -> window.localStorage.getItem(key)
  _setItem    : (key, value)  -> window.localStorage.setItem(key, value)
  _removeItem : (key)         -> window.localStorage.removeItem(key)
  _key        : (nr)          -> window.localStorage.key(nr)
  _length     : ()            -> window.localStorage.length
  _clear      : ()            -> window.localStorage.clear()
  
  ##
  #
  _now: -> new Date
  
  ##
  # only lowercase letters and numbers are allowed for keys
  _is_valid_key: (key) ->
    /^[a-z0-9]+$/.test key

  _is_semantic_id: (key) ->
    /^[a-z0-9]+\/[a-z0-9]+$/.test key
    
  ##
  #
  _deferred: $.Deferred

  ##
  # cache of localStorage for quicker access
  #
  _cached: {}
  
  ##
  # map of dirty objects by their ids
  #
  _dirty: {}
  
  ##
  # document key index
  #
  # TODO: make this cachy
  _index: ->
    @_key(i) for i in [0...@_length()]


##
# couchApp
#
# the door to world domination (apps)
#
class @couchApp extends Events
  
  ##
  # initialization
  #
  constructor : (@couchDB_url) ->
    
    # remove trailing slash(es)
    # TODO: SPEC me
    @couchDB_url = @couchDB_url.replace /\/+$/, ''
    
    @store = new Store this


  ##
  # helper to generate uuids
  #
  # chars define all possible characters a uuid may exist of
  uuid: (len = 7) ->
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
    radix = chars.length
    (
      chars[ 0 | Math.random()*radix ] for i in [0...len]
    ).join('')
  
  
  ##
  # sign up with email & password
  #
  # uses standard couchDB API to create a new document in _users db.
  # The backend will automatically create a userDB based on the email
  # address. (joe@example.com => joe_example_com, tbd)
  #
  # TODO:
  #
  # * start synchronization with userDB
  # * return a custom promise
  #
  sign_up : (email, password) ->
    prefix  = 'org.couchdb.user'
    key     = "#{prefix}:#{email}"
    
    salt          = hex_sha1 @uuid()
    password_sha  = hex_sha1 password + salt
    
    user = 
      _id           : key
      name          : email
      type          : 'user'
      roles         : []
      salt          : salt
      password_sha  : password_sha
    
    $.ajax
      type        : 'PUT'
      url         : "#{@couchDB_url}/_users/#{encodeURIComponent key}"
      data        : JSON.stringify user
      contentType : "application/json"
     
  
  ##
  # sign in with email & password
  #
  # uses standard couchDB API to create a new user session (POST /_session)
  #
  # TODO: 
  #
  # * make sessions persistant, as of now, cooky won't be sent on successive requests
  # * start synchronization with userDB
  # * return a custom promise
  #
  sign_in : (email, password) ->
    
    creds = JSON.stringify
              name      : email
              password  : password
    
    $.ajax
      type        : 'POST'
      url         : "#{@couchDB_url}/_session"
      data        : creds
      contentType : "application/json"
      
  # alias
  login: sign_in
  
  ##
  # change password
  #
  # to be done.
  #
  change_password : (email) ->
    alert('change password is not yet implementd')
    
    # 1. GET user doc
    # 2. update salt + password_sha
    # 3. PUT user doc
    
  
  ##
  # sign out 
  #
  # uses standard couchDB API to destroy a user session (DELETE /_session)
  #
  # TODO:
  #
  # * stop synchronization
  # * return a custom promise
  #
  sign_out: ->
    $.ajax
      type        : 'DELETE'
      url         : "#{@couchDB_url}/_session"
      contentType : "application/json"
  
  # alias
  logout: sign_out
  
##
# Errors
INVALID_KEY_ERROR =  (id_or_type) ->
  key = if id_or_type.id then 'id' else 'type'
  new Error "invalid #{key} '#{id_or_type[key]}': numbers and lowercase letters allowed only"
  
INVALID_ARGUMENTS_ERROR = (msg) ->
  new Error msg
  
NOT_FOUND_ERROR = (type, id) ->
  new Error "#{type} with #{id} could not be found"


