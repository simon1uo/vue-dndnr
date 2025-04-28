# Development Guidelines

This document outlines the coding standards and best practices for contributing to the Vue DnDnR project.

## Vue API Imports

- Always import Vue APIs directly from "vue" package
- Import statements should be organized alphabetically

## Reactivity

- Prefer `ref` over `reactive` whenever possible
- Use `shallowRef` over `ref` when deep reactivity is not needed
- When deep reactivity is required, use explicitly named `deepRef` instead of `ref` for clarity

## Function Arguments

- Use options object pattern for function arguments to support future extensions
- Make parameters explicit and typed
- Keep options extensible for future additions

## Browser APIs and Global Variables

- Use `configurableWindow` when accessing global variables like `window`
- This ensures flexibility for:
  - Multi-window environments
  - Testing with mocks
  - Server-Side Rendering (SSR)
- For experimental Web APIs, always provide `isSupported` flag

## Watchers and Effects

- When using `watch` or `watchEffect`, make configuration options available
- Always expose `immediate` and `flush` options when applicable
- Consider the timing and performance implications of watcher options

## Cleanup and Side Effects

- Use `tryOnUnmounted` to handle cleanup
- Always clean up side effects (event listeners, subscriptions, etc.)
- Ensure proper resource management to prevent memory leaks

## Logging and Debugging

- Avoid using `console.log` statements in production code
- Use proper error handling and debugging tools instead
- Implement appropriate error boundaries where necessary

## Asynchronous Operations

- Return `PromiseLike` for async operations
- Properly type async function return values
- Handle error cases appropriately

## Type Safety

- Leverage TypeScript's type system
- Provide proper type definitions for public APIs
- Use explicit return types for functions

Remember that these guidelines are meant to ensure:

- Consistent code style
- Better maintainability
- Improved testing capabilities
- Enhanced developer experience
