import { combineReducers } from 'redux';
// import userReducer from './userReducer/reducer';

const rootReducer = combineReducers({
  userinfo: ()=>{
    return {
      userinfo: {
        name: '张三',
        age: 18,
      },
    };
  },
});

const whitelist = ['userinfo'];

export { rootReducer, whitelist };

export type RootState = ReturnType<typeof rootReducer>;
