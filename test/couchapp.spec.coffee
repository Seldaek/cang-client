describe "couchApp", ->
  beforeEach ->
    @app = new couchApp '/path/to/couch'
    
    spyOn(@app.store, "_getItem").andCallThrough()
    spyOn(@app.store, "_setItem").andCallThrough()
    spyOn(@app.store, "_removeItem").andCallThrough()
    spyOn(@app.store, "_clear").andCallThrough()
    
  
  describe ".store", ->
    describe ".save(id, type, object)", ->
      _when "id is '123', type is 'document', object is {name: 'test'}", ->
        beforeEach ->
          @promise = @app.store.save '123', 'document', { name: 'test' }
          [@key, object_string] = @app.store._setItem.mostRecentCall.args
          @object = JSON.parse object_string

        it "should save a document with key '123'", ->
          expect(@key).toBe '123'
          
        it "should save a document with _id = '123'", ->
          expect(@object._id).toBe '123'
                    
        it "should save a document with type = 'document'", ->
          expect(@object.type).toBe 'document'

        it "should save a document with name = 'test'", ->
          expect(@object.name).toBe 'test'
          
        it "should add timestamps", ->
          json_date_pattern = /\d\d\d\d\-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ/
          expect(@object.updated_at).toMatch json_date_pattern
          expect(@object.created_at).toMatch json_date_pattern
        
        it "should return a promise", ->
          do expect(@promise.done).toBeDefined
          do expect(@promise.fail).toBeDefined
          
        _when "successful", ->
          it "should call done callback", ->
            success = jasmine.createSpy 'success'
            @promise.done success
            expect(success).wasCalled()
        
        _when "failed", ->
          beforeEach ->
            @app.store._setItem.andCallFake -> throw new Error "i/o error"
          
          it "should call fail callback", ->
            promise = @app.store.save '123', 'document', { name: 'test' }
            error = jasmine.createSpy 'error'
            promise.fail error
            expect(error).wasCalled()
    # /.save(id, type, object)
  # /.store
# /couchApp