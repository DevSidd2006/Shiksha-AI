#include <jni.h>
#include <android/log.h>
#include <algorithm>
#include <atomic>
#include <climits>
#include <mutex>
#include <string>
#include <vector>

#include "llama.h"

static constexpr const char * TAG = "LlamaBridgeNative";

static std::string g_model_path = "";
static bool g_backend_initialized = false;
static bool g_initialized = false;
static std::atomic<bool> g_stop_requested(false);

static std::mutex g_mutex;
static struct llama_model * g_model = nullptr;
static struct llama_context * g_ctx = nullptr;

namespace {
constexpr int32_t kDefaultContext = 1024;
constexpr int32_t kDefaultThreads = 4;
constexpr int32_t kBatchCapacity = 8;

void loge(const char * msg) {
  __android_log_print(ANDROID_LOG_ERROR, TAG, "%s", msg);
}

void freeModelLocked() {
  if (g_ctx != nullptr) {
    llama_free(g_ctx);
    g_ctx = nullptr;
  }
  if (g_model != nullptr) {
    llama_model_free(g_model);
    g_model = nullptr;
  }
  g_initialized = false;
}

bool decodeToken(struct llama_context * ctx, struct llama_batch & batch, llama_token token, llama_pos pos) {
  batch.n_tokens = 1;
  batch.token[0] = token;
  batch.pos[0] = pos;
  batch.n_seq_id[0] = 1;
  batch.seq_id[0][0] = 0;
  batch.logits[0] = 1;
  const int32_t decodeStatus = llama_decode(ctx, batch);
  return decodeStatus == 0;
}

std::string tokenToString(const struct llama_vocab * vocab, llama_token token) {
  std::vector<char> piece(128);
  int32_t pieceLen = llama_token_to_piece(vocab, token, piece.data(), static_cast<int32_t>(piece.size()), 0, true);

  if (pieceLen < 0) {
    piece.resize(static_cast<size_t>(-pieceLen));
    pieceLen = llama_token_to_piece(vocab, token, piece.data(), static_cast<int32_t>(piece.size()), 0, true);
  }

  if (pieceLen <= 0) {
    return "";
  }

  return std::string(piece.data(), piece.data() + pieceLen);
}
} // namespace

extern "C" JNIEXPORT jboolean JNICALL
Java_com_shiksha_ai_LlamaBridgeModule_nativeInit(JNIEnv * env, jobject /* this */, jstring modelPath) {
  const char * path = env->GetStringUTFChars(modelPath, nullptr);
  if (path == nullptr) {
    loge("modelPath was null");
    return JNI_FALSE;
  }

  std::lock_guard<std::mutex> guard(g_mutex);
  const std::string nextModelPath(path);
  env->ReleaseStringUTFChars(modelPath, path);

  if (nextModelPath.empty()) {
    loge("Model path is empty");
    return JNI_FALSE;
  }

  if (!g_backend_initialized) {
    llama_backend_init();
    g_backend_initialized = true;
  }

  const bool sameModel = g_initialized && nextModelPath == g_model_path;
  if (sameModel) {
    __android_log_print(ANDROID_LOG_INFO, TAG, "Model already initialized: %s", g_model_path.c_str());
    return JNI_TRUE;
  }

  freeModelLocked();
  g_model_path = nextModelPath;
  g_stop_requested.store(false);

  auto modelParams = llama_model_default_params();
  modelParams.n_gpu_layers = 0;

  g_model = llama_model_load_from_file(g_model_path.c_str(), modelParams);
  if (g_model == nullptr) {
    loge("Failed to load GGUF model from file");
    return JNI_FALSE;
  }

  auto ctxParams = llama_context_default_params();
  ctxParams.n_ctx = kDefaultContext;
  ctxParams.n_batch = kBatchCapacity;
  ctxParams.n_ubatch = kBatchCapacity;
  ctxParams.no_perf = true;

  g_ctx = llama_init_from_model(g_model, ctxParams);
  if (g_ctx == nullptr) {
    loge("Failed to create llama context");
    freeModelLocked();
    return JNI_FALSE;
  }

  llama_set_n_threads(g_ctx, kDefaultThreads, kDefaultThreads);
  g_initialized = true;
  __android_log_print(ANDROID_LOG_INFO, TAG, "Initialized llama model: %s", g_model_path.c_str());
  return JNI_TRUE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_shiksha_ai_LlamaBridgeModule_nativeGenerate(JNIEnv * env, jobject /* this */, jstring prompt, jint maxTokens, jdouble temperature) {
  std::unique_lock<std::mutex> guard(g_mutex);
  if (!g_initialized || g_ctx == nullptr || g_model == nullptr) {
    return env->NewStringUTF("Llama model is not initialized");
  }

  const char * promptChars = env->GetStringUTFChars(prompt, nullptr);
  std::string input = promptChars ? promptChars : "";
  if (promptChars != nullptr) {
    env->ReleaseStringUTFChars(prompt, promptChars);
  }

  if (input.empty()) {
    return env->NewStringUTF("");
  }

  const struct llama_vocab * vocab = llama_model_get_vocab(g_model);
  if (vocab == nullptr) {
    return env->NewStringUTF("Tokenizer vocabulary unavailable.");
  }

  const int32_t needed = llama_tokenize(vocab, input.c_str(), static_cast<int32_t>(input.size()), nullptr, 0, true, true);
  if (needed == 0 || needed == INT32_MIN) {
    return env->NewStringUTF("Prompt tokenization failed.");
  }
  if (needed < 0) {
    return env->NewStringUTF("Prompt too large for tokenizer.");
  }

  std::vector<llama_token> promptTokens(static_cast<size_t>(needed));
  const int32_t promptCount = llama_tokenize(
      vocab,
      input.c_str(),
      static_cast<int32_t>(input.size()),
      promptTokens.data(),
      static_cast<int32_t>(promptTokens.size()),
      true,
      true);
  if (promptCount <= 0) {
    return env->NewStringUTF("Prompt tokenization failed.");
  }

  llama_memory_clear(llama_get_memory(g_ctx), true);

  struct llama_batch batch = llama_batch_init(1, 0, 1);
  if (batch.token == nullptr || batch.pos == nullptr || batch.n_seq_id == nullptr || batch.seq_id == nullptr || batch.logits == nullptr) {
    if (batch.token != nullptr || batch.pos != nullptr || batch.n_seq_id != nullptr || batch.seq_id != nullptr || batch.logits != nullptr) {
      llama_batch_free(batch);
    }
    return env->NewStringUTF("Failed to allocate llama batch.");
  }

  int32_t position = 0;
  for (int32_t i = 0; i < promptCount; ++i) {
    if (!decodeToken(g_ctx, batch, promptTokens[static_cast<size_t>(i)], position++)) {
      llama_batch_free(batch);
      return env->NewStringUTF("Failed to evaluate prompt.");
    }
  }

  auto samplerParams = llama_sampler_chain_default_params();
  struct llama_sampler * sampler = llama_sampler_chain_init(samplerParams);
  if (sampler == nullptr) {
    llama_batch_free(batch);
    return env->NewStringUTF("Failed to initialize sampler.");
  }

  const float temp = static_cast<float>(temperature);
  if (temp > 0.0f) {
    llama_sampler_chain_add(sampler, llama_sampler_init_temp(temp));
    llama_sampler_chain_add(sampler, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));
  } else {
    llama_sampler_chain_add(sampler, llama_sampler_init_greedy());
  }

  std::string output;
  const int32_t maxToGenerate = std::max(1, static_cast<int32_t>(maxTokens));

  g_stop_requested.store(false);
  for (int32_t i = 0; i < maxToGenerate; ++i) {
    if (g_stop_requested.load()) {
      break;
    }

    llama_token next = llama_sampler_sample(sampler, g_ctx, -1);
    if (llama_vocab_is_eog(vocab, next)) {
      break;
    }

    output += tokenToString(vocab, next);

    if (!decodeToken(g_ctx, batch, next, position++)) {
      break;
    }
  }

  llama_sampler_free(sampler);
  llama_batch_free(batch);

  if (output.empty()) {
    output = "(No output generated)";
  }

  __android_log_print(ANDROID_LOG_INFO, TAG, "Generated response (%zu chars)", output.size());
  return env->NewStringUTF(output.c_str());
}

extern "C" JNIEXPORT void JNICALL
Java_com_shiksha_ai_LlamaBridgeModule_nativeStop(JNIEnv * /* env */, jobject /* this */) {
  std::lock_guard<std::mutex> guard(g_mutex);
  g_stop_requested.store(true);
  freeModelLocked();
  g_model_path = "";
  __android_log_print(ANDROID_LOG_INFO, TAG, "Stopped llama bridge");
}
