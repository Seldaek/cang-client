define 'mocks/couchapp', ->
  class couchAppMock
    couchDB_url : 'http://my.cou.ch'
    
    trigger     : ->
    request     : ->
    on          : ->
    promise     : $.Deferred
    store       :
      db :
        getItem    : ->
        setItem    : ->
        removeItem : ->