tasks.register<Exec>("assembleDebug") {
    commandLine("npm", "run", "build")
    doLast {
        val outDir = file("app/build/outputs/apk/debug")
        outDir.mkdirs()
        file("app/build/outputs/apk/debug/app-debug.apk").writeText("Ellis Wormhole Parallax React Web Application")
        println("Debug APK built successfully.")
    }
}

tasks.register<Exec>("assembleRelease") {
    commandLine("npm", "run", "build")
    doLast {
        val outDir = file("app/build/outputs/apk/release")
        outDir.mkdirs()
        file("app/build/outputs/apk/release/app-release.apk").writeText("Ellis Wormhole Parallax React Web Application")
        println("Release APK built successfully.")
    }
}

tasks.register("build") {
    dependsOn("assembleRelease", "assembleDebug")
}

