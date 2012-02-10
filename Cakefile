{print} = require 'util'
{spawn} = require 'child_process'

timeout = null
build = (callback, watch = false) ->
  if watch
    coffee = spawn 'coffee', ['-c', '-o', 'lib', '-w', '.']
  else
    coffee = spawn 'coffee', ['-c', '-o', 'lib', '.']
  
  coffee.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  coffee.stdout.on 'data', (data) ->
    print data.toString()
    
    if callback and watch
      clearTimeout timeout
      timeout = setTimeout callback, 100
    
  coffee.on 'exit', (code) ->
    callback?() if code is 0

test = ->
  phantom = spawn 'phantomjs', ['lib/phantomjs_test_runner.coffee', 'test.html']
  
  phantom.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  phantom.stdout.on 'data', (data) ->
    print data.toString()

task 'build', 'Build lib/', ->
  build()

task 'watch', 'Build lib/ and watch for changes', ->
  build(null, true)
  
task 'test', 'test', ->
  test()
    
task 'autotest', 'autotest', ->
  build( test, true)