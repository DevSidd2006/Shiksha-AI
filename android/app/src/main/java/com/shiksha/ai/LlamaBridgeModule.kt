package com.shiksha.ai

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Executors

@ReactModule(name = LlamaBridgeModule.NAME)
class LlamaBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "LlamaBridge"
  }

  private val executor = Executors.newSingleThreadExecutor()
  private var initialized = false

  init {
    System.loadLibrary("llamabridge")
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun init(modelPath: String, promise: Promise) {
    executor.execute {
      try {
        initialized = nativeInit(modelPath)
        promise.resolve(initialized)
      } catch (error: Throwable) {
        promise.reject("INIT_FAILED", "Failed to initialize llama", error)
      }
    }
  }

  @ReactMethod
  fun generate(prompt: String, maxTokens: Int, temperature: Double, promise: Promise) {
    executor.execute {
      try {
        if (!initialized) {
          promise.reject("NOT_INITIALIZED", "Llama model is not initialized")
          return@execute
        }
        val result = nativeGenerate(prompt, maxTokens, temperature)
        promise.resolve(result)
      } catch (error: Throwable) {
        promise.reject("GENERATE_FAILED", "Failed to run llama inference", error)
      }
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    executor.execute {
      try {
        nativeStop()
        initialized = false
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("STOP_FAILED", "Failed to stop llama", error)
      }
    }
  }

  private external fun nativeInit(modelPath: String): Boolean
  private external fun nativeGenerate(prompt: String, maxTokens: Int, temperature: Double): String
  private external fun nativeStop()
}
