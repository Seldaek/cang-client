define 'specs/store', ['store', 'mocks/couchapp'], (Store, couchAppMock) ->
  
  describe "Store", ->  
    beforeEach ->
      @app = new couchAppMock 
      @store = new Store @app
      
      spyOn(@store, "_setObject").andCallThrough()
      spyOn(@store, "_getObject").andCallThrough()
      
      spyOn(@store.db, "getItem").andCallThrough()
      spyOn(@store.db, "setItem").andCallThrough()
      # spyOn(@store, "_removeItem").andCallThrough()
      spyOn(@store.db, "clear").andCallThrough()

    describe ".save(type, id, object)", ->
      it "should return a promise", ->
        promise = @store.save 'document', '123', name: 'test'
        do expect(promise.done).toBeDefined
        do expect(promise.fail).toBeDefined
  
      describe "invalid arguments", ->
        _when "no arguments passed", ->          
          it "should call the fail callback", ->
            promise = @store.save()
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
    
        _when "no object passed", ->
          it "should call the fail callback", ->
            promise = @store.save 'document', 'abc4567'
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
    
      _when "id is '123', type is 'document', object is {name: 'test'}", ->
        beforeEach ->
          # fake date timestamps
          spyOn(@store, "_now").andReturn 'now'
          spyOn(@store, "cache").andReturn 'cached_object'
      
          # keep promise, key, and stored object for assertions
          @promise = @store.save 'document', '123', { name: 'test' }

        it "should cache document", ->
          expect(@store.cache).wasCalled()
      
        it "should add timestamps", ->
          expect(@store.cache).wasCalledWith 'document', '123', { name: 'test', created_at: 'now', updated_at: 'now' }
      
        _when "successful", ->
          beforeEach ->
            @success = jasmine.createSpy 'success'
            @promise.done @success
            @args = @success.mostRecentCall?.args[0]
      
          it "should call done callback", ->
            expect(@success).wasCalled()
      
          it "should pass the object to done callback", ->
            expect(@args).toBe 'cached_object'
      
        _when "failed", ->
          beforeEach ->
            @store.cache.andCallFake -> throw new Error "i/o error"
      
          it "should call fail callback", ->
            promise = @store.save 'document', '123', { name: 'test' }
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
  
      _when "id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", ->
        beforeEach ->
          # fake date timestamps
          spyOn(@store, "_now").andReturn 'now'
      
          # keep promise, key, and stored object for assertions
          @store.save 'document', '123', {id: '123', type: 'document', name: 'test'}
          [key, @object] = @store.db.setItem.mostRecentCall.args
    
        it "should store the object without the id attribute", ->
          expect(@object.id).toBeUndefined()
    
        it "should store the object without the type attribute", ->
          expect(@object.type).toBeUndefined()
      
      it "should not overwrite created_at attribute", ->
        @store.save 'document', '123', { created_at: 'check12'  }
        [type, id, object] = @store._setObject.mostRecentCall.args
        expect(object.created_at).toBe 'check12'
    
      it "should allow numbers and lowercase letters for for type & id only", ->
        invalid = ['UPPERCASE', 'under_lines', '-?&$']
    
        for key in invalid
          spy = jasmine.createSpy "fail with key = #{key}"
          promise = @store.save key, 'valid', {}
          promise.fail spy
          expect(spy).wasCalled()
    
        for key in invalid
          spy = jasmine.createSpy "fail with key = #{key}"
          promise = @store.save 'valid', key, {}
          promise.fail spy
          expect(spy).wasCalled()
  
      _when "called without id", ->
        _and "object has no id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save 'document', { name: 'test' }
            [@key, @object] = @store.db.setItem.mostRecentCall.args
      
          it "should generate an id", ->
            expect(@key).toMatch /^document\/[a-z0-9]{7}$/
    
        _and "object has an id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save 'document', { name: 'test', id: 'exists' }
            [@key, @object] = @store.db.setItem.mostRecentCall.args
        
          it "should get the id", ->
            expect(@key).toBe 'document/exists'
        
        _and "object has an _id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save 'document', { name: 'test', _id: 'exists' }
            [@key, @object] = @store.db.setItem.mostRecentCall.args
        
          it "should get the id", ->
            expect(@key).toBe 'document/exists'
  
      _when "called without type and id", ->
        _and "object has no id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save name: 'test', type: 'document'
            [@key, @object] = @store.db.setItem.mostRecentCall.args
      
          it "should generate an id and get the type from object", ->
            expect(@key).toMatch /^document\/[a-z0-9]{7}$/
    
        _and "object has an id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save name: 'test', type: 'document', id: 'exists'
            [@key, @object] = @store.db.setItem.mostRecentCall.args
        
          it "should get id and type form object", ->
            expect(@key).toBe 'document/exists'
         
        _and "object has an _id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save name: 'test', type: 'document', _id: 'exists'
            [@key, @object] = @store.db.setItem.mostRecentCall.args
        
          it "should get id and type form object", ->
            expect(@key).toBe 'document/exists'
            
      describe "aliases", ->
        it "should allow to use .create", ->
          expect(@store.save).toBe @store.create
        it "should allow to use .update", ->
          expect(@store.save).toBe @store.create
      # /aliases
    # /.save(id, type, object)

    describe ".load(type, id)", ->
      beforeEach ->
        spyOn(@store, "cache").andCallThrough()
      
      it "should return a promise", ->
        promise = @store.load 'document', '123'
        do expect(promise.done).toBeDefined
        do expect(promise.fail).toBeDefined
  
      describe "invalid arguments", ->
        _when "no arguments passed", ->          
          it "should call the fail callback", ->
            promise = @store.load()
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()

        _when "no id passed", ->
          it "should call the fail callback", ->
            promise = @store.load 'document'
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
            
      it "should allow to pass an object as paramter {type: 'car', id: 'abc4567'}", ->
        @store.load {type: 'car', id: 'abc4567'}
        expect(@store.cache).wasCalled()
      
        
      _when "object can be found", ->
        beforeEach ->
          @store.cache.andReturn name: 'test'

          @promise = @store.load 'document', 'abc4567'
          @success = jasmine.createSpy 'success'
          @promise.done @success
          @object = @success.mostRecentCall.args[0]
    
        it "should call the done callback", ->
          expect(@success).wasCalled()
      
      _when "object cannot be found", ->
        beforeEach ->
          @store.cache.andReturn false
      
          @promise = @store.load 'document', 'abc4567'
          @error = jasmine.createSpy 'error'
          @promise.fail @error
      
        it "should call the fail callback", ->
          expect(@error).wasCalled()
  
      it "should cache the object after the first get", ->
        @store.load 'document', 'abc4567'
        @store.load 'document', 'abc4567'
    
        expect(@store.db.getItem.callCount).toBe 1
        
      describe "aliases", ->
        it "should allow to use .get", ->
          expect(@store.get).toBe @store.load
      # /aliases
    # /.get(type, id)

    describe ".loadAll(type)", ->
      with_2_cats_and_3_dogs = (specs) ->
        _and "two cat and three dog objects exist in the store", ->
          beforeEach ->
            spyOn(@store, "_index").andReturn ["cat/1", "cat/2", "dog/1", "dog/2", "dog/3"]
            spyOn(@store, "cache").andReturn name: 'becks'
        
          specs()
  
  
      it "should return a promise", ->
        promise = @store.loadAll 'document'
        do expect(promise.done).toBeDefined
        do expect(promise.fail).toBeDefined
    
      _when "called without a type", ->
        with_2_cats_and_3_dogs ->
          it "should return'em all", ->
            success = jasmine.createSpy 'success'
            promise = @store.loadAll()
            promise.done success
            results = success.mostRecentCall.args[0]
            expect(results.length).toBe 5
        
        _and "no documents exist in the store", ->          
          beforeEach ->
            spyOn(@store, "_index").andReturn []
      
          it "should return an empty array", ->
            success = jasmine.createSpy 'success'
            promise = @store.loadAll()
            promise.done success
            expect(success).wasCalledWith []
    
        _and "there are other documents in localStorage not stored with store", ->
          beforeEach ->
            spyOn(@store, "_index").andReturn ["_some_config", "some_other_shizzle", "whatever", "valid/123"]
            spyOn(@store, "cache").andReturn {}
      
          it "should not return them", ->
            success = jasmine.createSpy 'success'
            promise = @store.loadAll()
            promise.done success
            results = success.mostRecentCall.args[0]
            expect(results.length).toBe 1
      
      _when "called with type = 'cat'", ->
        with_2_cats_and_3_dogs ->
          it "should return only the cat objects", ->
            success = jasmine.createSpy 'success'
            promise = @store.loadAll('cat')
            promise.done success
            results = success.mostRecentCall.args[0]
            expect(results.length).toBe 2
            
      describe "aliases", ->
        it "should allow to use .getAll", ->
          expect(@store.getAll).toBe @store.loadAll
      # /aliases
    # /.loadAll(type)

    describe ".delete(type, id)", ->
      it "should return a promise", ->
        promise = @store.destroy 'document', '123'
        do expect(promise.done).toBeDefined
        do expect(promise.fail).toBeDefined
  
      it "should have more specs"
      
      describe "aliases", ->
        it "should allow to use .destroy", ->
          expect(@store.delete).toBe @store.destroy
      # /aliases
    # /.destroy(type, id)

    describe ".cache(type, id, object)", ->
      beforeEach ->
        spyOn(@store, "mark_as_changed")
        spyOn(@store, "clear_changed")
        spyOn(@store, "is_dirty")
        spyOn(@store, "is_marked_as_deleted")
        @store._cached = {}
        
      _when "object passed", ->
        it "should write the object to localStorage, but without type & id attributes", ->
          @store.cache('couch', '123', color: 'red')
          expect(@store.db.setItem).wasCalledWith 'couch/123', '{"color":"red"}'
          
        _when "`options.remote = true` passed", ->
          it "should clear changed object", ->
            @store.cache('couch', '123', {color: 'red'}, remote: true)
            expect(@store.clear_changed).wasCalledWith 'couch', '123'
      
      _when "no object passed", ->
        _and "object is already cached", ->
          beforeEach ->
            @store._cached['couch/123'] = color: 'red'
          
          it "should not load it from localStorage", ->
            @store.cache 'couch', '123'
            expect(@store.db.getItem).wasNotCalled()
            
        _and "object is not yet cached", ->
          beforeEach ->
            delete @store._cached['couch/123']
          
          _and "object does exist in localStorage", ->
            beforeEach ->
              @store._getObject.andReturn color: 'red'
            
            it "should cache it for future", ->
              @store.cache 'couch', '123'
              expect(@store._cached['couch/123'].color).toBe 'red'
            
          _and "object does not exist in localStorage", ->
            beforeEach ->
              @store._getObject.andReturn false
            
            it "should cache it for future", ->
              @store.cache 'couch', '123'
              expect(@store._cached['couch/123']).toBe false
              
            it "should return false", ->
              expect(@store.cache 'couch', '123').toBe false
            
      
      _when "object is dirty", ->
        beforeEach -> @store.is_dirty.andReturn true
        
        it "should mark it as changed", ->
          @store.cache 'couch', '123'
          expect(@store.mark_as_changed).wasCalledWith 'couch', '123', color: 'red', type: 'couch', id: '123'
      
      _when "object is not dirty", ->
        beforeEach -> @store.is_dirty.andReturn false
        
        _and "not marked as deleted", ->
          beforeEach -> @store.is_marked_as_deleted.andReturn false
          
          it "should clean it", ->
            @store.cache 'couch', '123'
            expect(@store.clear_changed).wasCalledWith 'couch', '123'
            
        _but "marked as deleted", ->
          beforeEach -> @store.is_marked_as_deleted.andReturn true
        
          it "should mark it as changed", ->
            @store.cache 'couch', '123'
            expect(@store.mark_as_changed).wasCalledWith 'couch', '123', color: 'red', type: 'couch', id: '123'
      
      it "should return the object including type & id attributes", ->
        obj = @store.cache 'couch', '123', color: 'red'
        expect(obj.color).toBe  'red'
        expect(obj.type).toBe   'couch'
        expect(obj.id).toBe     '123'
      
    # /.cache(type, id, object)

    describe ".clear()", ->
      beforeEach ->

        spyOn(@store, "_promise").andReturn
          resolve: jasmine.createSpy 'resolve'
          reject:  jasmine.createSpy 'reject'
      
      it "should return a promise", ->
        promise = @store.clear()
        expect(promise).toBe @store._promise()
        
      it "should clear localStorage", ->
        @store.clear()
        do expect(@store.db.clear).wasCalled
      
      it "should clear chache", ->
        @store._cached = 'funky'
        @store.clear()      
        expect($.isEmptyObject @store._cached).toBeTruthy()

      it "should clear dirty docs", ->
        spyOn(@store, "clear_changed")
        @store.clear()      
        do expect(@store.clear_changed).wasCalled
        
      it "should resolve promise", ->
        @store.clear()      
        do expect(@store._promise().resolve).wasCalled
      
      _when "an error occurs", ->
        beforeEach ->
          spyOn(@store, "clear_changed").andCallFake -> throw new Error('ooops')
        
        it "should reject the promise", ->
          @store.clear()      
          do expect(@store._promise().reject).wasCalled
    # /.clear()

    describe ".is_dirty(type, id)", ->
      _when "no arguments passed", ->
        it "returns true when there are no dirty documents", ->
          @store._dirty ={}
          expect(@store.is_dirty()).toBeTruthy()
          
      _when "type & id passed", ->
        _and "object was not yet synced", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn synced_at: undefined
          
          it "should return true", ->
            do expect(@store.is_dirty 'couch', '123').toBeTruthy
        
        _and "object was synced", ->
          _and "object was not updated yet", ->
            beforeEach ->
              spyOn(@store, "cache").andReturn 
                synced_at : new Date(0)
                updated_at: undefined
            
            it "should return false", ->
              do expect(@store.is_dirty 'couch', '123').toBeFalsy
              
          _and "object was updated at the same time", ->
            beforeEach ->
              spyOn(@store, "cache").andReturn 
                synced_at : new Date(0)
                updated_at: new Date(0)
                
            it "should return false", ->
              do expect(@store.is_dirty 'couch', '123').toBeFalsy
              
          _and "object was updated later", ->
            beforeEach ->
              spyOn(@store, "cache").andReturn 
                synced_at : new Date(0)
                updated_at: new Date(1)
                
            it "should return true", ->
              do expect(@store.is_dirty 'couch', '123').toBeTruthy
            
            
    # /.is_dirty(type, id)
    
    describe ".mark_as_changed(type, id, object)", ->
      beforeEach ->
        @store._dirty = {}
        
        spyOn(window, "setTimeout").andReturn 'new_timeout'
        spyOn(window, "clearTimeout")
        spyOn(@app, "trigger")
        @store.mark_as_changed 'couch', '123', color: 'red'
      
      it "should add it to the dirty list", ->
        expect(@store._dirty['couch/123'].color).toBe 'red'
        
      it "should should trigger an `store:dirty` event", ->
        expect(@app.trigger).wasCalledWith 'store:dirty'
        
      it "should start dirty timeout for 2 seconds", ->
        args = window.setTimeout.mostRecentCall.args
        expect(args[1]).toBe 2000
        expect(@store._dirty_timeout).toBe 'new_timeout'
        
      it "should clear dirty timeout", ->
        @store._dirty_timeout = 'timeout'
        @store.mark_as_changed 'couch', '123', color: 'red'
        expect(window.clearTimeout).wasCalledWith 'timeout'
    # /.mark_as_changed(type, id, object)
    
    describe ".changed_docs()", ->
      _when "there are no changed docs", ->
        beforeEach ->
          @store._dirty = {}
          
        it "should return an empty array", ->
          expect($.isArray @store.changed_docs()).toBeTruthy()
          expect(@store.changed_docs().length).toBe 0
          
      _when "there are 2 dirty docs", ->
        beforeEach ->
          @store._dirty = [
            { type: 'couch', id: '123', color: 'red'}
            { type: 'couch', id: '456', color: 'green'}
          ]
          
        it "should return the two docs", ->
          expect(@store.changed_docs().length).toBe 2
    # /.changed_docs()

    describe ".is_marked_as_deleted(type, id)", ->
      _when "object 'couch/123' is marked as deleted", ->
        beforeEach ->
          spyOn(@store, "cache").andReturn _deleted: true
        
        it "should return true", ->
          @store.is_marked_as_deleted('couch', '123')
          
      _when "object 'couch/123' isn't marked as deleted", ->
        beforeEach ->
          spyOn(@store, "cache").andReturn {}
          
        it "should return false", ->
          @store.is_marked_as_deleted('couch', '123')
    # /.is_marked_as_deleted(type, id)

    describe ".clear_changed(type, id)", ->
      _when "type & id passed", ->
        it "should remove the respective object from the dirty list", ->
          @store._dirty['couch/123'] = {color: 'red'}
          @store.clear_changed 'couch', 123
          expect(@store._dirty['couch/123']).toBeUndefined()
      
      _when "no arguments passed", ->
        it "should remove all objects from the dirty list", ->
          @store._dirty =
            'couch/123': color: 'red'
            'couch/456': color: 'green'
          @store.clear_changed()
          do expect($.isEmptyObject @store._dirty).toBeTruthy
        
      it "should trigger a `store:dirty` event", ->
        spyOn(@app, "trigger")
        @store.clear_changed()
        expect(@app.trigger).wasCalledWith 'store:dirty'
    # /.clear_changed()
    
    describe ".uuid(num = 7)", ->
      it "should default to a length of 7", ->
        expect(@store.uuid().length).toBe 7
      
      _when "called with num = 5", ->
        it "should generate an id with length = 5", ->
          expect(@store.uuid(5).length).toBe 5
    # /.uuid(num)
  # /Store