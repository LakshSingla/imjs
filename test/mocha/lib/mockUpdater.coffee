nock = require 'nock'
path = require 'path'
fs   = require 'fs'

UPDATE_ENV_VAR = "IMJS_TESTS_UPDATE"
BUNDLES_FOLDER = path.join __dirname, 'bundledResponses'

shouldUpdate = ->
    process.env[UPDATE_ENV_VAR] is "TRUE"

startUpdater = ->
    if not shouldUpdate()
        return

    nock.recorder.recorder
        output_objects: true

stopUpdater = (bundleName) ->
    if not shouldUpdate()
        return
    
    fullPath = path.join BUNDLES_FOLDER, bundleName
    console.log fullPath
    
    if fs.existsSync fullPath
        newPath = path.join BUNDLES_FOLDER, '.bak.' + bundleName
        try 
            console.log "Bundle already existing. Renaming original #{bundleName} to .bak.#{bundleName}"
            fs.renameSync fullPath, newPath
        catch e then console.log "Unable to rename #{bundleName} to .bak.#{bundleName}"


module.exports =
    startUpdater: startUpdater
    stopUpdater: stopUpdater
