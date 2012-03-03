#
# Events
# ------
#
# extend any Class with support for
#
# * `object.bind('event', cb)`
# * `object.unbind('event', cb)`
# * `object.trigger('event', args...)`
# * `object.one('ev', cb)`
#
# based on [Events implementations from Spine](https://github.com/maccman/spine/blob/master/src/spine.coffee#L1)
#

define 'events', ->
  
  'use strict'
  
  Events =
  

    #
    # `object.bind 'cheat', blame`
    #
    bind: (ev, callback) ->
      evs   = ev.split(' ')
      calls = @hasOwnProperty('_callbacks') and @_callbacks or= {}

      for name in evs
        calls[name] or= []
        calls[name].push(callback)
      
      return this

    #
    # `object.one 'ground_touch', game_over`
    #
    one: (ev, callback) ->
      @bind ev, ->
        @unbind(ev, arguments.callee)
        callback.apply(@, arguments)


    #
    # `object.trigger 'win', score: 1230`
    #
    trigger: (args...) ->
      ev = args.shift()

      list = @hasOwnProperty('_callbacks') and @_callbacks?[ev]
      return unless list

      for callback in list
        if callback.apply(@, args) is false
          break
        
      return true
 

    #
    # `object.unbind 'move'`
    #
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
      
      return this
  
  Events