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
  
  constructor : () ->
    
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
  # the object be extend with `_id`, `type`, `updated_at`, `created_at`
  save: (id, type, object) ->
    def = $.Deferred()
    
    object._id  = id
    object.type = type
    
    object.created_at ||= object.updated_at = new Date
    
    try
      @_setItem id, JSON.stringify object
      def.resolve object
    catch error
      def.reject error
    
    
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
# couchApp
#
# the door to world domination (apps)
#
class @couchApp extends Events
  
  ##
  # initialization
  #
  constructor : (couchDB_url) ->

    @store = new Store couchDB_url

