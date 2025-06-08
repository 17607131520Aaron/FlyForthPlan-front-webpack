import {
    legacy_createStore as legacyCreateStore,
    applyMiddleware,
    Action,
    Reducer,
    Store,
  } from 'redux';
  import { createTransform, persistReducer, persistStore, PersistConfig } from 'redux-persist';
  import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
  import { thunk } from 'redux-thunk';
  import { rootReducer, whitelist } from './store';
  
  // 创建存储引擎
  const createNoopStorage = () => {
    return {
      getItem(): Promise<string | null> {
        return Promise.resolve(null);
      },
      setItem(_key: string, value: unknown): Promise<unknown> {
        return Promise.resolve(value);
      },
      removeItem(): Promise<void> {
        return Promise.resolve();
      },
    };
  };
  
  /**
   * 根据当前环境选择使用 sessionStorage 还是无操作存储。
   * 如果在浏览器环境中，则使用 sessionStorage；否则使用无操作存储。
   */
  const webStorage =
    typeof window !== 'undefined' ? createWebStorage('session') : createNoopStorage();
  
  /**
   * 创建一个自定义转换器，用于序列化和反序列化状态。
   * 这里简单地返回输入的状态，可以根据需要进行更复杂的转换。
   */
  const transform = createTransform(
    (inboundState) => inboundState, // 序列化
    (outboundState) => outboundState, // 反序列化
  );
  
  // 配置持久化
  const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
    key: 'asp-admin-xms',
    storage: webStorage,
    transforms: [transform],
    whitelist: [...whitelist],
  };
  
  interface ISPayloadAction<T = Record<string, unknown>> extends Action<string> {
    payload: T;
  }
  
  const persistedReducer = persistReducer<ReturnType<typeof rootReducer>, ISPayloadAction>(
    persistConfig,
    rootReducer as unknown as Reducer<ReturnType<typeof rootReducer>, ISPayloadAction>,
  );
  
  // 创建 store，应用中间件
  const store = legacyCreateStore(persistedReducer, applyMiddleware(thunk));
  
  const persist = persistStore(store as Store<ReturnType<typeof rootReducer>, Action>);
  
  export { store, persist };
  