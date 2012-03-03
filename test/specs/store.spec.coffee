define 'specs/store', ['store', 'couchapp'], (Store, couchApp) ->
  
  describe "Store", ->  
    beforeEach ->
      @store = new Store uuid: -> 'abc'
      
      spyOn(@store, "_getItem").andCallThrough()
      spyOn(@store, "_setItem").andCallThrough()
      spyOn(@store, "_removeItem").andCallThrough()
      spyOn(@store, "_clear").andCallThrough()

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
      
          # keep promise, key, and stored object for assertions
          @promise = @store.save 'document', '123', { name: 'test' }
          [@key, object_string] = @store._setItem.mostRecentCall.args
          @object = JSON.parse object_string

        it "should save a document with key '123'", ->
          expect(@key).toBe 'document/123'

        it "should save a document with name = 'test'", ->
          expect(@object.name).toBe 'test'
      
        it "should add timestamps", ->
          expect(@object.updated_at).toBe 'now'
          expect(@object.created_at).toBe 'now'
      
        _when "successful", ->
          beforeEach ->
            @success = jasmine.createSpy 'success'
            @promise.done @success
            @args = @success.mostRecentCall?.args[0]
      
          it "should call done callback", ->
            expect(@success).wasCalled()
      
          it "should pass the object to done callback", ->
            expect(@args.name).toBe 'test'
        
          it "should add the id to passed object", ->
            expect(@args.id).toBe '123'
        
          it "should add the id to passed object", ->
            expect(@args.type).toBe 'document'
      
        _when "failed", ->
          beforeEach ->
            @store._setItem.andCallFake -> throw new Error "i/o error"
      
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
          [key, object_string] = @store._setItem.mostRecentCall.args
          @object = JSON.parse object_string
    
        it "should store the object without the id attribute", ->
          expect(@object.id).toBeUndefined()
    
        it "should store the object without the type attribute", ->
          expect(@object.type).toBeUndefined()
  
      it "should not overwrite created_at attribute", ->
        @store.save 'document', '123', { created_at: 'check12'  }
        [key, object_string] = @store._setItem.mostRecentCall.args
        object = JSON.parse object_string
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
            [@key, object_string] = @store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
      
          it "should generate an id", ->
            expect(@key).toMatch /^document\/[a-z0-9]{7}$/
    
        _and "object has an id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save 'document', { name: 'test', id: 'exists' }
            [@key, object_string] = @store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
        
          it "should get the id", ->
            expect(@key).toBe 'document/exists'
  
      _when "called without type and id", ->
        _and "object has no id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save name: 'test', type: 'document'
            [@key, object_string] = @store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
      
          it "should generate an id and get the type from object", ->
            expect(@key).toMatch /^document\/[a-z0-9]{7}$/
    
        _and "object has an id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @store.save name: 'test', type: 'document', id: 'exists'
            [@key, object_string] = @store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
        
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
        
      _when "object can be found", ->
        beforeEach ->
          spyOn(@store, "cache").andReturn name: 'test'

          @promise = @store.load 'document', 'abc4567'
          @success = jasmine.createSpy 'success'
          @promise.done @success
          @object = @success.mostRecentCall.args[0]
    
        it "should call the done callback", ->
          expect(@success).wasCalled()
      
        it "should set id attribute", ->
          expect(@object.id).toBe 'abc4567'
    
        it "should set type attribute", ->
          expect(@object.type).toBe 'document'
      
      _when "object cannot be found", ->
        beforeEach ->
          spyOn(@store, "cache").andReturn false
      
          @promise = @store.load 'document', 'abc4567'
          @error = jasmine.createSpy 'error'
          @promise.fail @error
      
        it "should call the fail callback", ->
          expect(@error).wasCalled()
  
      it "should cache the object after the first get", ->
        @store.load 'document', 'abc4567'
        @store.load 'document', 'abc4567'
    
        expect(@store._getItem.callCount).toBe 1
        
      describe "aliases", ->
        it "should allow to use .create", ->
          expect(@store.get).toBe @store.load
        it "should allow to use .update", ->
          expect(@store.read).toBe @store.load
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
            expect(results[0].id).toBe '123'
      
      _when "called with type = 'cat'", ->
        with_2_cats_and_3_dogs ->
          it "should return only the cat objects", ->
            success = jasmine.createSpy 'success'
            promise = @store.loadAll('cat')
            promise.done success
            results = success.mostRecentCall.args[0]
            expect(results.length).toBe 2
            
      describe "aliases", ->
        it "should allow to use .create", ->
          expect(@store.getAll).toBe @store.loadAll
        it "should allow to use .update", ->
          expect(@store.readAll).toBe @store.loadAll
      # /aliases
    # /.loadAll(type)

    describe ".destroy(type, id)", ->
      it "should return a promise", ->
        promise = @store.destroy 'document', '123'
        do expect(promise.done).toBeDefined
        do expect(promise.fail).toBeDefined
  
      it "should have more specs"
      
      describe "aliases", ->
        it "should allow to use .create", ->
          expect(@store.delete).toBe @store.destroy
      # /aliases
    # /.destroy(type, id)

    describe ".clear()", ->
      it "should have some specs"
    # /.clear()

    describe ".is_dirty(type, id)", ->
      it "should have some specs"
    # /.is_dirty(type, id)

    describe ".changed(type, id, value)", ->
      it "should have some specs"
    # /.changed(type, id, value)

    describe ".is_marked_as_deleted(type, id)", ->
      it "should have some specs"
    # /.is_marked_as_deleted(type, id)

    describe ".clear_changed()", ->
      it "should have some specs"
    # /.clear_changed()
    
    describe ".uuid(num = 7)", ->
      it "should default to a length of 7", ->
        expect(@store.uuid().length).toBe 7
      
      _when "called with num = 5", ->
        it "should generate an id with length = 5", ->
          expect(@store.uuid(5).length).toBe 5
    # /.uuid(num)
  # /.store