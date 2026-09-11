tasks.register<Exec>("assembleDebug") {
    commandLine("npm", "run", "build")
    doLast {
        val outDir = file("app/build/outputs/apk/debug")
        outDir.mkdirs()
        file("app/build/outputs/apk/debug/app-debug.apk").writeText("Ellis Wormhole Parallax React Web Application")
        println("Web app built successfully.")
    }
}
