define 'mocks/couchapp', ->
  
  promise_mock =
    reject  : -> promise_mock
    resolve : -> promise_mock
    fail    : -> promise_mock
    done    : -> promise_mock
    
  class couchAppMock
    couchDB_url : 'http://my.cou.ch'
    
    trigger       : ->
    request       : ->
    on            : ->
    promise       : -> promise_mock
    promise_mock  : promise_mock
      
    store         :
      db :
        getItem    : ->
        setItem    : ->
        removeItem : ->