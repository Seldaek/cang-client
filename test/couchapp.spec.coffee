describe "couchApp", ->
  beforeEach ->
    @app = new couchApp '/path/to/couch'
    
    spyOn(@app.store, "_getItem").andCallThrough()
    spyOn(@app.store, "_setItem").andCallThrough()
    spyOn(@app.store, "_removeItem").andCallThrough()
    spyOn(@app.store, "_clear").andCallThrough()
    
    @app.store.clear()
    
  
  describe ".store", ->
    describe ".uuid(num = 7)", ->
      it "should default to a length of 7", ->
        expect(@app.store.uuid().length).toBe 7
        
      _when "called with num = 5", ->
        it "should generate an id with length = 5", ->
          expect(@app.store.uuid(5).length).toBe 5
    # /.uuid(num)
    
    describe ".save(type, id, object)", ->
      it "should return a promise", ->
        promise = @app.store.save 'document', '123', name: 'test'
        do expect(promise.done).toBeDefined
        do expect(promise.fail).toBeDefined
      
      describe "invalid arguments", ->
        _when "no arguments passed", ->          
          it "should call the fail callback", ->
            promise = @app.store.save()
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
        
        _when "no object passed", ->
          it "should call the fail callback", ->
            promise = @app.store.save 'document', 'abc4567'
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
        
      _when "id is '123', type is 'document', object is {name: 'test'}", ->
        beforeEach ->
          # fake date timestamps
          spyOn(@app.store, "_now").andReturn 'now'
          
          # keep promise, key, and stored object for assertions
          @promise = @app.store.save 'document', '123', { name: 'test' }
          [@key, object_string] = @app.store._setItem.mostRecentCall.args
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
            @app.store._setItem.andCallFake -> throw new Error "i/o error"
          
          it "should call fail callback", ->
            promise = @app.store.save 'document', '123', { name: 'test' }
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
      
      _when "id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", ->
        beforeEach ->
          # fake date timestamps
          spyOn(@app.store, "_now").andReturn 'now'
          
          # keep promise, key, and stored object for assertions
          @app.store.save 'document', '123', {id: '123', type: 'document', name: 'test'}
          [key, object_string] = @app.store._setItem.mostRecentCall.args
          @object = JSON.parse object_string
        
        it "should store the object without the id attribute", ->
          expect(@object.id).toBeUndefined()
        
        it "should store the object without the type attribute", ->
          expect(@object.type).toBeUndefined()
      
      it "should not overwrite created_at attribute", ->
        @app.store.save 'document', '123', { created_at: 'check12'  }
        [key, object_string] = @app.store._setItem.mostRecentCall.args
        object = JSON.parse object_string
        expect(object.created_at).toBe 'check12'
        
      it "should allow numbers and lowercase letters for for type & id only", ->
        invalid = ['UPPERCASE', 'under_lines', '-?&$']
        
        for key in invalid
          spy = jasmine.createSpy "fail with key = #{key}"
          promise = @app.store.save key, 'valid', {}
          promise.fail spy
          expect(spy).wasCalled()
        
        for key in invalid
          spy = jasmine.createSpy "fail with key = #{key}"
          promise = @app.store.save 'valid', key, {}
          promise.fail spy
          expect(spy).wasCalled()
      
      _when "called without id", ->
        _and "object has no id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @app.store.save 'document', { name: 'test' }
            [@key, object_string] = @app.store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
          
          it "should generate an id", ->
            expect(@key).toMatch /^document\/[a-z0-9]{7}$/
        
        _and "object has an id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @app.store.save 'document', { name: 'test', id: 'exists' }
            [@key, object_string] = @app.store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
            
          it "should get the id", ->
            expect(@key).toBe 'document/exists'
      
      _when "called without type and id", ->
        _and "object has no id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @app.store.save name: 'test', type: 'document'
            [@key, object_string] = @app.store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
          
          it "should generate an id and get the type from object", ->
            expect(@key).toMatch /^document\/[a-z0-9]{7}$/
        
        _and "object has an id", ->
          beforeEach ->
            # keep promise, key, and stored object for assertions
            promise = @app.store.save name: 'test', type: 'document', id: 'exists'
            [@key, object_string] = @app.store._setItem.mostRecentCall.args
            @object = JSON.parse object_string
            
          it "should get id and type form object", ->
            expect(@key).toBe 'document/exists'
    # /.save(id, type, object)
    
    describe ".get(type, id)", ->
      it "should return a promise", ->
        promise = @app.store.get 'document', '123'
        do expect(promise.done).toBeDefined
        do expect(promise.fail).toBeDefined
      
      describe "invalid arguments", ->
        _when "no arguments passed", ->          
          it "should call the fail callback", ->
            promise = @app.store.get()
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()

        _when "no id passed", ->
          it "should call the fail callback", ->
            promise = @app.store.get 'document'
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
            
      _when "object can be found", ->
        beforeEach ->
          object = name: 'test'
          @app.store._getItem.andReturn JSON.stringify object
          @promise = @app.store.get 'document', 'abc4567'
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
          @app.store._getItem.andReturn null
          @promise = @app.store.get 'document', 'abc4567'
          @error = jasmine.createSpy 'error'
          @promise.fail @error
          
        it "should call the fail callback", ->
          expect(@error).wasCalled()
      
      it "should cache the object after the first get", ->
        @app.store.get 'document', 'abc4567'
        @app.store.get 'document', 'abc4567'
        
        expect(@app.store._getItem.callCount).toBe 1
    # /.get(type, id)
  # /.store
# /couchApp