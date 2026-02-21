cmake_minimum_required(VERSION 3.18)
project(llamabridge)

add_library(llamabridge SHARED LlamaBridgeNative.cpp)

set(LLAMA_CPP_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/llama.cpp" CACHE PATH "Path to llama.cpp source tree")

if(EXISTS "${LLAMA_CPP_ROOT}/CMakeLists.txt")
  set(LLAMA_BUILD_TESTS OFF CACHE BOOL "" FORCE)
  set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
  set(LLAMA_BUILD_SERVER OFF CACHE BOOL "" FORCE)
  set(LLAMA_BUILD_TOOLS OFF CACHE BOOL "" FORCE)
  set(LLAMA_BUILD_COMMON OFF CACHE BOOL "" FORCE)
  set(LLAMA_CURL OFF CACHE BOOL "" FORCE)

  add_subdirectory(${LLAMA_CPP_ROOT} llama_cpp_build EXCLUDE_FROM_ALL)
  target_link_libraries(llamabridge llama)
  target_include_directories(llamabridge PRIVATE "${LLAMA_CPP_ROOT}/include")
else()
  message(FATAL_ERROR "llama.cpp not found at ${LLAMA_CPP_ROOT}. Clone it before building.")
endif()

find_library(log-lib log)

target_link_libraries(llamabridge ${log-lib})

target_compile_features(llamabridge PRIVATE cxx_std_17)

set_target_properties(llamabridge PROPERTIES
  POSITION_INDEPENDENT_CODE ON
)
